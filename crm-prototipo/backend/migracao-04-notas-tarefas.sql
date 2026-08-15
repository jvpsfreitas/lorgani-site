-- ============================================================
-- L'Organi Flow — Migração 04: Notas e Tarefas na ficha do paciente
-- (ideia estilo Twenty: registro rico do paciente). Não apaga nada.
-- HeidiSQL: abra lorgani_flow, cole e execute (F9).
--   ou:  mysql -u root -p lorgani_flow < migracao-04-notas-tarefas.sql
-- ============================================================
USE lorgani_flow;

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

CREATE INDEX IF NOT EXISTS idx_notas_contato ON notas(contato_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_contato ON tarefas(contato_id, feita);
