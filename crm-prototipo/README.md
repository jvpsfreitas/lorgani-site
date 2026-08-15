# L'Organi Flow — CRM da Clínica L'Organi

> Handoff para continuar o desenvolvimento (inclusive no **Claude Code**).
> Dica: para o Claude Code carregar este contexto automaticamente, copie este arquivo
> para `CLAUDE.md` na raiz do projeto (`copy README.md CLAUDE.md`).

Sistema de gestão para a **Clínica L'Organi** (otorrinolaringologia + medicina estética,
Campo Belo/SP). Começou como protótipo navegável (HTML único) e evoluiu para um app real
com backend, banco e login. Objetivo de longo prazo: **substituir a Amplimed** (o sistema
atual da clínica) de forma gradual, sem parar a operação. Preferência do dono: ser o melhor
sistema para a própria clínica; produtizar só depois.

---

## 1. Stack

- **Frontend:** HTML5 + CSS3 + JavaScript puro (sem framework). Tudo num único `index.html`
  (~2.850 linhas): CSS num `<style>`, JS num `<script>` no fim.
- **Backend:** Node.js + Express (`backend/server.js`, ~660 linhas).
- **Banco:** MariaDB 12.3 (compatível MySQL), driver `mysql2/promise`. Banco: `lorgani_flow`.
- **Auth/segurança:** `express-session` + `bcryptjs`.
- **Dono não é programador:** priorize explicações simples, arquivos prontos e economia de passos.

---

## 2. Estrutura do repositório

```
crm-prototipo/
├─ index.html                      # App inteiro (front). Servido em /app após login.
├─ PRD-LOrgani-Flow.md             # Requisitos/escopo do produto (fonte da verdade).
├─ PROGRESSO.md                    # Histórico detalhado do que foi feito (LER PRIMEIRO).
├─ CONTEXTO-PARA-CLAUDE.md         # Decisões de design e dados reais da clínica.
├─ ROADMAP-SUBSTITUICAO-AMPLIMED.md# Plano faseado para substituir a Amplimed.
├─ IDEIAS-DO-TWENTY.md             # Backlog de UX inspirado no CRM open-source Twenty.
├─ README.md                       # Este arquivo.
└─ backend/
   ├─ server.js                    # Express: rotas REST, sessão, RBAC, auditoria.
   ├─ schema.sql                   # Cria o banco do zero (instalação nova).
   ├─ seed.js                      # Popula usuários, contatos, insumos, salas, lançamentos.
   ├─ config.bat                   # Guarda DB_SENHA (senha do MariaDB root). NÃO versionar.
   ├─ package.json
   ├─ publico/
   │  ├─ login.html                # Tela de login (servida na raiz).
   │  └─ logo.png                  # Logo colorido (símbolo bordô, fundo transparente).
   ├─ INSTALAR.bat                 # Instalação guiada (Windows): banco + npm + seed.
   ├─ INICIAR.bat                  # Sobe o servidor no dia a dia (node server.js).
   ├─ ACESSO-EXTERNO.bat           # Túnel Cloudflare temporário (acesso de fora).
   ├─ COMO-ACESSAR.md              # Como os funcionários acessam.
   ├─ MIGRAR-TUDO.sql              # Aplica TODAS as migrações de uma vez (idempotente).
   ├─ migracao-01-salas.sql        # Salas de coworking.
   ├─ migracao-02-agenda.sql       # Agenda própria (colunas em agendamentos).
   ├─ migracao-03-financeiro.sql   # Financeiro (colunas em lancamentos/reservas_sala).
   ├─ migracao-04-notas-tarefas.sql# Notas e tarefas na ficha do paciente.
   ├─ migracao-05-tour.sql         # Coluna tour_visto (tour de boas-vindas).
   └─ smoke-test-*.js              # Testes de fumaça por módulo (fetch nativo, Node 18+).
```

---

## 3. Como instalar e rodar (Windows)

Pré-requisitos: **Node.js LTS** e **MariaDB** instalados (o Command Prompt do MariaDB 12.3
já está na máquina do dono).

**Primeira vez (instalação nova, banco vazio):**
1. `backend/INSTALAR.bat` — cria o banco a partir do `schema.sql`, roda `npm install` e o `seed.js`.
   (Pede a senha do root do MariaDB e a salva em `config.bat`.)

