/* ============================================================
   Teste de fumaça do Financeiro (Fase 2). fetch nativo (Node 18+).
   Pré: migracao-03-financeiro.sql aplicada + servidor rodando.
   Rodar:  node smoke-test-financeiro.js
   ============================================================ */
const BASE = process.env.BASE || 'http://localhost:3000';
const ADMIN = { email: 'admin@lorgani.com.br', senha: 'Lorgani@2026' };
let cookie = '', passou = 0, falhou = 0;

function ok(c, m){ if(c){console.log('  ✓ '+m);passou++;}else{console.log('  ✗ '+m);falhou++;} }
async function req(metodo, caminho, corpo){
  const r = await fetch(BASE+caminho,{method:metodo,headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:corpo?JSON.stringify(corpo):undefined});
  const set=r.headers.get('set-cookie'); if(set)cookie=set.split(';')[0];
  let d=null; try{d=await r.json();}catch(_){}
  return {status:r.status,dados:d};
}

(async () => {
  console.log('\nTeste de fumaça — Financeiro — ' + BASE + '\n');
  let r = await req('POST','/api/login',ADMIN);
  ok(r.status===200 && r.dados.ok,'login admin');

  // resumo responde com os campos
  r = await req('GET','/api/financeiro/resumo');
  ok(r.status===200 && 'recebido' in r.dados && 'saldo' in r.dados,'resumo financeiro responde');

  // cria uma receita pendente
  r = await req('POST','/api/lancamentos',{descricao:'TESTE receita '+Date.now(),tipo:'receita',valor:200,forma:'pix',status:'pendente'});
  ok(r.status===200 && r.dados.id,'cria lançamento (200+id)');
  const id = r.dados && r.dados.id;

  // valor inválido → 400
  r = await req('POST','/api/lancamentos',{descricao:'x',tipo:'receita',valor:0});
  ok(r.status===400,'valor zero rejeitado (400)');

  // tipo inválido → 400
  r = await req('POST','/api/lancamentos',{descricao:'x',tipo:'xpto',valor:10});
  ok(r.status===400,'tipo inválido rejeitado (400)');

  // marca como pago
  r = await req('PATCH','/api/lancamentos/'+id+'/status',{status:'pago'});
  ok(r.status===200 && r.dados.ok,'marca lançamento como pago');

  // lista filtrando receitas
  r = await req('GET','/api/lancamentos?tipo=receita');
  ok(r.status===200 && Array.isArray(r.dados) && r.dados.some(l=>l.id===id && l.status==='pago' && l.pago_em),'lista mostra o pago com pago_em');

  // ---- aluguel das salas ----
  // cria sala reserva com valor (precisa de sala); pega sala 1
  let s = await req('GET','/api/salas');
  const salaId = s.dados && s.dados[0] && s.dados[0].id;
  const ymd = new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  r = await req('POST','/api/reservas',{sala_id:salaId,profissional:'Dr. Aluguel',inicio:ymd+' 08:00:00',fim:ymd+' 12:00:00',tipo:'avulsa',valor:150});
  ok(r.status===200,'cria reserva de sala com valor');
  const reservaId = r.dados && r.dados.id;

  // aparece em aluguéis pendentes
  r = await req('GET','/api/aluguel/pendentes');
  ok(r.status===200 && r.dados.some(x=>x.id===reservaId),'reserva aparece em aluguéis pendentes');

  // cobra → gera lançamento
  r = await req('POST','/api/reservas/'+reservaId+'/cobrar');
  ok(r.status===200 && r.dados.lancamento_id,'cobra aluguel → gera lançamento');
  const lancAluguel = r.dados && r.dados.lancamento_id;

  // cobrar de novo → 409 (evita duplicar)
  r = await req('POST','/api/reservas/'+reservaId+'/cobrar');
  ok(r.status===409,'cobrar de novo é bloqueado (409)');

  // limpeza
  if (id) await req('DELETE','/api/lancamentos/'+id);
  if (lancAluguel) await req('DELETE','/api/lancamentos/'+lancAluguel);
  if (reservaId) await req('DELETE','/api/reservas/'+reservaId);

  console.log('\nResultado: '+passou+' passaram, '+falhou+' falharam.\n');
  process.exit(falhou?1:0);
})().catch(e=>{console.error('\nERRO (server rodando? migração aplicada?):',e.message,'\n');process.exit(1);});
