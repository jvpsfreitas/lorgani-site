# verification-standard.md — Site Institucional L'Organi
# O que "correto" significa para este site. Determinístico, re-executável.
# SOMENTE-LEITURA enquanto uma saída está sendo corrigida.

## Critérios de aceite (passa/falha, nunca notas)
1. **Integridade dos arquivos** — as 5 páginas existem e cada uma TERMINA com `</html>`
   (nada truncado pelo OneDrive): index, otorrinolaringologia, estetica, equipe, contato.
2. **Abre sem erro** — servindo a pasta, cada página responde HTTP 200 e NÃO gera nenhum
   erro no console do navegador (F12) ao carregar.
3. **Sem JS externo** — nenhuma página referencia um `main.js` externo; todo o JS é inline
   (decisão anti-SmartScreen). `grep -ri "main.js"` nas 5 páginas não retorna nada em uso.
4. **Assets resolvem** — nenhuma imagem/CSS referenciado retorna 404.
5. **Dados da clínica corretos** onde aparecem: endereço "R. Antônio de Macedo Soares, 1760,
   Campo Belo, São Paulo/SP, 04607-003"; tel (11) 5533-5522; WhatsApp (11) 95043-5522;
   horário Seg–Sex 7h às 19h.
6. **Médicas corretas**: Dra. Rita de Cássia Soler (CRM 66.353) e Dra. Luciane de Paula e
   Silva de Freitas (CRM 66.204). Nenhum nome/CRM inventado além dos confirmados.
7. **SEO técnico** — index tem JSON-LD `MedicalClinic` válido; `sitemap.xml` e `robots.txt`
   existem na raiz e são válidos.
8. **Identidade** — cor oficial #702018 e logo oficiais presentes; sem poluição visual.
9. **Navegação** — todos os links internos entre as 5 páginas resolvem (nenhum quebrado).

## Como rodar o check
- Servir: `python -m http.server 8000` na pasta do site.
- Abrir cada uma das 5 páginas em `http://localhost:8000/<pagina>.html`, abrir o console (F12)
  e confirmar: zero erros, e os elementos-chave carregam (hero/slideshow, tour por scroll,
  galeria com lightbox, FAQ).
- Terminal: para cada página, confirmar que termina em `</html>` e que `grep -i "main.js"`
  não acha referência em uso. Validar o JSON-LD (colar no Rich Results Test do Google).
- Onde possível, um segundo revisor de CONTEXTO LIMPO (subagente `verificador`) roda tudo.

## Baseline
- Última versão aprovada do site. Sinalizar QUALQUER regressão visual no hero, no tour
  (42 frames), na galeria/lightbox ou no FAQ, e qualquer dado da clínica que tenha mudado.

## Saída de um check run
- PASS/FAIL por critério, cada um com a evidência.
- Em FAIL: anexar a evidência + descrição do defeito aos aprendizados e disparar o
  agente-regenerativo para a correção (menor, reversível).
