/* ============================================================
   Teste de fumaça da Agenda (Fase 1). Sem bibliotecas (fetch nativo, Node 18+).
   Pré: banco migrado (migracao-02-agenda.sql) + servidor rodando (node server.js).
   Rodar:  node smoke-test-agenda.js
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
  console.log('\nTeste de fumaça — Agenda — ' + BASE + '\n');
  let r = await req('POST','/api/login',ADMIN);
  ok(r.status===200 && r.dados.ok,'login admin');

  // pega um contato existente (seed cria vários)
  r = await req('GET','/api/contatos');
  ok(r.status===200 && Array.isArray(r.dados) && r.dados.length>=1,'lista contatos (>=1)');
  const contato = r.dados && r.dados[0];
  ok(!!contato,'há um paciente para agendar');

  const amanha = new Date(Date.now()+24*3600*1000);
  const ymd = amanha.toISOString().slice(0,10);
  const prof = 'Dra. Rita Soler';

  // cria agendamento 09:00-09:30
  r = await req('POST','/api/agendamentos',{contato_id:contato.id,profissional:prof,especialidade:'Otorrinolaringologia',inicio:ymd+' 09:00:00',fim:ymd+' 09:30:00'});
  ok(r.status===200 && r.dados.id,'cria agendamento (200+id)');
  const ag1 = r.dados && r.dados.id;

  // conflito do MESMO profissional 09:15-09:45 → 409
  r = await req('POST','/api/agendamentos',{contato_id:contato.id,profissional:prof,especialidade:'Otorrinolaringologia',inicio:ymd+' 09:15:00',fim:ymd+' 09:45:00'});
  ok(r.status===409,'conflito de horário do profissional bloqueado (409)');

  // outro profissional no mesmo horário → permitido
  r = await req('POST','/api/agendamentos',{contato_id:contato.id,profissional:'Dra. Luciane Freitas',especialidade:'Otorrinolaringologia',inicio:ymd+' 09:00:00',fim:ymd+' 09:30:00'});
  ok(r.status===200,'outro profissional no mesmo horário é permitido');
  const ag2 = r.dados && r.dados.id;

  // fim antes do início → 400
  r = await req('POST','/api/agendamentos',{contato_id:contato.id,profissional:prof,especialidade:'Otorrino',inicio:ymd+' 10:00:00',fim:ymd+' 09:00:00'});
  ok(r.status===400,'fim antes do início rejeitado (400)');

  // muda status para confirmado
  r = await req('PATCH','/api/agendamentos/'+ag1+'/status',{status:'confirmado'});
  ok(r.status===200 && r.dados.ok,'confirma agendamento');

  // status inválido → 400
  r = await req('PATCH','/api/agendamentos/'+ag1+'/status',{status:'xpto'});
  ok(r.status===400,'status inválido rejeitado (400)');

  // lista do dia tem >=2
  r = await req('GET','/api/agendamentos?de='+ymd+' 00:00:00&ate='+ymd+' 23:59:59');
  ok(r.status===200 && Array.isArray(r.dados) && r.dados.length>=2,'lista agendamentos do dia (>=2)');

  // sem login → 401
  cookie='';
  r = await req('GET','/api/agendamentos');
  ok(r.status===401,'sem sessão retorna 401');

  // limpeza
  await req('POST','/api/login',ADMIN);
  for(const id of [ag1,ag2]) if(id) await req('PATCH','/api/agendamentos/'+id+'/status',{status:'cancelado'});

  console.log('\nResultado: '+passou+' passaram, '+falhou+' falharam.\n');
  process.exit(falhou?1:0);
})().catch(e=>{console.error('\nERRO (server rodando? banco migrado?):',e.message,'\n');process.exit(1);});
