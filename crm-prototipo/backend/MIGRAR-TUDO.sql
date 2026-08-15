-- ============================================================
-- L'Organi Flow — MIGRAR TUDO (Salas + Agenda + Financeiro + Notas/Tarefas)
-- Seguro: usa IF NOT EXISTS, não apaga dados e pode ser rodado mais de uma vez.
-- Pré-requisito: o banco lorgani_flow já criado (schema.sql) — tabelas
-- usuarios, contatos, agendamentos e lancamentos já devem existir.
--
-- Como rodar no HeidiSQL:
--   1) clique no banco "lorgani_flow" na árvore à esquerda
--   2) menu Arquivo > Carregar arquivo SQL... > escolha este arquivo
--      (ou abra uma aba de Query e cole todo o conteúdo)
--   3) aperte F9 (ou o botão azul ▶ Executar)
-- ============================================================
USE lorgani_flow;

-- ---------- SALAS DE COWORKING ----------
CREATE TABLE IF NOT EXISTS salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cor VARCHAR(20) DEFAULT '#8A2517',
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS reservas_sala (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sala_id INT NOT NULL,
  profissional VARCHAR(120) NOT NULL,
  medico_usuario_id INT NULL,
  inicio DATETIME NOT NULL,
  fim DATETIME NOT NULL,
  tipo ENUM('avulsa','mensal') NOT NULL DEFAULT 'avulsa',
  valor DECIMAL(10,2) NULL,
  status ENUM('reservado','confirmado','cancelado') NOT NULL DEFAULT 'reservado',
  observacoes VARCHAR(255),
  lancamento_id INT NULL,
  criado_por INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_reservas_inicio ON reservas_sala(inicio);
CREATE INDEX IF NOT EXISTS idx_reservas_sala   ON reservas_sala(sala_id, inicio);

INSERT INTO salas (nome, cor)
SELECT * FROM (SELECT 'Sala 1' AS nome, '#8A2517' AS cor) t
WHERE NOT EXISTS (SELECT 1 FROM salas);
INSERT INTO salas (nome, cor)
SELECT * FROM (SELECT 'Sala 2' AS nome, '#6B8E23' AS cor) t
WHERE (SELECT COUNT(*) FROM salas) < 2;

-- ---------- AGENDA PRÓPRIA ----------
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS fim DATETIME NULL AFTER inicio;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS sala_id INT NULL AFTER especialidade;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS observacoes VARCHAR(255) NULL;
CREATE INDEX IF NOT EXISTS idx_agend_prof ON agendamentos(profissional, inicio);

-- ---------- FINANCEIRO ----------
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS pago_em DATETIME NULL AFTER status;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS origem VARCHAR(40) NULL DEFAULT 'manual';
ALTER TABLE reservas_sala ADD COLUMN IF NOT EXISTS lancamento_id INT NULL;

-- ---------- NOTAS + TAREFAS (ficha do paciente) ----------
CREATE TABLE IF NOT EXISTS notas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  autor_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tarefas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  feita TINYINT(1) NOT NULL DEFAULT 0,
  vencimento DATE NULL,
  autor_id INT NULL,
  feita_em DATETIME NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_notas_contato   ON notas(contato_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_contato ON tarefas(contato_id, feita);

-- ---------- TOUR DE BOAS-VINDAS (primeiro acesso) ----------
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tour_visto TINYINT NOT NULL DEFAULT 0;

-- Pronto! Reinicie o server.js e recarregue o sistema (Ctrl+Shift+R).
