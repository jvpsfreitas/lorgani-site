# Progresso do protótipo L'Organi Flow — ✅ CONCLUÍDO em 10/07/2026

Todas as 6 etapas finalizadas em sessão manual (antes do prazo de 12/07).
Testes executados: navegação (10 telas), ids, funções onclick, sintaxe JS, integridade do arquivo — tudo OK.
A tarefa agendada "crm-lorgani-prototipo" foi desativada.

- [x] Etapa 1 — Estrutura (shell, sidebar completa, navegação JS) + Dashboard completo — concluída em 10/07 (sessão manual)
- [x] Etapa 2 — Agente de IA "Lia" (8 sub-seções) — concluída em 10/07 (sessão manual)
- [x] Etapa 3 — Inbox WhatsApp (3 colunas) + Contatos — concluída em 10/07 (sessão manual)
- [x] Etapa 4 — CRM Kanban (drag & drop) + Agendamento (grade Amplimed) — concluída em 10/07 (sessão manual)
- [x] Etapa 5 — Financeiro + Estoque — concluída em 10/07 (sessão manual)
- [x] Etapa 6 — Anamnese IA + Conexões + Perfis de acesso ("Ver como") + revisão e ENTREGA — concluída em 10/07 (sessão manual)

Notas para a próxima execução:
- O arquivo index.html já tem placeholders com ids tela-inbox, tela-kanban, tela-contatos,
  tela-agendamento, tela-anamnese, tela-financeiro, tela-estoque, tela-agente, tela-conexoes.
  Construir cada etapa SUBSTITUINDO o conteúdo interno da section correspondente.
- Editar SEMPRE pelas ferramentas de arquivo (lado Windows), nunca gravar HTML via bash
  (risco de truncamento pela sincronização OneDrive). Verificar no fim que o arquivo
  termina com </html>.
