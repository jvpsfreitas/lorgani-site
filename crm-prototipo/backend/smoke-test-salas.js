/* ============================================================
   Teste de fumaça do módulo Salas (agenda de ocupação).
   Sem bibliotecas — usa o fetch nativo (Node 18+).

   Pré-requisitos:
     1. Banco migrado: rode migracao-01-salas.sql (ou schema.sql novo + seed.js).
     2. Servidor rodando:  node server.js
   Rodar:  node smoke-test-salas.js
   ============================================================ */
const BASE = process.env.BASE || 'http://localhost:3000';
const ADMIN = { email: 'admin@lorgani.com.br', senha: 'Lorgani@2026' };

let cookie = '';
let passou = 0, falhou = 0;

function ok(cond, msg) {
  if (cond) { console.log('  ✓ ' + msg); passou++; }
  else { console.log('  ✗ ' + msg); falhou++; }
}
async function req(metodo, caminho, corpo) {
  const r = await fetch(BASE + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  const set = r.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  let dados = null;
  try { dados = await r.json(); } catch (_) {}
  return { status: r.status, dados };
}

(async () => {
  console.log('\nTeste de fumaça — Salas — ' + BASE + '\n');

  // Login
  let r = await req('POST', '/api/login', ADMIN);
  ok(r.status === 200 && r.dados.ok, 'login do admin funciona');

  // Há pelo menos 1 sala cadastrada
  r = await req('GET', '/api/salas');
  ok(r.status === 200 && Array.isArray(r.dados) && r.dados.length >= 1, 'lista salas (>= 1)');
  const salaId = r.dados && r.dados[0] && r.dados[0].id;

  // Datas de teste (amanhã 09:00–12:00) em horário local, formato aceito pelo MySQL
  const amanha = new Date(Date.now() + 24 * 3600 * 1000);
  const ymd = amanha.toISOString().slice(0, 10);
  const ini = ymd + ' 09:00:00';
  const fim = ymd + ' 12:00:00';

  // Cria reserva
  r = await req('POST', '/api/reservas', { sala_id: salaId, profissional: 'Dr. Teste', inicio: ini, fim: fim, tipo: 'avulsa' });
  ok(r.status === 200 && r.dados.id, 'cria reserva (200 + id)');
  const reservaId = r.dados && r.dados.id;

  // Conflito: mesma sala, horário sobreposto (10:00–11:00 dentro de 09:00–12:00) → 409
  r = await req('POST', '/api/reservas', { sala_id: salaId, profissional: 'Dr. Choque', inicio: ymd + ' 10:00:00', fim: ymd + ' 11:00:00' });
  ok(r.status === 409, 'reserva sobreposta na mesma sala é bloqueada (409)');

  // Horário encostado, sem sobrepor (12:00–13:00) → deve permitir
  r = await req('POST', '/api/reservas', { sala_id: salaId, profissional: 'Dr. Seguinte', inicio: ymd + ' 12:00:00', fim: ymd + ' 13:00:00' });
  ok(r.status === 200, 'reserva encostada (12h após 09-12h) é permitida');
  const reserva2 = r.dados && r.dados.id;

  // Fim antes do início → 400
  r = await req('POST', '/api/reservas', { sala_id: salaId, profissional: 'Dr. Erro', inicio: fim, fim: ini });
  ok(r.status === 400, 'fim antes do início é rejeitado (400)');

  // Lista reservas do dia
  r = await req('GET', '/api/reservas?de=' + ymd + '&ate=' + ymd + ' 23:59:59');
  ok(r.status === 200 && Array.isArray(r.dados) && r.dados.length >= 2, 'lista reservas do dia (>= 2)');

  // Cancela a primeira reserva
  r = await req('DELETE', '/api/reservas/' + reservaId);
  ok(r.status === 200 && r.dados.ok, 'cancela reserva');

  // Após cancelar, o horário 09-12h fica livre de novo → permite reservar
  r = await req('POST', '/api/reservas', { sala_id: salaId, profissional: 'Dr. Novo', inicio: ini, fim: fim });
  ok(r.status === 200, 'após cancelar, horário liberado aceita nova reserva');
  const reserva3 = r.dados && r.dados.id;

  // Sem login não acessa
  cookie = '';
  r = await req('GET', '/api/salas');
  ok(r.status === 401, 'sem sessão, /api/salas retorna 401');

  // Limpeza dos dados de teste (re-loga como admin)
  await req('POST', '/api/login', ADMIN);
  for (const id of [reserva2, reserva3]) if (id) await req('DELETE', '/api/reservas/' + id);

  console.log('\nResultado: ' + passou + ' passaram, ' + falhou + ' falharam.\n');
  process.exit(falhou ? 1 : 0);
})().catch(e => {
  console.error('\nERRO ao rodar os testes (o server.js está rodando? o banco foi migrado?):', e.message, '\n');
  process.exit(1);
});
