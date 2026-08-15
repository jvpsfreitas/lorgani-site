/* ============================================================
   L'Organi Flow — Servidor
   Fase A: autenticação com sessões, papéis de acesso (RBAC),
   auditoria e API real de Contatos/Kanban.
   Endurecimento: captura global de erros + throttle de login.
   Módulo Estoque: insumos, movimentos, resumo.
   Serve o protótipo (index.html) após login.
   ============================================================ */
const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const PORTA = process.env.PORTA || 3000;

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_SENHA || '',
  database: 'lorgani_flow',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4'
});

const app = express();
app.set('trust proxy', 1);          // IP correto atrás de proxy/roteador (para auditoria e throttle)
app.use(express.json());
app.use(session({
  secret: process.env.SESSAO_SEGREDO || 'troque-este-segredo-lorgani',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 10,     // 10 horas (turno da clínica)
    httpOnly: true,                  // JS do navegador não lê o cookie (anti-XSS)
    sameSite: 'lax',                 // reduz risco de CSRF
    secure: process.env.HTTPS === '1' // ligar quando servir por HTTPS
  }
}));

/* ============================================================
   Utilidade: wrapper que captura erros de rotas async.
   No Express 4, uma promise rejeitada dentro de um handler async
   NÃO é capturada sozinha e a requisição trava sem resposta.
   Envolvemos cada handler com w(...) para encaminhar o erro ao
   middleware de erro global (definido no fim do arquivo).
   ============================================================ */
const w = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/* ---------- auditoria ---------- */
async function auditar(req, acao, alvo, detalhe) {
  try {
    await db.query(
      'INSERT INTO auditoria (usuario_id, acao, alvo, detalhe, ip) VALUES (?,?,?,?,?)',
      [req.session.usuario ? req.session.usuario.id : null, acao, alvo || null,
       detalhe ? JSON.stringify(detalhe).slice(0, 900) : null, req.ip]
    );
  } catch (e) { console.error('auditoria falhou:', e.message); }
}

/* ---------- middlewares de acesso ---------- */
function exigeLogin(req, res, next) {
  if (req.session.usuario) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ erro: 'não autenticado' });
  return res.redirect('/login.html');
}
function exigePapel(...papeis) {
  return (req, res, next) => {
    if (!req.session.usuario) return res.status(401).json({ erro: 'não autenticado' });
    if (papeis.includes(req.session.usuario.papel) || req.session.usuario.papel === 'admin') return next();
    return res.status(403).json({ erro: 'sem permissão para este módulo' });
  };
}

/* ============================================================
   Throttle de login (proteção contra força bruta).
   Em memória, por IP: após MAX_TENT falhas dentro de JANELA,
   bloqueia por JANELA. Reseta ao logar com sucesso.
   Suficiente para um servidor único de clínica (1 processo).
   ============================================================ */
const MAX_TENT = 5;
const JANELA = 15 * 60 * 1000;       // 15 minutos
const TENTATIVAS = new Map();        // ip -> { n, ate }

function loginBloqueado(ip) {
  const t = TENTATIVAS.get(ip);
  if (!t) return false;
  if (Date.now() > t.ate) { TENTATIVAS.delete(ip); return false; }
  return t.n >= MAX_TENT;
}
function registraFalha(ip) {
  const t = TENTATIVAS.get(ip) || { n: 0, ate: Date.now() + JANELA };
  t.n += 1;
  t.ate = Date.now() + JANELA;
  TENTATIVAS.set(ip, t);
}
function limpaTentativas(ip) { TENTATIVAS.delete(ip); }

/* ---------- autenticação ---------- */
app.post('/api/login', w(async (req, res) => {
  if (loginBloqueado(req.ip)) {
    await auditar(req, 'login_bloqueado', req.body && req.body.email);
    return res.status(429).json({ erro: 'muitas tentativas. Aguarde 15 minutos e tente de novo.' });
  }
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'informe e-mail e senha' });

  const [rows] = await db.query('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email.trim().toLowerCase()]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(senha, u.senha_hash))) {
    registraFalha(req.ip);
    await auditar(req, 'login_falhou', email);
    return res.status(401).json({ erro: 'e-mail ou senha incorretos' });
  }
  limpaTentativas(req.ip);
  req.session.usuario = { id: u.id, nome: u.nome, papel: u.papel, tour_visto: u.tour_visto };
  await auditar(req, 'login', email);
  res.json({ ok: true, usuario: req.session.usuario });
}));

