-- ============================================================
-- L'Organi Flow — Migração 03: Financeiro (Fase 2)
-- Acrescenta colunas às tabelas existentes. Não apaga nada.
-- HeidiSQL: abra lorgani_flow, cole e execute (F9).
--   ou:  mysql -u root -p lorgani_flow < migracao-03-financeiro.sql
-- ============================================================
USE lorgani_flow;

-- data de pagamento e origem do lançamento (manual, aluguel_sala, agendamento...)
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS pago_em DATETIME NULL AFTER status;
ALTER TABLE lancamentos ADD COLUMN IF NOT EXISTS origem VARCHAR(40) NULL DEFAULT 'manual';

-- liga a reserva de sala ao lançamento de aluguel gerado (evita cobrar duas vezes)
ALTER TABLE reservas_sala ADD COLUMN IF NOT EXISTS lancamento_id INT NULL;
