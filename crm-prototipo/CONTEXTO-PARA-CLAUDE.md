# Contexto do projeto L'Organi Flow — para o Claude que continuar este trabalho

Você está recebendo um projeto em andamento. Leia este arquivo antes de qualquer alteração.

## O que é
Protótipo navegável (HTML/CSS/JS puro, arquivo único `index.html`, sem backend, dados fictícios)
de um sistema de gestão para a Clínica L'Organi — otorrinolaringologia e medicina estética,
Campo Belo, São Paulo. Serve para validar design/fluxos e orçar o desenvolvimento real.
A especificação do produto está no `PRD-LOrgani-Flow.md` (fonte da verdade). O histórico de
construção está no `PROGRESSO.md`.

## O que o protótipo já tem (tudo funcional, simulado em JS)
Dashboard · Inbox WhatsApp (3 colunas, agente "Lia") · CRM Kanban com drag & drop e Central
do Paciente (clicar no card abre ficha com brief de IA e botão de WhatsApp real) · Contatos ·
Recuperação de pacientes (campanhas de reativação) · Central de Marketing (gerador de posts
por IA + fila de publicação) · Agendamento (grade Amplimed simulada) · Anamnese IA (gravação
→ transcrição → anamnese, com revisão médica obrigatória) · Financeiro · Estoque · Agente de
IA (8 painéis de configuração) · Conexões · Copiloto flutuante (botão ✦ — executa comandos:
"resumo do dia", "mover Marina para agendado", "estoque baixo"...) · Perfis de acesso
(seletor "Ver como" no rodapé da sidebar).

## Regras de design (decisões do dono do projeto — respeitar)
- Paleta: bordô vivo do logo (#8A2517, degradê --grad-bordo), fundo creme #F7EFE0, cartões
  brancos, verde-oliva para infos, âmbar para alertas. Fontes: Jost (interface) e Fraunces
  (títulos). Tudo em variáveis CSS no topo do arquivo.
- O usuário REJEITOU: sidebar/topbar em bordô sólido (achou poluído) e excesso de emojis em
  botões. Sidebar e topo ficam brancos; item ativo do menu em bordô degradê.
- Ele gosta de: micro-animações sutis, hover que eleva cards, visual "vivo" mas limpo.
- Integração-alvo real: AMPLIMED (nunca Feegow). Agente chama-se "Lia". Copiloto é "✦".

## Dados reais da clínica (usar; não inventar além disso)
R. Antônio de Macedo Soares, 1760 — Campo Belo, SP, CEP 04607-003 · Tel (11) 5533-5522 ·
WhatsApp (11) 95043-5522 · Seg–Sex 7h às 19h · Dra. Rita de Cássia Soler (CRM 66.353) e
Dra. Luciane de Paula e Silva de Freitas (CRM 66.204), formadas pela Santa Casa · equipe:
Renata Toledo e Silvia Manzi (fono), Dra. Luciana Segatto (emagrecimento) · Instagram
@lorganiclinicamedica e @lorganiestetica · convênios aceitos: NÃO CONFIRMADO (não inventar).

## Cuidados técnicos
- O arquivo tem ~1.700 linhas. TODO o CSS está num único <style> e todo o JS num único
  <script> no fim. Antes de finalizar qualquer edição, confira que o arquivo termina com
  </html> (houve histórico de truncamentos por sincronização de nuvem).
- O logo é referenciado como `../assets/logo.png` (com fallback para um "L" estilizado se
  não existir). Se o logo.png vier junto neste envio, coloque-o na mesma pasta do index.html
  e troque os DOIS caminhos `../assets/logo.png` por `logo.png` (favicon + sidebar).
- Publicação automática de marketing na versão real: Meta Graph API + Google Business API.
- O dono do projeto não é programador: explique mudanças em linguagem simples, entregue
  arquivos prontos e seja econômico com o limite de uso dele (trabalhe em lotes).

## Próximos passos sugeridos (do PRD)
1. Validar a API do Amplimed (risco técnico nº 1 do projeto real).
2. Módulos futuros do protótipo: Teleconsulta e Relatórios/BI (hoje "em breve" na sidebar).
3. Ideias registradas no PRD §9: funil de vendas/pacotes, comissionamento, L'Organi
   Intelligence (copiloto de dados), consentimentos digitais.