app.post('/api/logout', (req, res) => {
  const email = req.session.usuario ? req.session.usuario.nome : null;
  auditar(req, 'logout', email);
  req.session.destroy(() => res.json({ ok: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.usuario) return res.status(401).json({ erro: 'não autenticado' });
  res.json(req.session.usuario);
});

// Marca que o usuário já viu o tour de boas-vindas (não mostra de novo).
app.post('/api/tour-visto', exigeLogin, w(async (req, res) => {
  await db.query('UPDATE usuarios SET tour_visto = 1 WHERE id = ?', [req.session.usuario.id]);
  req.session.usuario.tour_visto = 1;
  res.json({ ok: true });
}));

/* ---------- usuários (somente admin) ---------- */
app.get('/api/usuarios', exigePapel('admin'), w(async (req, res) => {
  const [rows] = await db.query('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios ORDER BY nome');
  res.json(rows);
}));
app.post('/api/usuarios', exigePapel('admin'), w(async (req, res) => {
  const { nome, email, senha, papel } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, e-mail e senha são obrigatórios' });
  const hash = await bcrypt.hash(senha, 10);
  try {
    await db.query('INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?,?,?,?)',
      [nome, email.trim().toLowerCase(), hash, papel || 'recepcao']);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'já existe um usuário com este e-mail' });
    throw e;
  }
  await auditar(req, 'usuario_criado', email);
  res.json({ ok: true });
}));

/* ---------- contatos / CRM (recepção, médicos e admin) ---------- */
app.get('/api/contatos', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM contatos ORDER BY atualizado_em DESC');
  res.json(rows);
}));
app.post('/api/contatos', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const { nome, whatsapp, convenio } = req.body || {};
  if (!nome) return res.status(400).json({ erro: 'nome é obrigatório' });
  const [r] = await db.query('INSERT INTO contatos (nome, whatsapp, convenio) VALUES (?,?,?)',
    [nome, whatsapp || null, convenio || 'Particular']);
  await db.query('INSERT INTO eventos_contato (contato_id, titulo, detalhe) VALUES (?,?,?)',
    [r.insertId, 'Contato criado', 'por ' + req.session.usuario.nome]);
  await auditar(req, 'contato_criado', nome);
  res.json({ ok: true, id: r.insertId });
}));
app.patch('/api/contatos/:id/etapa', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const { etapa } = req.body || {};
  const validas = ['novo', 'conversa', 'qualificado', 'agendado', 'atendido', 'recorrente'];
  if (!validas.includes(etapa)) return res.status(400).json({ erro: 'etapa inválida' });
  await db.query('UPDATE contatos SET etapa = ? WHERE id = ?', [etapa, req.params.id]);
  await db.query('INSERT INTO eventos_contato (contato_id, titulo, detalhe) VALUES (?,?,?)',
    [req.params.id, 'Movido para ' + etapa, 'por ' + req.session.usuario.nome]);
  await auditar(req, 'kanban_movido', 'contato #' + req.params.id, { etapa });
  res.json({ ok: true });
}));
app.get('/api/contatos/:id/eventos', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query('SELECT * FROM eventos_contato WHERE contato_id = ? ORDER BY criado_em DESC', [req.params.id]);
  res.json(rows);
}));

/* ---------- notas do paciente (registro rico) ---------- */
app.get('/api/contatos/:id/notas', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query(
    `SELECT n.id, n.texto, n.criado_em, u.nome AS autor
       FROM notas n LEFT JOIN usuarios u ON u.id = n.autor_id
      WHERE n.contato_id = ? ORDER BY n.criado_em DESC`, [req.params.id]);
  res.json(rows);
}));
app.post('/api/contatos/:id/notas', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const texto = req.body && req.body.texto ? String(req.body.texto).trim().slice(0, 1000) : '';
  if (!texto) return res.status(400).json({ erro: 'a nota não pode ser vazia' });
  const [r] = await db.query('INSERT INTO notas (contato_id, texto, autor_id) VALUES (?,?,?)',
    [req.params.id, texto, req.session.usuario.id]);
  await auditar(req, 'nota_criada', 'contato #' + req.params.id);
  res.json({ ok: true, id: r.insertId });
}));
app.delete('/api/notas/:id', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const [r] = await db.query('DELETE FROM notas WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'nota não encontrada' });
  await auditar(req, 'nota_excluida', 'nota #' + req.params.id);
  res.json({ ok: true });
}));

