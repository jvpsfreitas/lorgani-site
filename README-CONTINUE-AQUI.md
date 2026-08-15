# LEIA-ME — Continue daqui (handover completo)
### Projetos da Clínica L'Organi · última atualização: 11/07/2026, sessão Claude Fable 5

Este é o documento-mestre para qualquer sessão futura de IA (Opus, Sonnet, etc.) continuar
o trabalho sem perder nada. Ele resume e ATUALIZA os documentos anteriores
(CONTEXTO-DO-PROJETO.md e crm-prototipo/CONTEXTO-PARA-CLAUDE.md).

---

## Quem é o usuário e como trabalhar com ele
- João (jvpsfreitas@gmail.com). Não é programador; tem noções básicas. Comunicação em PT-BR,
  linguagem simples, sem jargão. Ele decide, a IA executa e entrega pronto.
- **CADÊNCIA É SAGRADA**: ele tem limite de uso apertado. Trabalhe em lotes grandes e
  eficientes, uma fase por rodada, sem retrabalho, sem pesquisas desnecessárias.
  Tarefas longas → tarefa agendada (Scheduled) com escopo limitado por execução.
- Ele valoriza: impacto visual (mas design limpo — já rejeitou poluição), entregas que
  funcionam de verdade, e explicações honestas sobre o que é real vs. simulado.

## A clínica (dados confirmados — não inventar além disso)
Clínica L'Organi — Otorrinolaringologia e Medicina Estética.
R. Antônio de Macedo Soares, 1760 — Campo Belo, São Paulo/SP, CEP 04607-003.
Tel (11) 5533-5522 · WhatsApp (11) 95043-5522 · Seg–Sex 7h às 19h.
Médicas: Dra. Rita de Cássia Soler (CRM 66.353) e Dra. Luciane de Paula e Silva de Freitas
(CRM 66.204) — Santa Casa de SP. Equipe: Renata Toledo, Silvia Manzi (fono),
Dra. Luciana Segatto (emagrecimento). Instagram: @lorganiclinicamedica e @lorganiestetica.
Domínio futuro: www.lorgani.com.br. Sistema de agenda atual da clínica: AMPLIMED.
Convênios aceitos: NÃO CONFIRMADO.

---

## PROJETO 1 — Site institucional (PRONTO, aguardando publicação)
**Onde**: esta pasta (lorgani-site). 5 páginas: index, otorrinolaringologia, estetica,
equipe, contato.
**Estado**: completo. Hero cinematográfico com slideshow, tour por scroll (42 frames),
passeio pelos ambientes, galeria com lightbox, FAQ com Schema, JSON-LD MedicalClinic,
sitemap/robots, paleta e logo oficiais (#702018), animações embutidas (JS inline em cada
página — NÃO existe main.js externo em uso; decisão anti-SmartScreen).
**Pendências**: publicar no domínio (substituir o Wix atual quando aprovado); Google
Business e Instagram — passo a passo pronto em docs/Plano-Estrategico-Digital-LOrgani.docx;
apagar _nao-usados/ (21MB) quando o usuário autorizar.
**Versão de apresentação**: arquivo único com imagens embutidas (regenerável — ver
CONTEXTO-DO-PROJETO.md).

## PROJETO 2 — L'Organi Flow (sistema de gestão) — EM PRODUÇÃO ATIVA
**Onde**: crm-prototipo/ (front: index.html · backend: backend/)

### O que já FUNCIONA DE VERDADE (testado pelo usuário em 11/07):
- **Backend Node.js + Express + MariaDB** rodando no PC do usuário.
  Instalação automatizada: backend/INSTALAR.bat (1ª vez) e INICIAR.bat (dia a dia).
  Banco `lorgani_flow` criado; MariaDB local; senha do root fica em backend/config.bat.
