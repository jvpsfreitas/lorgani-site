# PRD — L'Organi Flow
## Sistema de gestão da Clínica L'Organi (CRM conversacional + operação completa)

Versão 1.0 · 10/07/2026 · Autor: João (com Claude)

---

## 1. Visão geral

O L'Organi Flow é o sistema central de gestão da Clínica L'Organi (Otorrinolaringologia e Medicina Estética — Campo Belo, SP). Ele unifica num só lugar: o relacionamento com pacientes (CRM), o atendimento via WhatsApp com agente de IA, o agendamento integrado ao Amplimed, o financeiro, o estoque e a anamnese assistida por IA.

**Problema que resolve:** hoje as informações da clínica ficam espalhadas (WhatsApp no celular, agenda no Amplimed, financeiro em planilha, estoque no papel, anotações de consulta manuais). Isso gera retrabalho, perda de pacientes no funil e falta de visão gerencial.

**Princípio de design:** fácil de usar. A recepção precisa operar sem treinamento longo. Interface baseada no design system de referência (telas ClinicaFlow): sidebar de navegação à esquerda, cards brancos limpos, métricas grandes, badges de status coloridos — adaptado à identidade L'Organi (bordô #702018, creme, fontes Jost/Fraunces).

---

## 2. Usuários e perfis de acesso (RBAC)

Nem todo usuário vê tudo. O sistema tem papéis com permissões distintas:

| Perfil | Vê e faz | NÃO acessa |
|---|---|---|
| **Administrador** (sócias) | Tudo: todos os módulos, configurações, relatórios, gestão de usuários | — |
| **Médico(a)** | Agenda própria, prontuário/anamnese dos seus pacientes, teleconsulta, histórico clínico | Financeiro, estoque (exceto solicitar item), configuração do agente |
| **Recepção** | Inbox WhatsApp, CRM/Kanban, agendamento, cadastro de pacientes, cobrança básica (links de pagamento) | Anamnese/prontuário clínico, financeiro gerencial, relatórios financeiros |
| **Financeiro** | Módulo financeiro completo, relatórios, conciliação, estoque (custos) | Prontuário/anamnese, configuração do agente |

Regras transversais: toda ação sensível é registrada em log de auditoria (quem, o quê, quando); dados clínicos são visíveis apenas a médicos (sigilo médico); o agente de IA tem acesso de leitura ao CRM e à agenda, mas nunca ao prontuário clínico.

---

## 3. Módulos

### 3.1 CRM com visão Kanban (ciclo de vida do paciente)
- Todo número que chama no WhatsApp vira um contato automaticamente.
- **Kanban do ciclo de vida**, colunas: `Novo → Em conversa → Qualificado → Agendado → Atendido → Retorno/Recorrente`. Cards arrastáveis; movimentação automática conforme eventos (ex.: agendamento criado → move para "Agendado").
- Ficha do contato: dados pessoais, convênio, unidade, linha do tempo completa (mensagens, agendamentos, presenças, faltas, pagamentos), conversas vinculadas.
- **Histórico unificado**: o agente de IA consulta o CRM para saber se é paciente novo ou recorrente e adapta a conversa ("Bem-vinda de volta, Marina!").
- Filtros e busca por nome, telefone, CPF, status, convênio.

### 3.2 Inbox WhatsApp + Agente de IA "Lia"
- Inbox em 3 colunas: lista de conversas (filtros Todas/Atendente/IA), thread central, painel de contexto do contato à direita.
- **Agente Lia (secretária virtual)**, modelo híbrido: linguagem natural na entrada, fluxo estruturado na efetivação do agendamento.
  - Roteador de intenções: agendar, remarcar, cancelar, dúvida sobre procedimentos, falar com humano, outro. Intenção ambígua → pergunta de desambiguação, nunca ação irreversível por suposição.
  - Base de conhecimento editável: endereço, horários (Seg–Sex 7h–19h), convênios/particular, valores, preparo de exames, FAQ sobre procedimentos (otorrino e estética).
  - Ferramentas (function calling) mapeando a API do Amplimed: consultar disponibilidade, buscar paciente, listar especialidades/profissionais/convênios (leitura) e criar paciente, criar/remarcar/cancelar agendamento (escrita, sempre com confirmação do paciente).
  - **Handoff humano**: paciente pode pedir atendente a qualquer momento; transferência automática em gatilhos (sofrimento, reclamação, fora de escopo, falha repetida). Atendente recebe o contexto completo e pode devolver a conversa ao agente.
  - Limites de segurança: nunca dar orientação clínica/diagnóstico; nunca prometer horário não confirmado; nunca inventar valores. Dúvida clínica → direciona ao profissional.
