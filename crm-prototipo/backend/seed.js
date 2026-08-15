/* Cria os 10 usuários iniciais e os pacientes de exemplo.
   Rodar UMA vez, depois do schema.sql:  node seed.js               */
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const USUARIOS = [
  // [nome, email, papel]  — senha inicial de todos: Lorgani@2026 (trocar no 1º uso)
  ['Administrador',            'admin@lorgani.com.br',      'admin'],
  ['Dra. Rita Soler',          'rita@lorgani.com.br',       'medico'],
  ['Dra. Luciane Freitas',     'luciane@lorgani.com.br',    'medico'],
  ['Dra. Luciana Segatto',     'segatto@lorgani.com.br',    'medico'],
  ['Renata Toledo',            'renata@lorgani.com.br',     'medico'],
  ['Silvia Manzi',             'silvia@lorgani.com.br',     'medico'],
  ['Recepção 1',               'recepcao1@lorgani.com.br',  'recepcao'],
  ['Recepção 2',               'recepcao2@lorgani.com.br',  'recepcao'],
  ['Recepção 3',               'recepcao3@lorgani.com.br',  'recepcao'],
  ['Financeiro',               'financeiro@lorgani.com.br', 'financeiro'],
];

const CONTATOS = [
  ['Marina Alves',  '+5511994212381', 'qualificado', 'Particular'],
  ['Carla Freitas', '+5511996552074', 'conversa',    'Particular'],
  ['João Santos',   '+5511980774463', 'agendado',    'Particular'],
  ['Rafael Pinto',  '+5511988124407', 'novo',        'Particular'],
  ['Lucas Barros',  '+5511982216650', 'recorrente',  'Particular'],
  ['Ana Lima',      '+5511993407726', 'atendido',    'Particular'],
];

const INSUMOS = [
  // [nome, lote, validade, quantidade, minimo, custo_unit]
  ['Toxina Botulínica 100U',   'BTX-2411', '2026-11-30', 12, 5,  980.00],
  ['Ácido Hialurônico 1ml',    'AH-2506',  '2027-05-31',  8, 6,  620.00],
  ['Anestésico tópico (pomada)','AN-2503', '2026-09-30',  3, 4,   45.00], // abaixo do mínimo
  ['Agulha 30G (cx 100)',      'AG-30G',   null,          2, 3,   38.00], // abaixo do mínimo
  ['Luva nitrílica M (cx 100)','LV-M',     null,         15, 5,   42.00],
  ['Gaze estéril (pacote)',    'GZ-EST',   '2028-01-31', 40, 10,   9.90],
];

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_SENHA || '',
    database: 'lorgani_flow'
  });

  const hash = await bcrypt.hash('Lorgani@2026', 10);
  for (const [nome, email, papel] of USUARIOS) {
    await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?,?,?,?) ' +
      'ON DUPLICATE KEY UPDATE nome = VALUES(nome), papel = VALUES(papel)',
      [nome, email, hash, papel]);
  }
  console.log('✓ ' + USUARIOS.length + ' usuários criados (senha inicial: Lorgani@2026)');

  const [[{ n }]] = await db.query('SELECT COUNT(*) n FROM contatos');
  if (n === 0) {
    for (const [nome, wpp, etapa, conv] of CONTATOS) {
      const [r] = await db.query(
        'INSERT INTO contatos (nome, whatsapp, etapa, convenio) VALUES (?,?,?,?)',
        [nome, wpp, etapa, conv]);
      await db.query(
        'INSERT INTO eventos_contato (contato_id, titulo, detalhe) VALUES (?,?,?)',
        [r.insertId, 'Contato importado', 'carga inicial do sistema']);
    }
    console.log('✓ ' + CONTATOS.length + ' contatos de exemplo criados');
  } else {
    console.log('• contatos já existiam — mantidos');
  }

  const [[{ ni }]] = await db.query('SELECT COUNT(*) ni FROM insumos');
  if (ni === 0) {
    for (const [nome, lote, validade, qtd, minimo, custo] of INSUMOS) {
      await db.query(
        'INSERT INTO insumos (nome, lote, validade, quantidade, minimo, custo_unit) VALUES (?,?,?,?,?,?)',
        [nome, lote, validade, qtd, minimo, custo]);
    }
    console.log('✓ ' + INSUMOS.length + ' insumos de exemplo criados');
  } else {
    console.log('• insumos já existiam — mantidos');
  }

  const [[{ ns }]] = await db.query('SELECT COUNT(*) ns FROM salas');
  if (ns === 0) {
    await db.query("INSERT INTO salas (nome, cor) VALUES ('Sala 1', '#8A2517'), ('Sala 2', '#6B8E23')");
    console.log('✓ 2 salas de coworking criadas');
  } else {
    console.log('• salas já existiam — mantidas');
  }

  const [[{ nl }]] = await db.query('SELECT COUNT(*) nl FROM lancamentos');
  if (nl === 0) {
    await db.query(
      "INSERT INTO lancamentos (descricao, tipo, valor, forma, status, vencimento, origem) VALUES " +
      "('Consulta otorrino — João Santos','receita',450.00,'pix','pendente',CURDATE(),'manual')," +
      "('Consulta otorrino — Ana Lima','receita',450.00,'pix','pago',CURDATE(),'manual')," +
      "('Toxina botulínica — P. Souza','receita',1290.00,'cartao','atrasado',DATE_SUB(CURDATE(),INTERVAL 8 DAY),'manual')," +
      "('Aluguel do imóvel','despesa',6800.00,'boleto','pago',CURDATE(),'manual')," +
      "('Insumos de estética','despesa',2100.00,'pix','pendente',DATE_ADD(CURDATE(),INTERVAL 5 DAY),'manual')");
    console.log('✓ 5 lançamentos de exemplo criados');
  } else {
    console.log('• lançamentos já existiam — mantidos');
  }

  await db.end();
  console.log('Pronto! Agora rode:  node server.js');
})().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