- Design system: variáveis CSS no topo do index.html (--bordo #702018 etc.). Reutilizar
  classes existentes: .card, .btn, .badge (b-verde/b-ambar/b-azul/b-vermelho/b-neutro),
  .metric, .section-card-title, .avatar-p, .funil.
- O seletor "Ver como" (id verComo) existe na sidebar, ainda sem função — ativar na etapa 6.

---

## Backend — Fase A + Endurecimento + Estoque — 13/07/2026

### Contexto
Depois da entrega do protótipo (10/07), foi iniciado o backend real em `/backend`
(Node/Express/MySQL, sessões, RBAC, auditoria). O `index.html` já consome a API de
Contatos/Kanban (`/api/me`, `/api/contatos`, `/etapa`, `/eventos`). Este registro
documenta o backend, que não estava no PROGRESSO anterior, e a etapa de hoje.

### Estado do backend antes de hoje (Fase A — pronto)
- Login/logout/me com `bcryptjs` + `express-session`.
- RBAC (`exigeLogin`, `exigePapel`), admin como superusuário.
- Auditoria (LGPD) de login, criação de contato e movimentação de Kanban.
- API de Contatos/CRM Kanban (listar, criar, mover etapa, timeline) — ligada ao front.
- `schema.sql` já cria tabelas de agendamentos, lançamentos, insumos e movimentos
  (marcadas "Fase C").

### Feito hoje (13/07)
- [x] **Endurecimento do `server.js`:**
  - Wrapper `w(fn)` + middleware de erro global — corrige bug em que qualquer falha de
    banco numa rota async travava a requisição sem resposta (Express 4 não captura
    promise rejeitada sozinho).
  - **Throttle de login** em memória: 5 tentativas por IP em 15 min → 429 (anti-força-bruta).
  - Cookie de sessão com `httpOnly` + `sameSite:'lax'`; `secure` liga com `HTTPS=1`;
    `trust proxy` para IP correto na auditoria. Segredo continua vindo de `SESSAO_SEGREDO`.
  - Tratamento de e-mail duplicado em `/api/usuarios` (409 em vez de erro 500).
- [x] **Módulo Estoque (API real):**
  - `GET /api/insumos` — lista com flag `abaixo_minimo` (itens a repor primeiro).
  - `GET /api/estoque/resumo` — itens, abaixo do mínimo, valor em estoque, vencendo em 30d.
  - `POST /api/insumos` — cria insumo (recepção/financeiro/admin).
  - `PATCH /api/insumos/:id` — edita cadastro (não mexe na quantidade).
  - `POST /api/insumos/:id/movimento` — entrada/saída **transacional**, com `FOR UPDATE`,
    **bloqueando estoque negativo** e gravando `movimentos_estoque` + auditoria.
  - `GET /api/insumos/:id/movimentos` — histórico com nome do usuário.
- [x] **`seed.js`:** semeados 6 insumos de exemplo (2 já abaixo do mínimo, para demo).
- [x] **`smoke-test.js`:** teste de fumaça zero-dependência (login + fluxo de estoque +
  bloqueio de estoque negativo + 401 sem sessão). Rodar com `node smoke-test.js`.
- [x] Sintaxe validada (`node --check`) em server.js, seed.js e smoke-test.js.

### Como rodar/testar
1. `INSTALAR.bat` (ou `npm install`) na pasta `/backend`.
2. Criar o banco: `mysql -u root -p < schema.sql`.
3. Semear: `node seed.js` (cria usuários, contatos e insumos).
4. Subir: `node server.js` → http://localhost:3000
5. Testar o estoque: com o server no ar, `node smoke-test.js`.

### Pendente / próximos passos
- **Front do Estoque:** o `index.html` (tela-estoque) ainda usa dados simulados —
  ligar às novas rotas `/api/insumos` (mesmo padrão já usado no Kanban).
- Considerar `express-rate-limit` + `helmet` na versão de produção; hoje o throttle é
  em memória (some se o processo reinicia) — suficiente para 1 servidor de clínica.
- Módulos Fase C ainda sem rotas: Agendamento (Amplimed — risco técnico nº1) e Financeiro
  (só existe o stub `/api/financeiro/resumo`).

---

## Correção do logo + Módulo Salas de coworking — 13/07/2026

### Logo (corrigido)
- Causa do "logo no branco": a sidebar (branca, por decisão de design) chamava
  `../assets/logo-branco.png` — a versão BRANCA do logo, invisível em fundo branco;
  e o arquivo nem existia (sem pasta assets).
- Correção: `index.html` (favicon + sidebar) e `login.html` agora apontam para `/logo.png`
  (versão COLORIDA). O backend serve `/logo.png` a partir de `backend/publico/`.
- **Pendente:** colocar o arquivo real `backend/publico/logo.png` (logo colorido, fundo
  transparente). Enquanto não estiver lá, aparece o selo bordô "L" (fallback on-brand).

### Salas de coworking médico (NOVO — extensão aprovada, fora do PRD original)
Escopo desta etapa: só a AGENDA DE OCUPAÇÃO das 2 salas (sem choque de horário).
Modelo de aluguel suportado no dado: avulsa (turno/horário) e mensal (guardados `tipo` e
`valor` na reserva) — a cobrança em si (Financeiro) fica para depois.
- [x] **Migração** `migracao-01-salas.sql` (CREATE TABLE IF NOT EXISTS) para rodar no banco
  JÁ EXISTENTE via HeidiSQL, sem perder dados. Mesmas tabelas adicionadas ao `schema.sql`.
- [x] Tabelas `salas` e `reservas_sala` (com FK, índices e status reservado/confirmado/cancelado).
- [x] `seed.js` cria Sala 1 e Sala 2 (idempotente).
- [x] **API** (`server.js`): `GET /api/salas`, `GET /api/reservas?de=&ate=&sala_id=`,
  `POST /api/reservas` (transacional, **bloqueia sobreposição de horário na mesma sala** → 409),
  `DELETE /api/reservas/:id` (cancelamento suave, mantém histórico). RBAC: recepção/admin
  reserva; qualquer logado visualiza.
- [x] `smoke-test-salas.js`: cria reserva, valida bloqueio de conflito, reserva encostada
  permitida, fim<início rejeitado, lista, cancela e libera o horário.
- [x] Sintaxe validada (bloco de salas parseia e executa isolado).

### Front-end das salas (feito 13/07)
- [x] Item "Salas de coworking" na sidebar (grupo Clínico & gestão) + breadcrumb.
- [x] Tela `tela-salas`: seletor de dia + as 2 salas lado a lado com as reservas do dia
  (hora, médico, tipo avulsa/mensal, valor, obs) e botão Cancelar por reserva.
- [x] "Nova reserva": modal (sala, médico, data, início, fim, tipo, valor, obs) → POST;
  conflito de horário mostra o erro (409); cancelar libera o horário.
- [x] Escape de HTML nos campos vindos do usuário (proteção XSS). Botão de reservar/cancelar
  só aparece para recepção/admin (API também bloqueia).
- [x] Sintaxe do bloco validada (parse + execução isolada OK).

### Pendente do módulo Salas
- Para ativar: no banco existente, execute `migracao-01-salas.sql` no HeidiSQL; reinicie o
  `server.js`; teste com `node smoke-test-salas.js`. A aba aparece após o reinício.

---

## Marketing — criador de imagens + assuntos em alta — 13/07/2026 (protótipo)
Decisão do dono: nível PROTÓTIPO agora (custo zero), com "IA sugere por serviço".
- [x] **Assuntos em alta**: painel na Central de Marketing com sugestões por serviço
  (otorrino + estética), com motivo sazonal; botão "Atualizar" rotaciona; "Usar este tema"
  carrega o criador de imagem (e o gerador de texto, quando há texto pronto).
- [x] **Criador de imagens (modelo de marca)**: tela com tema, formato (Feed 1:1 / Story 9:16),
  estilo (Clean/Vibrante/Institucional) e chamada. Gera uma ARTE em SVG com a identidade da
  L'Organi (paleta bordô/creme, logo, handle por área, telefone e rodapé de responsável
  técnica/CFM) e **baixa em PNG** de verdade (rasteriza via canvas). Escape XML nos textos.