/* ---------- tarefas do paciente ---------- */
app.get('/api/contatos/:id/tarefas', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query(
    `SELECT t.id, t.titulo, t.feita, t.vencimento, t.feita_em, t.criado_em, u.nome AS autor
       FROM tarefas t LEFT JOIN usuarios u ON u.id = t.autor_id
      WHERE t.contato_id = ? ORDER BY t.feita, t.vencimento IS NULL, t.vencimento, t.id DESC`, [req.params.id]);
  res.json(rows);
}));
app.post('/api/contatos/:id/tarefas', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const titulo = req.body && req.body.titulo ? String(req.body.titulo).trim().slice(0, 200) : '';
  if (!titulo) return res.status(400).json({ erro: 'informe o título da tarefa' });
  const [r] = await db.query('INSERT INTO tarefas (contato_id, titulo, vencimento, autor_id) VALUES (?,?,?,?)',
    [req.params.id, titulo, (req.body && req.body.vencimento) || null, req.session.usuario.id]);
  await auditar(req, 'tarefa_criada', 'contato #' + req.params.id, { titulo });
  res.json({ ok: true, id: r.insertId });
}));
app.patch('/api/tarefas/:id', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const feita = (req.body && (req.body.feita === 1 || req.body.feita === true || req.body.feita === '1')) ? 1 : 0;
  const [r] = await db.query('UPDATE tarefas SET feita = ?, feita_em = ? WHERE id = ?',
    [feita, feita ? new Date() : null, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'tarefa não encontrada' });
  await auditar(req, 'tarefa_status', 'tarefa #' + req.params.id, { feita });
  res.json({ ok: true });
}));
app.delete('/api/tarefas/:id', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const [r] = await db.query('DELETE FROM tarefas WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'tarefa não encontrada' });
  await auditar(req, 'tarefa_excluida', 'tarefa #' + req.params.id);
  res.json({ ok: true });
}));

/* ============================================================
   ESTOQUE — insumos e movimentações
   Leitura: qualquer usuário logado.
   Escrita: recepção e financeiro (admin sempre pode).
   ============================================================ */

// Lista de insumos, com sinalização de itens abaixo do mínimo (1 = repor).
app.get('/api/insumos', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query(
    `SELECT id, nome, lote, validade, quantidade, minimo, custo_unit,
            (quantidade <= minimo) AS abaixo_minimo
       FROM insumos
      ORDER BY (quantidade <= minimo) DESC, nome`);
  res.json(rows);
}));

// Resumo para o dashboard/estoque.
app.get('/api/estoque/resumo', exigeLogin, w(async (req, res) => {
  const [[r]] = await db.query(
    `SELECT COUNT(*)                                                AS itens,
            COALESCE(SUM(quantidade <= minimo), 0)                  AS abaixo_minimo,
            COALESCE(SUM(quantidade * COALESCE(custo_unit, 0)), 0)  AS valor_estoque,
            COALESCE(SUM(validade IS NOT NULL
                     AND validade <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)), 0) AS vencendo_30d
       FROM insumos`);
  res.json(r);
}));

// Cria um insumo.
app.post('/api/insumos', exigePapel('recepcao', 'financeiro'), w(async (req, res) => {
  const { nome, lote, validade, quantidade, minimo, custo_unit } = req.body || {};
  if (!nome || !String(nome).trim()) return res.status(400).json({ erro: 'nome é obrigatório' });
  const q = Number.isInteger(quantidade) ? quantidade : parseInt(quantidade, 10) || 0;
  const m = Number.isInteger(minimo) ? minimo : parseInt(minimo, 10) || 0;
  if (q < 0 || m < 0) return res.status(400).json({ erro: 'quantidade e mínimo não podem ser negativos' });
  const [r] = await db.query(
    'INSERT INTO insumos (nome, lote, validade, quantidade, minimo, custo_unit) VALUES (?,?,?,?,?,?)',
    [String(nome).trim(), lote || null, validade || null, q, m, custo_unit != null ? custo_unit : null]);
  await auditar(req, 'insumo_criado', nome, { id: r.insertId, quantidade: q });
  res.json({ ok: true, id: r.insertId });
}));