- Respeito à janela de 24h da Meta (WhatsApp Cloud API oficial).

### 3.3 Agendamento (integração Amplimed)
- Disponibilidade lida **em tempo real** do Amplimed — sem agenda paralela; gravação direto via API.
- Grade semanal por profissional e especialidade; filtros por unidade, convênio e tipo (consulta/procedimento).
- Multi-agenda: resolve especialidade e profissional antes de consultar disponibilidade; respeita restrições (idade, convênio, telemedicina).
- Confirmações e lembretes automáticos via WhatsApp (D-1 e 3h antes), com opção de confirmar/remarcar na própria mensagem.

### 3.4 Financeiro (acesso restrito)
- Contas a receber: consultas e procedimentos, por convênio e particular; status (pendente, pago, glosado, atrasado).
- Contas a pagar: fornecedores, insumos, custos fixos.
- **Cobrança integrada**: geração de link de pagamento (Pix e cartão) enviado pelo WhatsApp — inclusive pela Lia após agendamento de particular, se configurado.
- Fluxo de caixa e dashboard gerencial: faturamento por especialidade/profissional, ticket médio, inadimplência, comparativo mensal.
- Conciliação com extrato (gateway de pagamento).

### 3.5 Estoque
- Cadastro de insumos com lote, validade e estoque mínimo (crítico para estética: toxina botulínica, preenchedores, agulhas, descartáveis).
- Entradas (compras) e saídas (consumo por procedimento — baixa automática ao registrar o procedimento).
- Alertas: estoque abaixo do mínimo e validade próxima (30/60 dias).
- Relatório de consumo e custo por procedimento (alimenta o financeiro).

### 3.6 Anamnese com IA (pré-anamnese e transcrição de consulta)
- **Fluxo**: no início da consulta (presencial ou teleconsulta), o médico ativa a gravação → a IA transcreve em tempo real → ao final, o médico pede "gerar anamnese" → a IA estrutura o texto em anamnese padronizada (queixa principal, HDA, antecedentes, medicações, exame, hipótese, conduta) → **o médico revisa, edita e assina** — a IA nunca finaliza sozinha.
- Pré-anamnese opcional: formulário enviado ao paciente pelo WhatsApp antes da consulta (queixa, alergias, medicações) que já abastece a ficha.
- A gravação e a transcrição ficam vinculadas ao prontuário do paciente, acessíveis apenas a médicos.
- **Requisitos legais**: consentimento explícito do paciente para gravação (registrado no sistema); dados de saúde são dados sensíveis (LGPD) — criptografia em repouso e em trânsito, política de retenção definida; conformidade com normas do CFM para telemedicina e prontuário.

---

## 4. Dashboard (visão do dia)
- Métricas: conversas abertas, aguardando atendente (tempo médio), agendados hoje (quantos via Lia), conversão para agendamento.
- Funil do dia (jornada dos contatos), conversas recentes, agenda de hoje (Amplimed), status das integrações.
- Cada perfil vê um dashboard adequado (recepção = operação; admin = operação + financeiro resumido).

---

## 5. Integrações

