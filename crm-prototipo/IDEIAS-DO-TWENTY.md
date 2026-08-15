# Ideias do Twenty aplicadas ao LOrgani Flow

Decisão: manter o stack leve atual (HTML/JS + Express + MySQL) e **trazer padrões** do
Twenty (não a plataforma). Foco: ser o melhor sistema para a L'Organi; produtizar só depois,
com mais experiência.

Fontes: repositório twentyhq/twenty (AGPL-3.0; TypeScript/NestJS/GraphQL/PostgreSQL/React)
e documentação. O Twenty é um CRM horizontal de vendas — o domínio de clínica continua sendo
nosso para construir; dele aproveitamos UX, modelo de dados flexível e a abordagem AI/MCP.

## Prioridade alta (baixo custo, alto impacto)
1. **Paleta de comandos (Ctrl+K)** — buscar telas, pacientes e ações num só campo, com teclado.
   Sensação de produto "de referência". FEITO (13/07). Pura no front, não mexe no backend.
2. **Busca global de pacientes** — embutida na paleta (usa /api/contatos já carregado).
3. **Atalhos de teclado / keyboard-first** — navegar sem mouse; começa pela paleta.

## Prioridade média (próximas)
4. **Registro rico do paciente** — a Central do Paciente ganhar **notas** e **tarefas** além
   da timeline (o Twenty organiza tudo em torno do registro). Reaproveita `eventos_contato`.
5. **Campos/tags customizáveis no paciente** — sem alterar schema toda vez (ex.: alergias,
   convênio, marcadores). Guardar como tabela de campos ou JSON. Espelha os "custom objects".
6. **Views configuráveis** — alternar Kanban/Tabela e salvar filtros (o Twenty gira em torno
   de views). Aplicável ao CRM e à Agenda.
7. **Automação simples (workflows)** — ex.: ao mover no Kanban para "agendado", criar uma
   tarefa/lembrete; ao faltar, disparar recuperação. O Twenty tem workflows; fazemos regras leves.

## Prioridade estratégica (quando/se produtizar)
8. **AI/MCP nativo** — o Twenty expõe um servidor MCP (Claude/ChatGPT leem e escrevem no CRM).
   O LOrgani já tem API REST; um dia dá para expor um MCP próprio para o assistente operar o
   sistema por linguagem natural. Casa com o Copiloto ✦ e a "Lia".
9. **Design tokens/consistência** — o Twenty é muito consistente visualmente; manter nossa
   paleta/tipografia em variáveis (já fazemos) e padronizar componentes.

## O que NÃO adotar agora
- Trocar o stack para Postgres/React/NestJS/Docker (rebuild) — alto custo e disrupção, sem
  ganho para a operação atual da clínica.
- AGPL como serviço a terceiros — só relevante se virar SaaS para outras clínicas; aí exige
  estratégia de licença e conformidade de saúde (rever com advogado).
