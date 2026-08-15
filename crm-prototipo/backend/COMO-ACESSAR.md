# Como os funcionários acessam o L'Organi Flow

## Na clínica (dia a dia) — link fixo e simples

O sistema roda no computador servidor (o seu). Os outros acessam pelo navegador.

1. No PC servidor, abra o Prompt (cmd) e digite: `hostname`
   → anote o nome (ex.: `PC-RECEPCAO`).
2. Em qualquer computador da clínica, o link é:

   **http://NOME-DO-PC:3000**   (ex.: http://PC-RECEPCAO:3000)

   > Se o nome não funcionar na sua rede, use o IP: rode `ipconfig` no servidor,
   > pegue o "Endereço IPv4" (ex.: 192.168.0.15) e o link fica http://192.168.0.15:3000.
   > Dica: no roteador, dá para "fixar" o IP desse PC para nunca mudar.

3. **Transformar em "aplicativo"** (recomendado — vira ícone com a cara de app):
   No Chrome ou Edge, com o sistema aberto → menu ⋮ → **"Transmitir, salvar e compartilhar"
   → "Instalar página como aplicativo"** (ou "Aplicativos → Instalar este site como app").
   Cria um ícone na área de trabalho que abre o sistema em janela própria, sem parecer navegador.
   Faça isso em cada computador da clínica — leva 10 segundos.

Requisitos: o PC servidor ligado, com a janela do INICIAR.bat aberta, e todos na mesma rede.
Se o Firewall perguntar algo no servidor, clique "Permitir acesso".

## De fora da clínica (casa, celular na rua) — link temporário

Use o **ACESSO-EXTERNO.bat** (nesta pasta):
1. Uma única vez: baixe o `cloudflared.exe` (Windows 64-bit) em
   https://github.com/cloudflare/cloudflared/releases/latest
   e coloque o arquivo nesta pasta backend.
2. Dê dois cliques no ACESSO-EXTERNO.bat → ele gera um link **https://...trycloudflare.com**
   que funciona de qualquer lugar do mundo enquanto a janela estiver aberta.
   ⚠ O link muda a cada execução — serve para acesso pontual, não para rotina.

## Link fixo com domínio próprio (ex.: sistema.lorgani.com.br) — próxima fase

Para um endereço permanente, bonito e seguro (HTTPS), o caminho certo é hospedar o
sistema num servidor na nuvem (VPS — a partir de ~R$ 25/mês) em vez do PC da clínica:
não depende do computador ligado, tem backup e acesso de qualquer lugar.
Quando quiser, me peça: "vamos colocar o sistema na nuvem" — eu preparo tudo e te
guio na contratação (Hostinger, Contabo, DigitalOcean ou similar).