// Edita dados cadastrais do insumo (NÃO altera quantidade — isso é só via movimento).
app.patch('/api/insumos/:id', exigePapel('recepcao', 'financeiro'), w(async (req, res) => {
  const campos = ['nome', 'lote', 'validade', 'minimo', 'custo_unit'];
  const sets = [];
  const valores = [];
  for (const c of campos) {
    if (req.body && Object.prototype.hasOwnProperty.call(req.body, c)) {
      if (c === 'minimo') {
        const m = parseInt(req.body.minimo, 10);
        if (Number.isNaN(m) || m < 0) return res.status(400).json({ erro: 'mínimo inválido' });
        sets.push('minimo = ?'); valores.push(m);
      } else {
        sets.push(`${c} = ?`); valores.push(req.body[c] === '' ? null : req.body[c]);
      }
    }
  }
  if (!sets.length) return res.status(400).json({ erro: 'nada para atualizar' });
  valores.push(req.params.id);
  const [r] = await db.query(`UPDATE insumos SET ${sets.join(', ')} WHERE id = ?`, valores);
  if (!r.affectedRows) return res.status(404).json({ erro: 'insumo não encontrado' });
  await auditar(req, 'insumo_editado', 'insumo #' + req.params.id, req.body);
  res.json({ ok: true });
}));

// Registra entrada/saída de estoque de forma TRANSACIONAL e sem deixar o saldo negativo.
app.post('/api/insumos/:id/movimento', exigePapel('recepcao', 'financeiro'), w(async (req, res) => {
  const delta = parseInt(req.body && req.body.delta, 10);
  const motivo = req.body && req.body.motivo ? String(req.body.motivo).slice(0, 160) : null;
  if (Number.isNaN(delta) || delta === 0) return res.status(400).json({ erro: 'delta deve ser um inteiro diferente de zero' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [linhas] = await conn.query('SELECT quantidade FROM insumos WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!linhas.length) { await conn.rollback(); return res.status(404).json({ erro: 'insumo não encontrado' }); }

    const nova = linhas[0].quantidade + delta;
    if (nova < 0) {
      await conn.rollback();
      return res.status(400).json({ erro: 'estoque insuficiente', disponivel: linhas[0].quantidade });
    }
    await conn.query('UPDATE insumos SET quantidade = ? WHERE id = ?', [nova, req.params.id]);
    await conn.query(
      'INSERT INTO movimentos_estoque (insumo_id, delta, motivo, usuario_id) VALUES (?,?,?,?)',
      [req.params.id, delta, motivo, req.session.usuario.id]);
    await conn.commit();

    await auditar(req, 'estoque_movimento', 'insumo #' + req.params.id, { delta, nova });
    res.json({ ok: true, quantidade: nova });
  } catch (e) {
    await conn.rollback();
    throw e;                         // deixa o middleware de erro global responder 500
  } finally {
    conn.release();                  // devolve a conexão ao pool sempre
  }
}));

// Histórico de movimentações de um insumo.
app.get('/api/insumos/:id/movimentos', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query(
    `SELECT m.id, m.delta, m.motivo, m.criado_em, u.nome AS usuario
       FROM movimentos_estoque m
       LEFT JOIN usuarios u ON u.id = m.usuario_id
      WHERE m.insumo_id = ?
      ORDER BY m.criado_em DESC`, [req.params.id]);
  res.json(rows);
}));

/* ============================================================
   SALAS DE COWORKING — agenda de ocupação (aluguel das 2 salas)
   Leitura: qualquer usuário logado.
   Escrita (reservar/cancelar): recepção (admin sempre pode).
   Regra central: não pode haver duas reservas na MESMA sala com
   horários que se sobrepõem.
   ============================================================ */