**Se o banco JÁ existe (caso atual):** rode as migrações e (re)popule se quiser exemplos.
1. No **HeidiSQL**: selecione o banco `lorgani_flow`, carregue **`backend/MIGRAR-TUDO.sql`**
   e execute (F9). É idempotente (usa `IF NOT EXISTS`), não apaga dados, pode rodar de novo.
2. (Opcional) exemplos: na pasta `backend`, `node seed.js`.

**Rodar no dia a dia:**
- `backend/INICIAR.bat` (mantém a janela aberta). Acesse `http://localhost:3000`.
- Login inicial: `admin@lorgani.com.br` / senha `Lorgani@2026` (TROCAR — ver Segurança).

> A senha do MariaDB root fica em `backend/config.bat` (variável `DB_SENHA`). É a mesma
> usada para conectar no HeidiSQL (usuário `root`, host 127.0.0.1, porta 3306).

**Variáveis de ambiente lidas pelo server** (todas opcionais, com padrão):
`PORTA` (3000), `DB_HOST` (localhost), `DB_USER` (root), `DB_SENHA`, `SESSAO_SEGREDO`,
`HTTPS` (=1 liga cookie seguro).

---

## 4. Banco de dados (tabelas)

- `usuarios` — id, nome, email, senha_hash, papel(ENUM admin/medico/recepcao/financeiro),
  ativo, **tour_visto**, criado_em.
- `contatos` — pacientes/leads do CRM (nome, whatsapp, convenio, etapa do Kanban, etc.).
- `eventos_contato` — linha do tempo do paciente.
- `notas` — notas livres na ficha do paciente (contato_id, texto, autor_id).
- `tarefas` — to-dos do paciente (titulo, feita, vencimento, feita_em, autor_id).
- `agendamentos` — agenda própria (contato_id, profissional, especialidade, **sala_id**,
  inicio, **fim**, status, **observacoes**).
- `lancamentos` — financeiro (descricao, tipo receita/despesa, valor, forma, status,
  **pago_em**, **origem**, vencimento).
- `insumos` / `movimentos_estoque` — estoque com lote/validade/mínimo e histórico.
- `salas` / `reservas_sala` — coworking (reservas com tipo avulsa/mensal, valor,
  **lancamento_id** para ligar ao financeiro).
- `auditoria` — LGPD/segurança: quem fez o quê, quando, de qual IP.

Migrações aplicadas no banco em 13/07/2026 via HeidiSQL (01–04). A **05 (tour_visto)** precisa
ser rodada (ou rode o `MIGRAR-TUDO.sql` de novo).

---

## 5. API REST (todas as rotas em `server.js`)

RBAC: `exigeLogin` (qualquer logado) e `exigePapel(...papeis)` (admin é superusuário).

**Auth**
- `POST /api/login` {email, senha} · `POST /api/logout` · `GET /api/me` · `POST /api/tour-visto`

**Usuários** (admin)
- `GET /api/usuarios` · `POST /api/usuarios`

**Contatos / CRM Kanban**
- `GET /api/contatos` · `POST /api/contatos` (recepcao/medico) ·
  `PATCH /api/contatos/:id/etapa` · `GET /api/contatos/:id/eventos`

**Notas e Tarefas** (leitura logada; escrita recepcao/medico)
- `GET|POST /api/contatos/:id/notas` · `DELETE /api/notas/:id`
- `GET|POST /api/contatos/:id/tarefas` · `PATCH /api/tarefas/:id` · `DELETE /api/tarefas/:id`

**Estoque** (leitura logada; escrita recepcao/financeiro)
- `GET /api/insumos` · `GET /api/estoque/resumo` · `POST /api/insumos` ·
  `PATCH /api/insumos/:id` · `POST /api/insumos/:id/movimento` (transacional, sem estoque
  negativo) · `GET /api/insumos/:id/movimentos`

**Salas** (leitura logada; escrita recepcao)
- `GET /api/salas` · `GET /api/reservas?de=&ate=&sala_id=` ·
  `POST /api/reservas` (bloqueia sobreposição na mesma sala → 409) · `DELETE /api/reservas/:id`

