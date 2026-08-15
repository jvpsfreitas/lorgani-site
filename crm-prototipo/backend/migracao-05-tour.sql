-- ============================================================
-- L'Organi Flow — Migração 05: marcador do tour de boas-vindas
-- Cada usuário vê o tour guiado só no primeiro acesso.
-- HeidiSQL: selecione lorgani_flow, cole e execute (F9).
-- ============================================================
USE lorgani_flow;

-- 0 = ainda não viu o tour (mostra no próximo login); 1 = já viu.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tour_visto TINYINT NOT NULL DEFAULT 0;
