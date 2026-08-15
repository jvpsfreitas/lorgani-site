# verification-standard.md — L'Organi Flow (CRM)
# O que "correto" significa para o sistema. Determinístico, re-executável.
# SOMENTE-LEITURA enquanto uma saída está sendo corrigida.
# ATENÇÃO: config.bat, senhas do MariaDB e qualquer segredo são PROTEGIDOS —
# nunca subir para git/nuvem, nunca imprimir em log.

## Critérios de aceite (passa/falha, nunca notas)
1. **Backend sobe** — com o MariaDB rodando, `node server.js` (ou `backend/INICIAR.bat`)
   inicia sem erro e escuta em http://localhost:3000.
2. **Smoke-tests verdes** — todos passam: `smoke-test.js`, `smoke-test-agenda.js`,
   `smoke-test-financeiro.js`, `smoke-test-notas-tarefas.js`, `smoke-test-salas.js`.
3. **Login real** — um usuário do seed (senha Lorgani@2026) autentica em /login e recebe
   sessão/token; senha errada é rejeitada.
4. **RBAC** — um usuário de papel `recepcao` recebe 403 numa rota exclusiva de `admin`.
   Papéis admin/medico/recepcao/financeiro respeitados na API.
5. **Integração front↔back (servido pelo server.js)** — Kanban e Contatos carregam do
   banco; "+ Novo contato" grava via POST; arrastar um card grava a etapa via PATCH;
   a ficha mostra a linha do tempo vinda do banco; nome/papel do login aparecem no topo.
6. **Modo duplo** — aberto como `file://`, o mesmo index.html vira protótipo com dados
   fake e NÃO quebra (sem erro fatal no console).
7. **Integridade do index.html** — termina em `</html>`; os DOIS blocos `<script>` do fim
   existem (principal + integração); funções permanecem top-level (globais).
8. **Auditoria LGPD** — ações relevantes gravam na tabela de auditoria.
9. **Segredos protegidos** — `config.bat` e credenciais NÃO estão versionados nem em
   nenhum artefato de entrega (zip/nuvem).

## Como rodar o check
- Subir MariaDB local; `cd backend && node server.js`.
- Rodar cada `node smoke-test*.js` e conferir saída (todos PASS).
- `curl` no /login com usuário do seed (ok) e com senha errada (rejeita); testar uma rota
  admin com token de recepcao (espera 403).
- Abrir http://localhost:3000, logar, criar um contato, arrastar um card, e confirmar a
  persistência no banco (HeidiSQL). Depois abrir o index.html como arquivo local e conferir
  que vira protótipo sem quebrar.
- Terminal: `node --check index.html`-equivalente não se aplica (é HTML); em vez disso,
  confirmar `</html>` no fim e a presença dos dois `<script>`.
- Onde possível, o subagente `verificador` (contexto limpo) roda tudo.

## Baseline
- O que já funcionava no teste de 11/07: ciclo criar contato → Kanban → HeidiSQL.
  Sinalizar qualquer regressão nesse fluxo ou nos smoke-tests que antes passavam.

## Saída de um check run
- PASS/FAIL por critério, com evidência.
- Em FAIL: anexar evidência + defeito aos aprendizados e disparar o agente-regenerativo
  (menor correção, reversível, sem tocar em segredos/produção).