**Agenda** (leitura logada; escrita recepcao/medico)
- `GET /api/agendamentos?de=&ate=&profissional=` ·
  `POST /api/agendamentos` (bloqueia conflito de profissional e de sala → 409) ·
  `PATCH /api/agendamentos/:id/status`

**Financeiro** (financeiro/admin; cobrar aluguel também recepcao)
- `GET /api/financeiro/resumo` · `GET /api/lancamentos?tipo=&status=&de=&ate=` ·
  `POST /api/lancamentos` · `PATCH /api/lancamentos/:id/status` · `DELETE /api/lancamentos/:id`
- `GET /api/aluguel/pendentes` · `POST /api/reservas/:id/cobrar` (gera receita a partir da
  reserva e vincula, sem cobrar duas vezes → 409)

**Arquivos**
- `GET /` → redireciona (login ou /app) · `GET /app` (exige login, serve index.html) ·
  estático `publico/` (login.html, logo.png) · `/assets`

**Endurecimento já aplicado:** wrapper `w()` + middleware de erro global (evita request
travado), throttle de login (5 tentativas/IP em 15min → 429), cookie `httpOnly`+`sameSite`,
`secure` quando `HTTPS=1`, `trust proxy`, auditoria em gravações, 409 para e-mail duplicado.

---

## 6. Frontend (`index.html`)

Bloco de integração (Fase B) é uma IIFE no fim do `<script>` que só ativa quando servido
pelo `server.js` (ignora `file://`). Ela lê `/api/me` e liga as telas ao banco.

**Telas ligadas ao banco (reais):** Kanban/Contatos, Estoque, Salas, Agendamento, Financeiro,
Notas/Tarefas na ficha do paciente.
**Telas ainda simuladas (referência):** Inbox (parcial), Recuperação, Marketing, Anamnese IA,
Agente de IA, Conexões, e as "grades antigas" abaixo das versões reais de Agenda/Financeiro.

**Recursos de UX adicionados:**
- **Paleta de comandos `Ctrl+K`** — busca telas, pacientes e ações; navegação por teclado.
- **Copiloto `✦`** (botão flutuante) — executa comandos simulados ("resumo do dia" etc.).
- **Tour de boas-vindas** — overlay com spotlight, aparece só no 1º acesso (`tour_visto=0`);
  reabrir por Ctrl+K → "Ver tour de boas-vindas".
- **Ficha do paciente** (`window.fichaDB`) — histórico + **Notas** + **Tarefas** reais.

---

## 7. Perfis, usuários e senha

Papéis: `admin` (tudo), `medico`, `recepcao`, `financeiro`. O seletor "Ver como" no rodapé
da sidebar é definido pelo papel real do login (admin pode trocar).

Seed cria 10 usuários (senha inicial **`Lorgani@2026`**): admin, Dra. Rita Soler, Dra. Luciane
Freitas, Dra. Luciana Segatto, Renata Toledo, Silvia Manzi, 3x Recepção, Financeiro.

---

## 8. Testes

Com o servidor no ar e o banco migrado, na pasta `backend`:
`node smoke-test.js` (estoque) · `smoke-test-salas.js` · `smoke-test-agenda.js` ·
`smoke-test-financeiro.js` · `smoke-test-notas-tarefas.js`. Cada um loga, exercita o CRUD,
valida bloqueios (conflito de horário, estoque negativo, cobrança dupla) e 401 sem sessão.

---

## 9. Pegadinhas / convenções (IMPORTANTE)

- **OneDrive:** a pasta é sincronizada. **Edite pelos arquivos** (não gere HTML por comandos de
  shell — risco de truncar). Ao terminar, confira que `index.html` termina em `</html>`.
- `index.html` é **arquivo único**. Ao editar rotas vitais de `server.js`, mantenha o código
  completo (sem `// ...`).
- **Design system:** bordô `#8A2517` (degradê `--grad-bordo`), creme `#F7EFE0`, verde-oliva,
  âmbar. Fontes **Jost** (interface) e **Fraunces** (títulos). Sidebar/topo brancos; item ativo
  em bordô. O dono REJEITOU sidebar bordô sólida e excesso de emojis. Micro-animações sutis, ok.