// Lista as salas ativas.
app.get('/api/salas', exigeLogin, w(async (req, res) => {
  const [rows] = await db.query('SELECT id, nome, cor, ativo FROM salas WHERE ativo = 1 ORDER BY nome');
  res.json(rows);
}));

// Lista reservas num intervalo (para desenhar a agenda). Ex.: ?de=2026-07-13&ate=2026-07-20
app.get('/api/reservas', exigeLogin, w(async (req, res) => {
  const de = req.query.de || '1970-01-01';
  const ate = req.query.ate || '2999-12-31';
  const params = [ate, de];               // inicio < ate  AND  fim > de  (sobreposição com a janela)
  let filtroSala = '';
  if (req.query.sala_id) { filtroSala = ' AND r.sala_id = ?'; params.push(req.query.sala_id); }
  const [linhas] = await db.query(
    `SELECT r.id, r.sala_id, s.nome AS sala, s.cor, r.profissional, r.medico_usuario_id,
            r.inicio, r.fim, r.tipo, r.valor, r.status, r.observacoes
       FROM reservas_sala r
       JOIN salas s ON s.id = r.sala_id
      WHERE r.status <> 'cancelado'
        AND r.inicio < ? AND r.fim > ?${filtroSala}
      ORDER BY r.inicio`,
    params);
  res.json(linhas);
}));