- [x] Sintaxe validada (node --check + execução das funções isoladas OK).

### Importante (honestidade técnica)
- O criador de imagens é **por modelo/template de marca**, NÃO é IA generativa. Ele entrega
  uma arte pronta e baixável — útil para postar manualmente já. Trocar por IA generativa real
  (ex.: gerar foto/ilustração) exige uma **chave de API de imagem** e orçamento por imagem.
- **Publicar automático** no Instagram/Facebook/Google continua SIMULADO. Publicação real
  exige app na Meta (Página FB + Instagram Business + tokens + aprovação) e Google Business
  Profile API — depende das contas do dono e leva dias de setup.

### Próximos passos do Marketing
- Plugar IA generativa de imagem (definir provedor + chave + orçamento).
- Integração real de publicação (Meta Graph API + Google Business).

---

## Substituição da Amplimed — roadmap + Fase 1 (Agenda) — 13/07/2026
Decisão do dono: substituir a Amplimed com o tempo (clínica atende alguns convênios),
priorizando tudo. Estratégia registrada em `ROADMAP-SUBSTITUICAO-AMPLIMED.md`: rodar em
paralelo e cortar módulo por módulo; módulos regulados (prontuário/prescrição/TISS) preferem
integração certificada. Pré-requisito crítico: validar API/exportação da Amplimed para migrar
dados antes de qualquer desligamento.

### Fase 1 — Agenda própria (FEITO 13/07)
- [x] `migracao-02-agenda.sql`: adiciona `fim`, `sala_id`, `observacoes` à tabela
  agendamentos (que já existia) + índice por profissional. Refletido no `schema.sql`.
- [x] **API** (`server.js`): `GET /api/agendamentos?de=&ate=&profissional=`,
  `POST /api/agendamentos` (transacional, **bloqueia conflito de horário do profissional e
  da sala** → 409), `PATCH /api/agendamentos/:id/status` (confirmado/atendido/faltou/cancelado).
  Cria evento na timeline do contato e auditoria. RBAC: recepção/médico.
- [x] **Tela** (`tela-agendamento`): agenda real ligada ao banco — seletor de dia, filtro por
  profissional, lista com status e ações (Confirmar via WhatsApp, Atendido, Faltou, Cancelar)
  e modal de novo agendamento (paciente, profissional, especialidade, data, início, duração,
  sala, obs). A "confirmação por WhatsApp" abre o wa.me do paciente com mensagem pronta e marca
  status confirmado (envio automático real fica para a integração de WhatsApp).
- [x] `smoke-test-agenda.js`: cria, valida conflito de profissional, permite outro profissional
  no mesmo horário, rejeita fim<início, muda status, lista por dia, 401 sem sessão.
- [x] Sintaxe validada (rotas + front isolados: parse + execução OK). A grade simulada da
  Amplimed foi mantida abaixo como referência de transição.

### Ativar a Fase 1 (no banco existente)
1. HeidiSQL: rodar `migracao-02-agenda.sql` no `lorgani_flow`.
2. Reiniciar o `server.js`.
3. Testar: `node smoke-test-agenda.js`. No sistema, abrir "Agendamento".

