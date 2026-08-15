/* ============================================================
   Teste de fumaça de Notas e Tarefas. fetch nativo (Node 18+).
   Pré: migracao-04-notas-tarefas.sql aplicada + servidor rodando.
   Rodar:  node smoke-test-notas-tarefas.js
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
  console.log('\nTeste de fumaça — Notas e Tarefas — ' + BASE + '\n');
  let r = await req('POST','/api/login',ADMIN);
  ok(r.status===200 && r.dados.ok,'login admin');
  r = await req('GET','/api/contatos');
  const cid = r.dados && r.dados[0] && r.dados[0].id;
  ok(!!cid,'há um paciente');

  // NOTAS
  r = await req('POST','/api/contatos/'+cid+'/notas',{texto:'Paciente prefere contato pela manhã.'});
  ok(r.status===200 && r.dados.id,'cria nota');
  const notaId = r.dados && r.dados.id;
  r = await req('POST','/api/contatos/'+cid+'/notas',{texto:'   '});
  ok(r.status===400,'nota vazia rejeitada (400)');
  r = await req('GET','/api/contatos/'+cid+'/notas');
  ok(r.status===200 && r.dados.some(n=>n.id===notaId && n.autor),'lista notas com autor');
  r = await req('DELETE','/api/notas/'+notaId);
  ok(r.status===200,'exclui nota');

  // TAREFAS
  r = await req('POST','/api/contatos/'+cid+'/tarefas',{titulo:'Ligar para confirmar retorno', vencimento:'2026-07-20'});
  ok(r.status===200 && r.dados.id,'cria tarefa');
  const tId = r.dados && r.dados.id;
  r = await req('POST','/api/contatos/'+cid+'/tarefas',{titulo:''});
  ok(r.status===400,'tarefa sem título rejeitada (400)');
  r = await req('PATCH','/api/tarefas/'+tId,{feita:1});
  ok(r.status===200,'marca tarefa como feita');
  r = await req('GET','/api/contatos/'+cid+'/tarefas');
  ok(r.status===200 && r.dados.some(t=>t.id===tId && t.feita===1 && t.feita_em),'lista mostra feita com feita_em');
  r = await req('PATCH','/api/tarefas/'+tId,{feita:0});
  ok(r.status===200,'desmarca tarefa');
  r = await req('DELETE','/api/tarefas/'+tId);
  ok(r.status===200,'exclui tarefa');

  // sem login
  cookie='';
  r = await req('GET','/api/contatos/'+cid+'/notas');
  ok(r.status===401,'sem sessão retorna 401');

  console.log('\nResultado: '+passou+' passaram, '+falhou+' falharam.\n');
  process.exit(falhou?1:0);
})().catch(e=>{console.error('\nERRO (server rodando? migração aplicada?):',e.message,'\n');process.exit(1);});