| Integração | Uso | Observação |
|---|---|---|
| **Amplimed API** | Agenda, pacientes, prontuário (fonte da verdade) | Central — validar limites/endpoints da API na fase técnica |
| **WhatsApp Cloud API (Meta)** | Canal oficial de atendimento | Requer verificação da empresa Meta Business |
| **IA — LLM** (OpenAI/Anthropic) | Agente Lia, geração de anamnese | Custo por uso; logs auditáveis |
| **IA — Transcrição** (ex.: Whisper) | Transcrição das consultas | Processamento com salvaguardas LGPD |
| **Gateway de pagamento** (ex.: Asaas, Stripe, Pix) | Links de cobrança, conciliação | Definir na fase técnica |

---

## 6. Requisitos não-funcionais
- **Segurança/LGPD**: RBAC, criptografia, log de auditoria, consentimentos registrados, backup diário, anonimização em relatórios.
- **Usabilidade**: operável pela recepção sem treinamento longo; responsivo (funciona em tablet/celular).
- **Disponibilidade**: atendimento WhatsApp é crítico — meta de 99,5%; se o agente cair, mensagens caem na fila humana.
- **Design system**: réplica do padrão das telas de referência com identidade L'Organi.

---

## 7. Roadmap de implementação

| Fase | Escopo | Status |
|---|---|---|
| **Fase 0 — Protótipo navegável** | Todas as telas clicáveis com dados fictícios (validação de design e fluxos) | Em construção automática, entrega 12/07 |
| **Fase 1 — MVP** | WhatsApp + agente Lia + CRM/Kanban + agendamento Amplimed + perfis de acesso | 1º trimestre do projeto |
| **Fase 2 — Gestão** | Financeiro + estoque + cobrança integrada | 2º trimestre |
| **Fase 3 — Clínico** | Anamnese IA + teleconsulta + pré-anamnese via WhatsApp | 3º trimestre |

O protótipo (Fase 0) serve como especificação visual para orçar as fases 1–3 com desenvolvedores ou fábrica de software.

---

## 8. Métricas de sucesso
- ≥ 60% das conversas de agendamento resolvidas pela Lia sem humano.
- Tempo de resposta no WhatsApp < 1 min (vs. horas hoje).
- Zero agendamentos perdidos por falta de retorno (funil Kanban monitorado).
- Redução de 70% do tempo do médico redigindo anamnese.
- Estoque sem ruptura de insumos críticos.

## 9. Anexo v1.1 — Gaps identificados e melhorias (análise 10/07)

### 9.1 Clínico (adicionar à Fase 3)
- Prontuário eletrônico completo: evolução entre consultas, prescrições, atestados, pedidos de exame, anexos de resultados, CID-10.
- Termo de consentimento digital com assinatura (obrigatório em estética) + fotos antes/depois com autorização, vinculados ao prontuário.
- DECISÃO ARQUITETURAL PENDENTE: fronteira Amplimed × L'Organi Flow para prontuário — não duplicar. Opções: (a) prontuário fica 100% no Amplimed e o Flow só anexa a anamnese IA via API; (b) prontuário migra para o Flow. Validar com a API do Amplimed.

### 9.2 Comercial / receita (nova Fase 2.5 — prioridade alta para estética)
- Funil de VENDAS separado do ciclo de vida: Avaliação → Orçamento enviado → Negociação → Fechado → Em sessões → Renovação.
- Orçamentos de procedimentos/pacotes com controle de sessões restantes.
- Fidelização: follow-up pós-procedimento automático (D+7, D+30), reativação de inativos (6 meses), aniversários, NPS via WhatsApp.

### 9.3 Operação
- Lista de espera com encaixe automático em cancelamento.
- Score de risco de no-show + lembrete reforçado.
- Comissionamento/repasse por profissional (no Financeiro).
- Central de tarefas internas atribuíveis à equipe.
- Comportamento noturno da Lia (24/7): agenda normalmente; pedido de humano fora de 7h–19h vira recado com promessa de retorno.