### Fase 2 — Financeiro real (FEITO 13/07)
- [x] `migracao-03-financeiro.sql`: `pago_em` e `origem` em lancamentos; `lancamento_id` em
  reservas_sala. Refletido no `schema.sql`.
- [x] **API** (`server.js`): `GET /api/financeiro/resumo` (recebido, a receber, despesas, saldo),
  `GET /api/lancamentos` (filtros tipo/status/período), `POST /api/lancamentos`,
  `PATCH /api/lancamentos/:id/status` (grava pago_em ao pagar), `DELETE /api/lancamentos/:id`.
  **Aluguel das salas**: `GET /api/aluguel/pendentes` e `POST /api/reservas/:id/cobrar`
  (gera receita a partir da reserva e vincula, **bloqueando cobrança dupla** → 409).
  RBAC: financeiro/admin; cobrança de aluguel também para recepção.
- [x] `seed.js`: 5 lançamentos de exemplo (idempotente).
- [x] **Tela** (`tela-financeiro`): resumo real, tabela de lançamentos com filtros, novo
  lançamento, marcar pago, excluir, e painel "Aluguéis de sala a cobrar". Perfil sem acesso
  vê aviso. A simulação antiga ficou abaixo como referência.
- [x] `smoke-test-financeiro.js`: cria/valida/paga/lista lançamentos, resumo, e o fluxo de
  aluguel (pendentes → cobrar → bloqueio de dupla cobrança). Sintaxe isolada (API+front) OK.

### Ativar a Fase 2
1. HeidiSQL: rodar `migracao-03-financeiro.sql`.
2. Reiniciar o `server.js` (e, se quiser os exemplos, `node seed.js`).
3. Testar: `node smoke-test-financeiro.js`. No sistema, abrir "Financeiro" (perfil admin/financeiro).

### Próximo: Fase 3 — Prontuário/evolução clínica (REGULADO — CFM). Exige cuidado de conformidade;
avaliar integração vs. construção. Antes, idealmente destravar deploy (Fase 0) e validar a
API/exportação da Amplimed para migração de dados.

---

## Ideias do Twenty (UX) — 13/07/2026
Decisão: manter o stack leve; aproveitar o Twenty (CRM open-source nº 1, AGPL) só como fonte
de padrões de UX. Backlog em `IDEIAS-DO-TWENTY.md`.
- [x] **Paleta de comandos (Ctrl/⌘+K)**: busca global de telas, pacientes e ações, com
  navegação por teclado (setas/Enter/Esc) e botão "Buscar ⌘K" na topbar. Pura no front,
  reaproveita `contatosDB`, `irPara`, `fichaDB` e as funções de "novo". Sintaxe validada.
- Backlog (próximas ideias): registro rico do paciente (notas/tarefas), campos/tags
  customizáveis, views configuráveis (kanban/tabela + filtros salvos), automações leves,
  e — estratégico — expor um MCP próprio para o assistente operar o sistema.

---

## Correção do Inbox + auditoria de handlers — 13/07/2026
- [x] **Bug do Inbox corrigido**: as conversas de Carla, João e Lucas tinham `data-conv`
  errado (apontavam para marina/rafael) e o `threads` só tinha 2 conversas — por isso o item
  selecionado na lista não batia com a conversa aberta. Agora cada conversa tem `data-conv`
  próprio; o `threads` tem as 5 conversas completas; e o `abrirConv` sincroniza **cabeçalho,
  mensagens, painel de contato e linha do tempo** com o item clicado. Testado: as 5 conversas
  abrem o conteúdo certo.
- [x] **Auditoria de todos os handlers** do `index.html`: extraídos todos os
  `onclick/onchange/onkeydown` e cruzados com as funções definidas (globais e `window.*`).
  Resultado: **todos os handlers funcionais resolvem para uma função existente** (irPara,
  abrirConv, enviarMsg, carregar/novo Agendamento, Financeiro, Salas, Kanban, copiloto,
  marketing, paleta Ctrl+K, etc.). Nenhum botão funcional quebrado.
