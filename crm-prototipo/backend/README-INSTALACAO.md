# L'Organi Flow — Instalação do backend (Fase A) · Windows

Você vai precisar de ~20 minutos. Só se faz uma vez.

## 1. Instalar o Node.js
1. Baixe em **nodejs.org** → botão verde "LTS" → instale (Avançar, Avançar...).
2. Para conferir: abra o **Prompt de Comando** (tecla Windows → digite `cmd`) e rode:
   `node -v`  → deve mostrar algo como v22.x.

## 2. Criar o banco no MariaDB
1. Abra o Prompt de Comando **na pasta backend** (abra a pasta no Explorer, clique na
   barra de endereço, digite `cmd` e Enter).
2. Rode (vai pedir a senha do root que você definiu ao instalar o MariaDB):

   mysql -u root -p < schema.sql

   > Se aparecer "mysql não é reconhecido": use o programa "MySQL Client (MariaDB)"
   > do menu Iniciar e, dentro dele, rode:  source C:\caminho\ate\schema.sql

## 3. Configurar a senha do banco para o sistema
No mesmo Prompt (pasta backend), rode — trocando SUASENHA pela senha do root do MariaDB:

   set DB_SENHA=SUASENHA

(Isso vale para a janela atual. Depois posso te ajudar a fixar isso num arquivo.)

## 4. Instalar as dependências e criar os usuários
Ainda na pasta backend:

   npm install
   node seed.js

O seed cria os **10 logins** (admin, 5 da equipe clínica, 3 recepção, 1 financeiro) com a
senha inicial **Lorgani@2026** — cada pessoa deve trocá-la depois (Fase B terá a tela).

## 5. Ligar o sistema

   node server.js

Abra **http://localhost:3000** no navegador → tela de login → entre com
`admin@lorgani.com.br` / `Lorgani@2026`.

## 6. Acesso das outras pessoas (rede da clínica)
No PC servidor, rode `ipconfig` e anote o "Endereço IPv4" (ex.: 192.168.0.15).
Nos outros computadores da clínica, acesse: **http://192.168.0.15:3000**.
> O PC servidor precisa estar ligado e na mesma rede Wi-Fi/cabo. Se o Firewall do
> Windows perguntar, clique em "Permitir acesso".

## O que já é REAL nesta fase
- Login com senha criptografada (bcrypt) e sessão de 10 horas
- Papéis de acesso: admin · médico · recepção · financeiro (a API já bloqueia, ex.:
  recepção não acessa /api/financeiro)
- Log de auditoria de todas as ações (LGPD)
- API de Contatos/Kanban gravando no MariaDB (o front passa a usar na Fase B)

## O que ainda é simulado
O visual do sistema (após o login) ainda mostra os dados de demonstração do protótipo.
A Fase B conecta módulo a módulo ao banco: Kanban/Contatos → Agenda → Financeiro/Estoque.

## Problemas comuns
- "ECONNREFUSED" ao rodar seed/server → o MariaDB não está ligado (Serviços do Windows → MariaDB → Iniciar).
- "Access denied for user root" → a senha do passo 3 está errada.
- Página não abre nos outros PCs → firewall ou redes diferentes.

⚠️ Importante: este servidor é para a REDE INTERNA da clínica. Para acessar de fora
(celular na rua, casa), o caminho certo é um servidor na nuvem (VPS) — fazemos isso
numa fase futura, com HTTPS e backups. Não exponha esta porta na internet.