### 9.4 Módulo central de IA — "L'Organi Intelligence"
Camada única de IA servindo todos os módulos (não recursos isolados):
- Copiloto de gestão: chat "pergunte aos seus dados" (faturamento, pacientes sumidos, comparativos) com function calling/text-to-SQL sobre os relatórios.
- Resumo semanal automático com alertas e anomalias (conversão, faltas, estoque, caixa).
- Brief do paciente: resumo de 5 linhas do histórico, gerado antes de cada consulta, para o médico.
- Previsões: fluxo de caixa, consumo de estoque baseado na agenda futura (sugestão de compra), risco de inadimplência.
- Kanban inteligente: sugestão de próxima ação por card.
- Marketing: geração de campanhas segmentadas e copy no tom da clínica.
- Arquitetura: gateway de IA único com múltiplos provedores (OpenAI/Anthropic + fallback), logs auditáveis de prompts, RAG sobre a base de conhecimento, guardrails para dados clínicos (anonimização quando possível), teto de custo mensal, sandbox de avaliação contínua.

### 9.4b Central de Marketing (pedido do usuário em 11/07 — construir no protótipo quando os créditos voltarem)
Módulo "Marketing" (hoje marcado como "em breve" na sidebar) que integra Instagram, Facebook e Google:
- **Gerador de posts por IA**: usuário escolhe o serviço (ronco/apneia, audiometria, toxina, laser, emagrecimento...) e o formato (post, carrossel, story); a IA gera legenda no tom da clínica + sugestão de arte, respeitando as regras do CFM (sem promessa de resultado, CRM da responsável).
- **Calendário editorial**: grade semanal/mensal com os posts planejados, arrastar para reagendar.
- **Publicação automática**: fila de publicação com horário; na versão real usa a Meta Graph API (Instagram + Facebook — requer contas business e app aprovado) e a API do Google Business Profile (posts no perfil do Google). No protótipo: simulação com status "agendado → publicado".
- **Métricas**: alcance/engajamento por post e por rede, melhores horários.
- Aproveitar os 12 posts prontos do Plano-Estrategico-Digital-LOrgani.docx como conteúdo inicial.

NOTA DE DESIGN (11/07): o usuário NÃO gostou da inversão (sidebar/topbar bordô) — foi revertida.
Padrão aprovado: sidebar e topo brancos, fundo creme, item ativo do menu em bordô degradê,
botões do cabeçalho em pílula sem emoji. Não repetir barras laterais em bordô sólido.

### 9.5 Técnico (adicionar à fase de arquitetura)
- Modelo de dados das entidades principais (Contato, Paciente, Conversa, Agendamento, Orçamento, Transação, Item de estoque, Documento clínico, Usuário/Papel, Log).
- Migração/onboarding de dados atuais (Amplimed, planilhas).
- Fallback se o Amplimed cair: fila de operações + aviso ao atendente (nunca inventar disponibilidade).
- Módulo Relatórios/BI próprio.
- Multiunidade preparado desde o modelo de dados (futuro).

### 9.6 Roadmap revisado
| Fase | Escopo |
|---|---|
| 0 | Protótipo navegável (entrega 12/07, automático) |
| 1 | MVP: WhatsApp + Lia + CRM/Kanban + agendamento + RBAC |
| 2 | Financeiro (com comissionamento) + estoque + cobrança |
| 2.5 | Funil de vendas/pacotes + fidelização (motor de receita da estética) |
| 3 | Clínico: anamnese IA + prontuário/consentimentos + teleconsulta |
| 4 | L'Organi Intelligence: copiloto, previsões, resumos automáticos |

## 10. Riscos e pontos de atenção
- **Dependência do Amplimed**: confirmar cobertura da API (disponibilidade, escrita de agendamento) antes da Fase 1 — é o risco técnico nº 1.
- **Gravação de consultas**: exige consentimento e parecer jurídico (LGPD + CFM); implementar apenas na Fase 3 com validação.
- **Custo de APIs de IA**: monitorar por conversa/consulta; definir teto mensal.
- **Janela de 24h da Meta**: mensagens fora da janela exigem templates aprovados.
- **Adoção da equipe**: começar com a recepção (Fase 1) e treinar por módulo.
