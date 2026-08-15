-- ============================================================
-- L'Organi Flow — Migração 02: Agenda própria (Fase 1)
-- Acrescenta colunas à tabela agendamentos que já existe.
-- Não apaga nada. Rodar UMA vez no banco existente:
--   HeidiSQL: abra lorgani_flow, cole e execute (F9).
--   ou:  mysql -u root -p lorgani_flow < migracao-02-agenda.sql
-- (MariaDB suporta ADD COLUMN IF NOT EXISTS.)
-- ============================================================
USE lorgani_flow;

ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS fim DATETIME NULL AFTER inicio;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS sala_id INT NULL AFTER especialidade;
ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS observacoes VARCHAR(255) NULL;

CREATE INDEX IF NOT EXISTS idx_agend_prof ON agendamentos(profissional, inicio);
