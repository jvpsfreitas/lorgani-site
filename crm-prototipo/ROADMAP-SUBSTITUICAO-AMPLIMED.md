# Roadmap — LOrgani Flow substituindo a Amplimed (sem parar a clínica)

Objetivo do dono: o LOrgani Flow assumir, com o tempo, tudo que a clínica usa hoje na
Amplimed — inclusive prontuário, prescrição e faturamento. A clínica atende **alguns
convênios** (misto particular + convênio).

Regra de ouro: **nunca virar a chave de uma vez.** Cada módulo roda em PARALELO à Amplimed
até atingir paridade e ser validado pela equipe; só então "corta" aquele módulo na Amplimed.
A assinatura da Amplimed só é cancelada quando TODOS os módulos essenciais estiverem
migrados, estáveis e com dados dentro do LOrgani.

## Pré-requisitos globais (valem para todas as fases)
1. **Produção real**: VPS + HTTPS + backup automático (deploy já iniciado — aguardando
   provedor/SO/IP). Sem isso, não se coloca dado de paciente no ar.
2. **Migração de dados da Amplimed**: pacientes, histórico, agenda e financeiro. Depende da
   **API da Amplimed** (o PRD marca como "risco técnico nº 1") ou de exportação (CSV/planilha).
   É preciso validar esse acesso ANTES de prometer substituição — sem os dados históricos,
   não há como desligar a Amplimed.
3. **Conformidade**: LGPD em tudo; nos módulos clínicos, CFM (Resol. 2.299/2.314) e, para
   assinatura de documentos, ICP-Brasil. Nos convênios, padrão TISS (XML).

## Fases (ordem recomendada — do menor risco ao maior)

### Fase 0 — Fundação (agora)
- Deploy em VPS + HTTPS + backup.
- Trocar senha padrão, `SESSAO_SEGREDO` forte, cookie seguro.
- Primeira carga de pacientes (migração inicial da Amplimed).

### Fase 1 — Agenda real + confirmação automática  (NÃO regulado · alto valor)
- Batimento cardíaco da operação. A tabela `agendamentos` já existe no schema.
- API real de agendamento (criar/mover/cancelar, sem choque de horário, por profissional e sala).
- Confirmação/lembrete por WhatsApp (reduz falta — a Amplimed cita até 38%).
- Liga no que já é real: Contatos, Kanban e Salas de coworking.

### Fase 2 — Financeiro real  (NÃO regulado, exceto NFS-e)
- `lancamentos` já existe no schema. Contas a pagar/receber, fluxo de caixa, inadimplência.
- Módulo de pagamentos (link boleto/cartão) — reduz inadimplência.
- **Repasses / aluguel das salas** — liga direto no módulo de coworking já criado.
- NFS-e (emissão de nota) — via integração com prefeitura/gateway fiscal.

### Fase 3 — Prontuário eletrônico + evolução clínica  (REGULADO — CFM)
- Registro clínico por paciente: histórico, evoluções, anexos/exames, templates por
  especialidade (otorrino e estética). A Anamnese IA atual entra como parte disto.
- Exige cuidado com CFM 2.299/2.314, retenção e auditoria.

### Fase 4 — Prescrição digital + assinatura + Telemedicina  (MUITO regulado)
- Recomendação: **integrar** com provedor certificado (ex.: Memed, ICP-Brasil) em vez de
  construir do zero — assinatura digital e base de medicamentos são serviços regulados.
- Teleconsulta (vídeo) integrada ao prontuário.

### Fase 5 — TISS / convênios  (complexo — só pelos "alguns convênios")
- Geração de guias (consulta, SP/SADT) e XML TISS; acompanhamento de glosas.
- Padrão pesado; avaliar biblioteca/integração. Enquanto isso, os convênios podem seguir
  sendo faturados na Amplimed sem prejuízo ao restante.

### Fase 6 — Inteligência de gestão
- Relatórios/BI, indicadores em tempo real, questionários pré-consulta, pesquisa de satisfação.
- Roda por cima dos dados que já ficaram reais nas fases anteriores.

## Estratégia de corte (cutover)
Por módulo: LOrgani atinge paridade → equipe treinada → dados migrados e conferidos →
desliga aquele módulo na Amplimed. Repete até o último módulo essencial.

## Riscos e contrapontos (honestidade técnica)
- **Regulação**: prontuário/prescrição/TISS carregam responsabilidade legal. Construir errado
  é pior do que não construir. Preferir integração certificada onde a lei exige.
- **Dependência da API da Amplimed**: se ela não expuser API/export, a migração de histórico
  fica manual — isso pode inviabilizar o desligamento e precisa ser checado cedo.
- **Custo de transição**: por um período, roda-se os dois sistemas (Amplimed + LOrgani). É
  esperado e saudável — é o preço de não arriscar a operação.
- **Escopo**: "tudo" é um programa de meses, não uma sprint. O caminho seguro é entregar
  valor a cada fase, com a clínica funcionando o tempo todo.

## Próximo passo recomendado
Construir a **Fase 1 (Agenda real + confirmação)** — é o próximo módulo natural (tabela já
existe), não é regulado, dá retorno imediato (menos faltas) e não depende de terminar o deploy.
O deploy (Fase 0) segue em paralelo assim que você trouxer provedor/SO/IP do VPS.
