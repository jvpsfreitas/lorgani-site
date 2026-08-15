# L'Organi — Plano para a próxima sessão

> ⚠️ PASTA OFICIAL: `lorgani-site`. A pasta `lorgani-site - Copia` está
> desatualizada (não tem horário/CEP/domínio nem o logo integrado) — não
> editar nela; pode ser apagada.

## ✅ 1. Logo oficial (CONCLUÍDO 09/07)
Logos copiados da pasta Copia para `assets/` (logo.png, logo-branco.png,
logo-estetica.png) e integrados no cabeçalho, rodapé e favicon das 5 páginas.

## 1b. Referências do logo (caso precise em alta resolução)
O site atual (Wix) tem o logo em alta resolução e sem fundo:

- Logo clínica médica (2106x2802): https://static.wixstatic.com/media/6313f8_72b3bd6d042c4090bfe6ca7ccd43ebfd~mv2_d_2106_2802_s_2.png
- Logo estética (2482x3508): https://static.wixstatic.com/media/6313f8_cfe7312ed56d42eda2f6f590df8d6e18~mv2_d_2482_3508_s_4_2.png
- Logo "vazado" (branco, para o rodapé escuro): https://static.wixstatic.com/media/6313f8_d87ac92e610e4b71ac34263bf3d4b88b~mv2.png

Salvar em `assets/` como: `logo.png`, `logo-estetica.png` e `logo-branco.png`.

**Como fazer:** baixar os 2 PNGs pelo navegador e salvar em `assets/` como
`logo.png` e `logo-estetica.png`. Depois, substituir o SVG desenhado à mão
do cabeçalho e rodapé (classe `brand-mark`) nas 5 páginas HTML pelo logo real,
e gerar um favicon a partir dele.

## 2. Informações do site atual (www.lorgani.com.br) para aproveitar
- Texto institucional "Quem Somos" confirma o posicionamento que já usamos.
- Os depoimentos DRCN, EMAC e RM são os mesmos que já estão no nosso site. ✓
- O site atual tem um **blog** e uma página **Spotify** (playlists) — avaliar se
  queremos levar isso para o site novo (blog ajuda muito no SEO local).
- Site de estética visitado (09/07): nosso estetica.html já cobre todos os
  tratamentos listados lá, com descrições mais completas. Sem lacuna de conteúdo.
- Palavras-chave que o site antigo usa (aproveitar em textos/blog): estética
  campo belo, emagrecimento campo belo, luz pulsada campo belo, radiofrequência
  campo belo, carboxiterapia, depilação campo belo, estética moema.
- O site atual tem formulário de contato; o nosso usa só WhatsApp (decidir se
  queremos formulário também).

## 3. Pendências que dependem do cliente
- ✅ Horário: Seg–Sex 7h–19h (aplicado no rodapé, contato e Schema em 09/07).
- ✅ CEP 04607-003 (aplicado no Schema e na página de contato).
- ✅ Domínio: www.lorgani.com.br (canonical/og:url/og:image já configurados no
  index.html — só vale quando o site novo for publicado no domínio).
- Perfil Google Business atualizado (maior alavanca para "otorrino campo belo")
  → passo a passo completo em `docs/Plano-Estrategico-Digital-LOrgani.docx`.
- ✅ Logos baixados e integrados (09/07).

## 4. Melhorias futuras (menor prioridade)
- ✅ FAQ com Schema na página de contato (10/07). Falta: convênios aceitos
  (perguntar à clínica se atendem e quais).
- ✅ Sitemap.xml e robots.txt criados (10/07).
- ✅ Paleta alinhada à cor real do logo #702018 em todo o site (10/07).
- ✅ Plano estratégico em `docs/Plano-Estrategico-Digital-LOrgani.docx` (10/07):
  Google Business passo a passo, 12 posts de Instagram com legendas prontas,
  scripts de pedido/resposta de avaliações, regras CFM, 8 pautas de blog,
  rotina semanal e cronograma de 90 dias.
- Apagar a pasta `_nao-usados/` (21 MB de frames e backups) quando confirmar
  que está tudo certo.
- Blog: criar template de post quando a 1ª pauta for aprovada.
- Gerar novo zip de apresentação (o anterior é de antes da paleta/FAQ).

## Já feito (09/07/2026)
- Reconstruídos index.html, style.css e otorrinolaringologia.html (estavam truncados).
- Lightbox da galeria, estilos das páginas internas, menu mobile da equipe.
- SEO: Schema MedicalClinic, Open Graph e theme-color em todas as páginas.
- WhatsApp com mensagem pré-preenchida por página.
- Fotos otimizadas (11,4 → 8,2 MB) + lazy loading; 21 MB de assets não usados
  movidos para `_nao-usados/`.