### Todos os botões funcionando (auditoria completa 13/07)
- Auditoria automatizada dos **144 botões** do index.html: cada um tem ação por `onclick`
  próprio, classe com listener (nav-item, slot-btn, btn-link-pg, bt-mais/menos, bt-reativar,
  mk-pub, model-card), id com listener (btnGravar, btnGerar, btnCampanha, btNovoAg/Reserva/Lanc),
  `data-tela/data-p`, delegação global por texto (linha ~1628), ou delegação de `.opts` no chat.
- Corrigidos os 2 únicos pontos soltos: botão **"💬 Conversa"** na ficha do paciente (agora
  abre o Inbox) e o **`alert()`** do Agendamento simulado (virou toast).
- Resultado: **0 botões mortos.** Botões das seções simuladas dão feedback (toast/modal)
  coerente até o módulo virar real.

---

## Registro rico do paciente — Notas + Tarefas — 13/07/2026 (ideia Twenty)
- [x] `migracao-04-notas-tarefas.sql`: tabelas `notas` e `tarefas` ligadas ao contato
  (ON DELETE CASCADE). Refletido no `schema.sql`.
- [x] **API** (`server.js`): notas — `GET/POST /api/contatos/:id/notas`, `DELETE /api/notas/:id`;
  tarefas — `GET/POST /api/contatos/:id/tarefas`, `PATCH /api/tarefas/:id` (conclui/reabre,
  grava feita_em), `DELETE /api/tarefas/:id`. RBAC: leitura logada, escrita recepção/médico.
  Auditoria em todas as gravações.
- [x] **Ficha do paciente** (`fichaDB`): novas seções **Notas** e **Tarefas** — adicionar por
  Enter ou botão, concluir tarefa por checkbox (risca), excluir com ×, tudo persistido no banco
  e recarregando a ficha. Escape de HTML nos textos (anti-XSS).
- [x] `smoke-test-notas-tarefas.js`: cria/lista/exclui nota (com autor), valida nota vazia (400),
  cria/conclui/reabre/exclui tarefa, valida título vazio (400), e 401 sem sessão.
- [x] Sintaxe validada: server.js (node --check), fichaDB isolada (parse + execução), fim do
  index.html íntegro (</html>).

### Ativar
1. HeidiSQL: rodar `migracao-04-notas-tarefas.sql`.
2. Reiniciar `server.js`; testar `node smoke-test-notas-tarefas.js`.
3. No sistema: Kanban/Contatos → clicar num paciente do banco → usar Notas e Tarefas.

Obs.: a migração já foi aplicada no banco em 13/07 via HeidiSQL (salas, reservas_sala,
notas, tarefas criadas; colunas de agenda/financeiro adicionadas). Falta reiniciar o server.js
para carregar as rotas novas.

---

## Tour de boas-vindas (1º acesso de cada usuário) — 13/07/2026
- [x] `migracao-05-tour.sql`: coluna `tour_visto` em usuarios (0 = ainda não viu). Refletido
  no `schema.sql` e no `MIGRAR-TUDO.sql`.
- [x] **API**: login agora inclui `tour_visto` na sessão; `POST /api/tour-visto` marca como
  visto (grava no banco e na sessão). `/api/me` já devolve o campo.
- [x] **Tour** (`index.html`): overlay com spotlight + tooltip, 11 passos guiando pelas áreas
  (menu, Inbox, Kanban, Agendamento, Financeiro, Salas, ficha do paciente, Copiloto, Ctrl+K).
  Aparece **só quando `tour_visto = 0`** (primeiro acesso); ao concluir/pular, marca visto e
  não volta. Botões Pular/Voltar/Próximo, indicador de progresso, reposiciona no resize.
- [x] **Rever depois**: ação "Ver tour de boas-vindas" na busca **Ctrl+K** reabre a qualquer
  momento (útil para treinar alguém de novo).
- [x] Sintaxe validada (bloco do tour: parse + execução; server.js íntegro; index.html </html>).

### Ativar o tour
1. HeidiSQL: rodar `migracao-05-tour.sql` (ou rodar o `MIGRAR-TUDO.sql` de novo — é seguro).
2. Reiniciar o `server.js`.
3. Como todos os usuários começam com `tour_visto = 0`, o tour aparece no próximo login de
   cada um — inclusive no seu, para você conferir. Depois some sozinho. Para rever: Ctrl+K →
   "Ver tour de boas-vindas".
- Futuro: cobrança do aluguel (avulsa/mensal) integrada ao Financeiro; cadastro de médicos
  locatários externos; recorrência semanal para contratos mensais.
