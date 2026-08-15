-- ============================================================
-- L'Organi Flow — Migração 01: Salas de coworking médico
-- Rodar UMA vez no banco JÁ EXISTENTE (não apaga nada).
-- No HeidiSQL: abra o banco lorgani_flow, cole este script e execute (F9).
-- Ou no terminal:  mysql -u root -p lorgani_flow < migracao-01-salas.sql
-- ============================================================
USE lorgani_flow;

-- As 2 salas alugadas para os médicos atenderem.
CREATE TABLE IF NOT EXISTS salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cor VARCHAR(20) DEFAULT '#8A2517',     -- cor no calendário
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

-- Agenda de ocupação: quem reservou qual sala e quando.
CREATE TABLE IF NOT EXISTS reservas_sala (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sala_id INT NOT NULL,
  profissional VARCHAR(120) NOT NULL,          -- médico locatário (nome)
  medico_usuario_id INT NULL,                  -- opcional: se for da equipe (FK usuarios)
  inicio DATETIME NOT NULL,
  fim DATETIME NOT NULL,
  tipo ENUM('avulsa','mensal') NOT NULL DEFAULT 'avulsa',  -- avulsa = turno/horário; mensal = contrato fixo
  valor DECIMAL(10,2) NULL,                     -- valor do aluguel (para o financeiro, futuro)
  status ENUM('reservado','confirmado','cancelado') NOT NULL DEFAULT 'reservado',
  observacoes VARCHAR(255),
  criado_por INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sala_id) REFERENCES salas(id) ON DELETE CASCADE
);

CREATE INDEX idx_reservas_inicio ON reservas_sala(inicio);
CREATE INDEX idx_reservas_sala   ON reservas_sala(sala_id, inicio);

-- Cria as 2 salas só se ainda não existir nenhuma.
INSERT INTO salas (nome, cor)
SELECT * FROM (SELECT 'Sala 1' AS nome, '#8A2517' AS cor) t
WHERE NOT EXISTS (SELECT 1 FROM salas);
INSERT INTO salas (nome, cor)
SELECT * FROM (SELECT 'Sala 2' AS nome, '#6B8E23' AS cor) t
WHERE (SELECT COUNT(*) FROM salas) < 2;