// Cria uma reserva, bloqueando choque de horário na mesma sala.
app.post('/api/reservas', exigePapel('recepcao'), w(async (req, res) => {
  const { sala_id, profissional, inicio, fim, tipo, valor, observacoes, medico_usuario_id } = req.body || {};
  if (!sala_id || !profissional || !inicio || !fim) {
    return res.status(400).json({ erro: 'sala, profissional, início e fim são obrigatórios' });
  }
  const ini = new Date(inicio), f = new Date(fim);
  if (isNaN(ini) || isNaN(f)) return res.status(400).json({ erro: 'datas inválidas' });
  if (f <= ini) return res.status(400).json({ erro: 'o fim deve ser depois do início' });
  const tp = (tipo === 'mensal') ? 'mensal' : 'avulsa';

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // Confere conflito na mesma sala (sobreposição de horário).
    const [conflito] = await conn.query(
      `SELECT id, profissional, inicio, fim FROM reservas_sala
        WHERE sala_id = ? AND status <> 'cancelado'
          AND inicio < ? AND fim > ?
        LIMIT 1 FOR UPDATE`,
      [sala_id, fim, inicio]);
    if (conflito.length) {
      await conn.rollback();
      return res.status(409).json({ erro: 'já existe reserva nesse horário para esta sala', conflito: conflito[0] });
    }
    const [r] = await conn.query(
      `INSERT INTO reservas_sala (sala_id, profissional, medico_usuario_id, inicio, fim, tipo, valor, observacoes, criado_por)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [sala_id, String(profissional).trim(), medico_usuario_id || null, inicio, fim, tp,
       valor != null && valor !== '' ? valor : null, observacoes || null, req.session.usuario.id]);
    await conn.commit();
    await auditar(req, 'reserva_criada', 'sala #' + sala_id, { id: r.insertId, inicio, fim, tipo: tp });
    res.json({ ok: true, id: r.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Cancela uma reserva (soft: marca como cancelada, mantém histórico).
app.delete('/api/reservas/:id', exigePapel('recepcao'), w(async (req, res) => {
  const [r] = await db.query("UPDATE reservas_sala SET status = 'cancelado' WHERE id = ? AND status <> 'cancelado'", [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'reserva não encontrada ou já cancelada' });
  await auditar(req, 'reserva_cancelada', 'reserva #' + req.params.id);
  res.json({ ok: true });
}));

/* ============================================================
   AGENDA (Fase 1) — agenda própria da clínica
   Leitura: qualquer usuário logado.
   Escrita: recepção e médicos (admin sempre).
   Regra: um profissional não pode ter dois atendimentos no mesmo
   horário; a mesma sala também não pode ser dupla-reservada.
   ============================================================ */

// Lista agendamentos num intervalo, com o nome/whatsapp do paciente e a sala.
app.get('/api/agendamentos', exigeLogin, w(async (req, res) => {
  const de = req.query.de || '1970-01-01';
  const ate = req.query.ate || '2999-12-31';
  const params = [ate, de];
  let filtro = '';
  if (req.query.profissional) { filtro += ' AND a.profissional = ?'; params.push(req.query.profissional); }
  const [rows] = await db.query(
    `SELECT a.id, a.contato_id, c.nome AS paciente, c.whatsapp, a.profissional, a.especialidade,
            a.sala_id, s.nome AS sala, a.inicio, a.fim, a.status, a.observacoes
       FROM agendamentos a
       JOIN contatos c ON c.id = a.contato_id
       LEFT JOIN salas s ON s.id = a.sala_id
      WHERE a.status <> 'cancelado'
        AND a.inicio < ? AND COALESCE(a.fim, a.inicio + INTERVAL 30 MINUTE) > ?${filtro}
      ORDER BY a.inicio`, params);
  res.json(rows);
}));

// Cria um agendamento, bloqueando conflito de profissional e de sala.
app.post('/api/agendamentos', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const { contato_id, profissional, especialidade, inicio, fim, sala_id, observacoes } = req.body || {};
  if (!contato_id || !profissional || !especialidade || !inicio || !fim) {
    return res.status(400).json({ erro: 'paciente, profissional, especialidade, início e fim são obrigatórios' });
  }
  const ini = new Date(inicio), f = new Date(fim);
  if (isNaN(ini) || isNaN(f)) return res.status(400).json({ erro: 'datas inválidas' });
  if (f <= ini) return res.status(400).json({ erro: 'o fim deve ser depois do início' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    // conflito do profissional
    const [cp] = await conn.query(
      `SELECT id FROM agendamentos
        WHERE profissional = ? AND status <> 'cancelado'
          AND inicio < ? AND COALESCE(fim, inicio + INTERVAL 30 MINUTE) > ?
        LIMIT 1 FOR UPDATE`, [profissional, fim, inicio]);
    if (cp.length) { await conn.rollback(); return res.status(409).json({ erro: 'este profissional já tem atendimento nesse horário' }); }
    // conflito da sala (se informada)
    if (sala_id) {
      const [cs] = await conn.query(
        `SELECT id FROM agendamentos
          WHERE sala_id = ? AND status <> 'cancelado'
            AND inicio < ? AND COALESCE(fim, inicio + INTERVAL 30 MINUTE) > ?
          LIMIT 1 FOR UPDATE`, [sala_id, fim, inicio]);
      if (cs.length) { await conn.rollback(); return res.status(409).json({ erro: 'esta sala já está ocupada nesse horário' }); }
    }
    const [r] = await conn.query(
      `INSERT INTO agendamentos (contato_id, profissional, especialidade, sala_id, inicio, fim, observacoes, criado_por)
       VALUES (?,?,?,?,?,?,?,?)`,
      [contato_id, String(profissional).trim(), String(especialidade).trim(), sala_id || null, inicio, fim, observacoes || null, req.session.usuario.id]);
    await conn.query('INSERT INTO eventos_contato (contato_id, titulo, detalhe) VALUES (?,?,?)',
      [contato_id, 'Agendamento criado', profissional + ' · ' + especialidade]);
    await conn.commit();
    await auditar(req, 'agendamento_criado', 'contato #' + contato_id, { profissional, inicio, fim });
    res.json({ ok: true, id: r.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// Muda o status do agendamento (confirmar / atender / faltar / cancelar).
app.patch('/api/agendamentos/:id/status', exigePapel('recepcao', 'medico'), w(async (req, res) => {
  const { status } = req.body || {};
  const validos = ['agendado', 'confirmado', 'atendido', 'faltou', 'cancelado'];
  if (!validos.includes(status)) return res.status(400).json({ erro: 'status inválido' });
  const [r] = await db.query('UPDATE agendamentos SET status = ? WHERE id = ?', [status, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'agendamento não encontrado' });
  await auditar(req, 'agendamento_status', 'agendamento #' + req.params.id, { status });
  res.json({ ok: true });
}));

/* ============================================================
   FINANCEIRO (Fase 2) — lançamentos, pagamentos e aluguel das salas
   Acesso: financeiro (admin sempre). Cobrança de aluguel: financeiro/recepção.
   ============================================================ */

// Resumo do caixa (recebido, a receber, despesas, saldo).
app.get('/api/financeiro/resumo', exigePapel('financeiro'), w(async (req, res) => {
  const [[r]] = await db.query(
    `SELECT
       COALESCE(SUM(CASE WHEN tipo='receita' AND status='pago' THEN valor END),0)                        AS recebido,
       COALESCE(SUM(CASE WHEN tipo='receita' AND status IN ('pendente','atrasado','a_faturar') THEN valor END),0) AS a_receber,
       COALESCE(SUM(CASE WHEN tipo='despesa' AND status='pago' THEN valor END),0)                        AS despesas_pagas,
       COALESCE(SUM(CASE WHEN tipo='despesa' AND status IN ('pendente','atrasado') THEN valor END),0)     AS despesas_pendentes,
       COALESCE(SUM(CASE WHEN tipo='receita' AND status='pago' THEN valor END),0)
       - COALESCE(SUM(CASE WHEN tipo='despesa' AND status='pago' THEN valor END),0)                       AS saldo
     FROM lancamentos`);
  res.json(r);
}));

// Lista lançamentos com filtros opcionais (tipo, status, período por vencimento).
app.get('/api/lancamentos', exigePapel('financeiro'), w(async (req, res) => {
  const cond = [];
  const params = [];
  if (req.query.tipo)   { cond.push('l.tipo = ?');   params.push(req.query.tipo); }
  if (req.query.status) { cond.push('l.status = ?'); params.push(req.query.status); }
  if (req.query.de)     { cond.push('(l.vencimento IS NULL OR l.vencimento >= ?)'); params.push(req.query.de); }
  if (req.query.ate)    { cond.push('(l.vencimento IS NULL OR l.vencimento <= ?)'); params.push(req.query.ate); }
  const where = cond.length ? 'WHERE ' + cond.join(' AND ') : '';
  const [rows] = await db.query(
    `SELECT l.id, l.contato_id, c.nome AS paciente, l.descricao, l.tipo, l.valor, l.forma,
            l.status, l.pago_em, l.origem, l.vencimento, l.criado_em
       FROM lancamentos l
       LEFT JOIN contatos c ON c.id = l.contato_id
       ${where}
      ORDER BY (l.status IN ('pendente','atrasado')) DESC, l.vencimento IS NULL, l.vencimento, l.id DESC`, params);
  res.json(rows);
}));

// Cria um lançamento.
app.post('/api/lancamentos', exigePapel('financeiro'), w(async (req, res) => {
  const { descricao, tipo, valor, forma, status, vencimento, contato_id } = req.body || {};
  if (!descricao || !String(descricao).trim()) return res.status(400).json({ erro: 'descrição é obrigatória' });
  if (!['receita', 'despesa'].includes(tipo)) return res.status(400).json({ erro: 'tipo deve ser receita ou despesa' });
  const v = Number(valor);
  if (!(v > 0)) return res.status(400).json({ erro: 'valor deve ser maior que zero' });
  const st = ['pendente', 'pago', 'atrasado', 'a_faturar'].includes(status) ? status : 'pendente';
  const [r] = await db.query(
    `INSERT INTO lancamentos (contato_id, descricao, tipo, valor, forma, status, pago_em, vencimento, origem)
     VALUES (?,?,?,?,?,?,?,?, 'manual')`,
    [contato_id || null, String(descricao).trim(), tipo, v, forma || 'pix', st,
     st === 'pago' ? new Date() : null, vencimento || null]);
  await auditar(req, 'lancamento_criado', descricao, { tipo, valor: v, status: st });
  res.json({ ok: true, id: r.insertId });
}));

// Muda o status (marcar pago/pendente/atrasado). Ao marcar pago, grava pago_em.
app.patch('/api/lancamentos/:id/status', exigePapel('financeiro'), w(async (req, res) => {
  const { status } = req.body || {};
  if (!['pendente', 'pago', 'atrasado', 'a_faturar'].includes(status)) return res.status(400).json({ erro: 'status inválido' });
  const [r] = await db.query('UPDATE lancamentos SET status = ?, pago_em = ? WHERE id = ?',
    [status, status === 'pago' ? new Date() : null, req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'lançamento não encontrado' });
  await auditar(req, 'lancamento_status', 'lançamento #' + req.params.id, { status });
  res.json({ ok: true });
}));

// Exclui um lançamento (e desvincula da reserva de sala, se houver).
app.delete('/api/lancamentos/:id', exigePapel('financeiro'), w(async (req, res) => {
  await db.query('UPDATE reservas_sala SET lancamento_id = NULL WHERE lancamento_id = ?', [req.params.id]);
  const [r] = await db.query('DELETE FROM lancamentos WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ erro: 'lançamento não encontrado' });
  await auditar(req, 'lancamento_excluido', 'lançamento #' + req.params.id);
  res.json({ ok: true });
}));

// Aluguéis de sala com valor ainda não lançados no financeiro.
app.get('/api/aluguel/pendentes', exigePapel('financeiro', 'recepcao'), w(async (req, res) => {
  const [rows] = await db.query(
    `SELECT r.id, r.profissional, r.tipo, r.valor, r.inicio, s.nome AS sala
       FROM reservas_sala r
       JOIN salas s ON s.id = r.sala_id
      WHERE r.status <> 'cancelado' AND r.valor IS NOT NULL AND r.valor > 0 AND r.lancamento_id IS NULL
      ORDER BY r.inicio DESC`);
  res.json(rows);
}));

// Gera o lançamento (receita) do aluguel de uma reserva e vincula, evitando cobrança dupla.
app.post('/api/reservas/:id/cobrar', exigePapel('financeiro', 'recepcao'), w(async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [linhas] = await conn.query(
      `SELECT r.id, r.profissional, r.valor, r.inicio, r.lancamento_id, s.nome AS sala
         FROM reservas_sala r JOIN salas s ON s.id = r.sala_id
        WHERE r.id = ? FOR UPDATE`, [req.params.id]);
    const rv = linhas[0];
    if (!rv) { await conn.rollback(); return res.status(404).json({ erro: 'reserva não encontrada' }); }
    if (rv.lancamento_id) { await conn.rollback(); return res.status(409).json({ erro: 'esta reserva já foi cobrada' }); }
    if (!(Number(rv.valor) > 0)) { await conn.rollback(); return res.status(400).json({ erro: 'reserva sem valor de aluguel' }); }
    const venc = new Date(rv.inicio);
    const [ins] = await conn.query(
      `INSERT INTO lancamentos (descricao, tipo, valor, forma, status, vencimento, origem)
       VALUES (?, 'receita', ?, 'aluguel', 'pendente', ?, 'aluguel_sala')`,
      ['Aluguel ' + rv.sala + ' — ' + rv.profissional, rv.valor,
       venc.toISOString().slice(0, 10)]);
    await conn.query('UPDATE reservas_sala SET lancamento_id = ? WHERE id = ?', [ins.insertId, rv.id]);
    await conn.commit();
    await auditar(req, 'aluguel_cobrado', 'reserva #' + rv.id, { lancamento: ins.insertId, valor: rv.valor });
    res.json({ ok: true, lancamento_id: ins.insertId });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

/* ---------- arquivos ---------- */
app.get('/', (req, res) => res.redirect(req.session.usuario ? '/app' : '/login.html'));
app.get('/app', exigeLogin, (req, res) => res.sendFile(path.join(__dirname, '..', 'index.html')));
app.use(express.static(path.join(__dirname, 'publico')));           // login.html
app.use('/assets', express.static(path.join(__dirname, '..', '..', 'assets'))); // logo e imagens

/* ============================================================
   Middleware de erro global — captura qualquer erro encaminhado
   pelo wrapper w(...). Sem isto, um erro de banco travaria a
   requisição sem resposta. DEVE ficar por último.
   ============================================================ */
app.use((err, req, res, next) => {
  console.error('ERRO na rota', req.method, req.originalUrl, '→', err.message);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ erro: 'erro interno do servidor' });
  return res.status(500).send('Erro interno do servidor.');
});

app.listen(PORTA, () => {
  console.log('');
  console.log('  L\'Organi Flow rodando!');
  console.log('  Neste computador:  http://localhost:' + PORTA);
  console.log('  Na rede da clínica: http://SEU-IP-LOCAL:' + PORTA + '  (veja o IP com: ipconfig)');
  console.log('');
});
