/* ============================================================
   Teste de fumaça do módulo Estoque (e do login).
   Não precisa de nenhuma biblioteca — usa o fetch nativo (Node 18+).

   Pré-requisitos:
     1. O banco criado (schema.sql) e semeado (node seed.js).
     2. O servidor rodando:  node server.js
   Rodar:  node smoke-test.js
   ============================================================ */
const BASE = process.env.BASE || 'http://localhost:3000';
const ADMIN = { email: 'admin@lorgani.com.br', senha: 'Lorgani@2026' };

let cookie = '';                 // guardamos o cookie de sessão manualmente
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
  if (set) cookie = set.split(';')[0];          // captura connect.sid=...
  let dados = null;
  try { dados = await r.json(); } catch (_) {}
  return { status: r.status, dados };
}

(async () => {
  console.log('\nTeste de fumaça — ' + BASE + '\n');

  // 1. Login errado deve falhar
  let r = await req('POST', '/api/login', { email: ADMIN.email, senha: 'errada' });
  ok(r.status === 401, 'login com senha errada é rejeitado (401)');

  // 2. Login correto
  r = await req('POST', '/api/login', ADMIN);
  ok(r.status === 200 && r.dados && r.dados.ok, 'login do admin funciona (200)');
  ok(!!cookie, 'cookie de sessão recebido');

  // 3. Criar insumo
  const nomeTeste = 'INSUMO-TESTE ' + Date.now();
  r = await req('POST', '/api/insumos', { nome: nomeTeste, quantidade: 10, minimo: 4, custo_unit: 5 });
  ok(r.status === 200 && r.dados.id, 'cria insumo (200 + id)');
  const id = r.dados && r.dados.id;

  // 4. Entrada de estoque (+5 → 15)
  r = await req('POST', '/api/insumos/' + id + '/movimento', { delta: 5, motivo: 'compra' });
  ok(r.status === 200 && r.dados.quantidade === 15, 'entrada +5 leva o saldo para 15');

  // 5. Saída válida (-8 → 7)
  r = await req('POST', '/api/insumos/' + id + '/movimento', { delta: -8, motivo: 'uso' });
  ok(r.status === 200 && r.dados.quantidade === 7, 'saída -8 leva o saldo para 7');

  // 6. Saída maior que o saldo deve ser BLOQUEADA (sem estoque negativo)
  r = await req('POST', '/api/insumos/' + id + '/movimento', { delta: -999, motivo: 'exagero' });
  ok(r.status === 400, 'saída maior que o saldo é bloqueada (400)');

  // 7. Delta zero é inválido
  r = await req('POST', '/api/insumos/' + id + '/movimento', { delta: 0 });
  ok(r.status === 400, 'movimento com delta 0 é rejeitado (400)');

  // 8. Histórico tem os 2 movimentos válidos
  r = await req('GET', '/api/insumos/' + id + '/movimentos');
  ok(r.status === 200 && Array.isArray(r.dados) && r.dados.length === 2, 'histórico registra 2 movimentos');

  // 9. Resumo responde com os campos esperados
  r = await req('GET', '/api/estoque/resumo');
  ok(r.status === 200 && 'itens' in r.dados && 'abaixo_minimo' in r.dados, 'resumo do estoque responde');

  // 10. Sem login não acessa a API (nova sessão sem cookie)
  cookie = '';
  r = await req('GET', '/api/insumos');
  ok(r.status === 401, 'sem sessão, /api/insumos retorna 401');

  console.log('\nResultado: ' + passou + ' passaram, ' + falhou + ' falharam.\n');
  process.exit(falhou ? 1 : 0);
})().catch(e => {
  console.error('\nERRO ao rodar os testes (o server.js está rodando?):', e.message, '\n');
  process.exit(1);
});
