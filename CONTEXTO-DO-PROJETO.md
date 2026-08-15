# Contexto do projeto — leia antes de continuar (para futuras sessões de IA)

Última atualização: 10/07/2026, sessão Claude (Fable). O usuário (João) não é programador;
comunica-se em português; preza por economia de limite de uso (cadência: poucas ações
grandes por sessão, usar tarefas agendadas para trabalho longo).

## Os dois projetos nesta pasta

### 1. Site da Clínica L'Organi (esta pasta, PRONTO — aguardando publicação)
Site estático de 5 páginas (index, otorrinolaringologia, estetica, equipe, contato) para a
clínica de otorrino + medicina estética no Campo Belo, SP. Estado: completo e polido.
- Identidade: bordô #702018 (do logo), creme #F8F2EA, fontes Fraunces + Jost.
- Recursos: hero cinematográfico com slideshow Ken Burns, tour por scroll (42 frames em
  assets/tour/entrada_*), passeio horizontal pelos ambientes, galeria com lightbox, FAQ com
  Schema, JSON-LD MedicalClinic, sitemap.xml/robots.txt, WhatsApp com texto pré-preenchido.
- Pendências: publicar no domínio www.lorgani.com.br (substitui site Wix atual quando
  aprovado); Google Business (passo a passo no docs/Plano-Estrategico-Digital-LOrgani.docx);
  ver PROXIMOS-PASSOS.md.
- `LOrgani-Site-Apresentacao.html` (gerado em outputs da sessão): versão de UM ARQUIVO SÓ
  do site (imagens em base64) para enviar por WhatsApp — regenerável via script python
  (juntar páginas, remover page-heros internos, embutir assets com dicionário JS de imagens).

### 2. L'Organi Flow — sistema de gestão da clínica (crm-prototipo/, EM ANDAMENTO)
CRM conversacional + gestão completa. Documentos:
- `crm-prototipo/PRD-LOrgani-Flow.md` — PRD v1.1 (fonte da verdade do produto), com anexo
  de gaps: funil de vendas/pacotes, fidelização, prontuário completo, comissionamento,
  módulo central de IA "L'Organi Intelligence" (copiloto de dados, previsões, briefs).
- `crm-prototipo/PROGRESSO.md` — controle das 6 etapas do protótipo (criado pela 1ª execução).
- `crm-prototipo/index.html` — protótipo navegável (construído pela tarefa agendada).
- TAREFA AGENDADA "crm-lorgani-prototipo": roda às 7h/12h/17h, UMA etapa por execução,
  prazo 12/07 17h. Depois de concluída, desativar. O prompt completo dela está em
  C:\Users\jvpsf\Claude\Scheduled\crm-lorgani-prototipo\SKILL.md.
- Integração-alvo de agenda: AMPLIMED (a clínica usa Amplimed; validar API é o risco nº 1).
- Agente de IA do sistema chama-se "Lia". Design system: réplica das telas de referência
  ClinicaFlow (sidebar, cards, badges) com as cores da L'Organi.

## Dados da clínica (verificados com o usuário)
- Endereço: R. Antônio de Macedo Soares, 1760 — Campo Belo, São Paulo/SP, CEP 04607-003.
- Tel (11) 5533-5522 · WhatsApp (11) 95043-5522 · Seg–Sex 7h às 19h.
- Médicas: Dra. Rita de Cássia Soler (CRM 66.353) e Dra. Luciane de Paula e Silva de
  Freitas (CRM 66.204), formadas pela Santa Casa de SP. Equipe: Renata Toledo e Silvia
  Manzi (fono), Dra. Luciana Larrubia Segatto (emagrecimento, CRM 246.572).
- Instagram: @lorganiclinicamedica e @lorganiestetica. Domínio futuro: www.lorgani.com.br.
- NÃO CONFIRMADO (não inventar): convênios aceitos.

## Armadilhas técnicas aprendidas (IMPORTANTE)
1. **OneDrive × sandbox**: a cópia que o bash (/sessions/.../mnt/) enxerga desta pasta fica
   DEFASADA em relação ao Windows. Sintoma clássico: arquivo "truncado" no meio. Regra:
   escrever/editar HTML sempre pelas ferramentas de arquivo (Read/Write/Edit, lado Windows);
   antes de processar arquivos via bash/python, verificar se terminam com </html>; se
   truncado no mount, ler pelo lado Windows e emendar.
2. **Histórico de truncamento em ~16KB**: os arquivos originais do site vieram cortados em
   16K (sessão anterior). Sempre validar fim de arquivo após operações grandes.
3. **JS embutido**: o site NÃO usa js/main.js externo — o script está EMBUTIDO em cada uma
   das 5 páginas (decisão para evitar bloqueio do Windows SmartScreen em zips enviados).
   js/main.js existe só como referência. Ao alterar o JS, replicar nas 5 páginas.
4. **Zips para envio**: nunca incluir arquivos .js no zip (SmartScreen bloqueia). Preferir
   o arquivo único de apresentação, ou hospedar (Netlify Drop) — melhor caminho futuro.
5. **Pasta "lorgani-site - Copia"**: desatualizada, não usar (só serviu para trazer logos).
6. **Imagens**: galeria já otimizada (1400px, q80); originais em _nao-usados/gallery-originais.
   _nao-usados/ (21MB) pode ser apagada quando o usuário confirmar.

## Estilo de trabalho com este usuário
- Explicar em linguagem simples, sem jargão; ele decide, a IA executa.
- Economizar limite: agrupar ações, evitar retrabalho, usar tarefas agendadas para o pesado.
- Sempre entregar arquivos via cartões (present_files) e dar caminho fácil no Windows.
- Ele valoriza impacto visual — mas rejeitou poluição de fotos: foto só se estiver
  "trabalhando" (animação, tour); design enxuto.