- **Integração-alvo real: AMPLIMED** (nunca Feegow). Agente = "Lia". Copiloto = "✦".
- **Dados reais da clínica** (usar, não inventar): R. Antônio de Macedo Soares, 1760 — Campo
  Belo/SP · Tel (11) 5533-5522 · WhatsApp (11) 95043-5522 · Seg–Sex 7h–19h · Dra. Rita de
  Cássia Soler (CRM 66.353) e Dra. Luciane de Paula e Silva de Freitas (CRM 66.204) · fono:
  Renata Toledo, Silvia Manzi · emagrecimento: Dra. Luciana Segatto · Instagram
  @lorganiclinicamedica e @lorganiestetica · convênios: atende **alguns** (misto particular).
- **Publicidade médica (CFM):** sem promessa de resultado; responsável técnica com CRM no
  rodapé; sem antes/depois não autorizado. O gerador de marketing já aplica isso.

---

## 10. Status atual e pendências

**Feito nesta fase:** endurecimento do backend; módulos reais de **Estoque**, **Salas**,
**Agenda (Fase 1)**, **Financeiro + aluguel das salas (Fase 2)**, **Notas/Tarefas**; paleta
`Ctrl+K`; **tour de boas-vindas**; logo corrigido; bug do Inbox corrigido; auditoria dos 144
botões (0 quebrados). Migrações 01–04 aplicadas no banco.

**Pendências imediatas:**
1. Rodar `migracao-05-tour.sql` (ou `MIGRAR-TUDO.sql`) no HeidiSQL.
2. **Reiniciar o `server.js`** para carregar as rotas novas (salas/agenda/financeiro/notas/
   tarefas/tour). Sem isso, o front chama rotas que o servidor antigo não tem.

**Próximos passos (ordem sugerida):**
- **Deploy (Fase 0):** VPS + HTTPS + backup. O dono tem VPS (falta provedor/SO/IP). DNS do
  domínio `lorgani.com.br` está na **Wix** — criar registro A `sistema.lorgani.com.br` → IP.
- **Validar a API/exportação da Amplimed** (risco técnico nº 1): sem migrar os dados de lá,
  não dá para desligar o sistema antigo.
- **Fase 2+ do roadmap:** Fase 3 Prontuário, Fase 4 Prescrição/Telemedicina, Fase 5 TISS,
  Fase 6 Relatórios/BI. Fases 3–5 são **reguladas** (CFM, ICP-Brasil, padrão TISS): preferir
  **integração com provedor certificado** a construir do zero. Detalhes em
  `ROADMAP-SUBSTITUICAO-AMPLIMED.md`.

---

## 11. Segurança — antes de expor na internet (obrigatório)

1. **Trocar a senha padrão** dos usuários (todos começam com `Lorgani@2026`).
2. Definir um **`SESSAO_SEGREDO`** forte (env), no lugar do fallback do código.
3. Servir **só por HTTPS** (cookie `secure` com `HTTPS=1`; o túnel/Nginx termina o TLS).
4. Considerar `helmet` + rate-limit persistente na versão de produção (hoje o throttle é em
   memória, some ao reiniciar — suficiente para 1 servidor de clínica).
5. Checklist de código ao mexer: segredos fora do repo, validação de entrada, SQL só com
   placeholders `?`, escape de HTML no front (anti-XSS), ações state-changing atrás de RBAC.

---

## 12. Como continuar no Claude Code

1. Abra a pasta `crm-prototipo` no Claude Code (opcional: `copy README.md CLAUDE.md`).
2. Leia `PROGRESSO.md` (histórico) e `ROADMAP-SUBSTITUICAO-AMPLIMED.md` (plano).
3. Rode `MIGRAR-TUDO.sql` no HeidiSQL e reinicie o `server.js`.
4. Padrão de trabalho ao adicionar um módulo (foi o usado aqui): migração SQL idempotente →
   rotas no `server.js` (transacional + RBAC + auditoria) → tela no `index.html` (reuso de
   `abrirModal`, `toast`, `escaparHTML`) → `smoke-test-*.js` → checagem de sintaxe → atualizar
   `PROGRESSO.md`.