- **Login real** (http://localhost:3000): 10 usuários criados pelo seed.js, senha inicial
  Lorgani@2026, papéis admin/medico/recepcao/financeiro com bloqueio na API (RBAC) e
  tabela de auditoria (LGPD).
- **Fase B (front↔back)**: o index.html tem um script de INTEGRAÇÃO no final que só ativa
  quando servido pelo server.js: Kanban e Contatos carregam do banco, "+ Novo contato"
  grava via POST, arrastar card grava a etapa (PATCH), ficha mostra linha do tempo do
  banco, nome/papel do login aparecem no topo, "Ver como" é travado pelo papel real.
  Aberto como arquivo local (file://), o mesmo index.html vira protótipo com dados fake.
- **Acesso dos funcionários**: rede local http://NOME-DO-PC:3000 (+ instalar como app no
  Chrome); externo temporário via backend/ACESSO-EXTERNO.bat (cloudflared).
  Guia: backend/COMO-ACESSAR.md.

### O que ainda é SIMULADO no front (vira real nas próximas fases):
Inbox WhatsApp e agente Lia · Agendamento (grade Amplimed) · Financeiro · Estoque ·
Anamnese IA · Recuperação · Central de Marketing · Copiloto ✦ (comandos por regex local).

### Roadmap acordado:
- **Fase C**: persistir Agendamentos, Financeiro e Estoque (tabelas já existem no schema;
  rota exemplo /api/financeiro/resumo já criada). Incluir troca de senha do usuário.
- **Fase D / Nuvem**: VPS + domínio (ex.: sistema.lorgani.com.br) + HTTPS + backups —
  o usuário sabe que custa ~R$25/mês e topou quando chegar a hora.
- **Fase E / Integrações reais**: WhatsApp Cloud API (Meta Business), API do Amplimed
  (RISCO Nº 1 — validar o que ela permite antes de prometer), IA (agente Lia + copiloto
  com LLM de verdade), marketing (Meta Graph API + Google Business API).
- Especificação completa do produto: crm-prototipo/PRD-LOrgani-Flow.md (v1.1, com anexo
  de melhorias: funil de vendas/pacotes, fidelização, comissionamento, L'Organi
  Intelligence, consentimentos digitais).

### Decisões de design do sistema (respeitar)
- Paleta: bordô vivo #8A2517 com degradê --grad-bordo, fundo creme #F7EFE0, cartões
  brancos, verde-oliva p/ infos, âmbar p/ alertas; fontes Jost + Fraunces (títulos).
- REJEITADO pelo usuário: sidebar/topbar em bordô sólido; excesso de emoji em botões.
  Padrão aprovado: barras brancas, item ativo do menu em bordô degradê, botões-pílula.
- Agente de IA chama-se "Lia"; copiloto é o botão ✦.

---

## ARMADILHAS TÉCNICAS (li-me antes de editar qualquer coisa!)
1. **OneDrive × sandbox**: a cópia que o bash/sandbox enxerga desta pasta fica DEFASADA
   ou truncada no meio. Regra de ouro: HTML/código sempre via ferramentas de arquivo
   (Read/Write/Edit — lado Windows). Bash só para leitura/verificação, conferindo antes
   se o arquivo está completo (termina com </html>?). Se o mount estiver velho, confie
   no Grep/Read do lado Windows.
2. Sempre validar após edições grandes: arquivo termina certo? funções existem?
   (node --check no JS extraído quando possível).
3. Zips para envio: NUNCA incluir .js solto (SmartScreen bloqueia). Preferir arquivo
   único ou os próprios arquivos via cartões.
4. crm-prototipo/index.html: TODO o CSS num <style>, o JS em DOIS <script> no fim
   (principal + integração backend). Funções são top-level (globais).
5. A pasta "lorgani-site - Copia" está obsoleta — não usar.

## Mapa de arquivos-chave
- README-CONTINUE-AQUI.md ← você está aqui (documento-mestre)
- PROXIMOS-PASSOS.md (site) · CONTEXTO-DO-PROJETO.md (histórico site)
- docs/Plano-Estrategico-Digital-LOrgani.docx (marketing/Google/Instagram do site)
- crm-prototipo/index.html (front) · PRD-LOrgani-Flow.md (produto) · PROGRESSO.md
- crm-prototipo/backend/: server.js · schema.sql · seed.js · package.json ·
  INSTALAR.bat · INICIAR.bat · ACESSO-EXTERNO.bat · README-INSTALACAO.md · COMO-ACESSAR.md
  · publico/login.html · config.bat (senha local do MariaDB — não subir para nuvem/git)

## Primeiro passo sugerido para a próxima sessão
Perguntar ao usuário como foi o teste do ciclo completo (criar contato → Kanban →
HeidiSQL) e, se ok, atacar a **Fase C** começando pelo módulo que ele escolher
(sugestão: Estoque — é o mais simples e dá vitória rápida — ou Agendamento, que é o
coração da operação).
