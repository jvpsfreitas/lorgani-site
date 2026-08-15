-- ============================================================
-- L'Organi Flow — Banco de dados (MariaDB)  ·  Fase A
-- Criar com:  mysql -u root -p < schema.sql
-- ============================================================
CREATE DATABASE IF NOT EXISTS lorgani_flow
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lorgani_flow;

-- ---------- usuários e acesso ----------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL,
  papel ENUM('admin','medico','recepcao','financeiro') NOT NULL DEFAULT 'recepcao',
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  tour_visto TINYINT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- CRM ----------
CREATE TABLE contatos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(140) NOT NULL,
  whatsapp VARCHAR(20),
  email VARCHAR(160),
  cpf VARCHAR(14),
  nascimento DATE NULL,
  convenio VARCHAR(80) DEFAULT 'Particular',
  amplimed_id VARCHAR(30) NULL,
  etapa ENUM('novo','conversa','qualificado','agendado','atendido','recorrente') NOT NULL DEFAULT 'novo',
  origem VARCHAR(40) DEFAULT 'whatsapp',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE eventos_contato (          -- linha do tempo do paciente
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NOT NULL,
  titulo VARCHAR(160) NOT NULL,
  detalhe VARCHAR(255),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE CASCADE
);

CREATE TABLE notas (                    -- notas livres na ficha do paciente
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NOT NULL,
  texto VARCHAR(1000) NOT NULL,
  autor_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE CASCADE
);

CREATE TABLE tarefas (                  -- tarefas/to-dos ligadas ao paciente
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

-- ---------- agendamento (Fase C usa; já nasce pronta) ----------
CREATE TABLE agendamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NOT NULL,
  profissional VARCHAR(120) NOT NULL,
  especialidade VARCHAR(80) NOT NULL,
  sala_id INT NULL,
  inicio DATETIME NOT NULL,
  fim DATETIME NULL,
  status ENUM('agendado','confirmado','atendido','faltou','cancelado') DEFAULT 'agendado',
  observacoes VARCHAR(255),
  criado_por INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE CASCADE
);

-- ---------- financeiro (Fase C) ----------
CREATE TABLE lancamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contato_id INT NULL,
  descricao VARCHAR(200) NOT NULL,
  tipo ENUM('receita','despesa') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  forma VARCHAR(40) DEFAULT 'pix',
  status ENUM('pendente','pago','atrasado','a_faturar') DEFAULT 'pendente',
  pago_em DATETIME NULL,
  origem VARCHAR(40) NULL DEFAULT 'manual',
  vencimento DATE NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contato_id) REFERENCES contatos(id) ON DELETE SET NULL
);

-- ---------- estoque (Fase C) ----------
CREATE TABLE insumos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(140) NOT NULL,
  lote VARCHAR(40),
  validade DATE NULL,
  quantidade INT NOT NULL DEFAULT 0,
  minimo INT NOT NULL DEFAULT 0,
  custo_unit DECIMAL(10,2) NULL
);

CREATE TABLE movimentos_estoque (
  id INT AUTO_INCREMENT PRIMARY KEY,
  insumo_id INT NOT NULL,
  delta INT NOT NULL,                    -- +entrada / -saída
  motivo VARCHAR(160),
  usuario_id INT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE
);

-- ---------- auditoria (LGPD / segurança) ----------
CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NULL,
  acao VARCHAR(60) NOT NULL,
  alvo VARCHAR(120),
  detalhe TEXT,
  ip VARCHAR(45),
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- salas de coworking médico (aluguel das 2 salas) ----------
CREATE TABLE salas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  cor VARCHAR(20) DEFAULT '#8A2517',
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

CREATE TABLE reservas_sala (             -- agenda de ocupação das salas
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

CREATE INDEX idx_contatos_etapa ON contatos(etapa);
CREATE INDEX idx_agend_inicio ON agendamentos(inicio);
CREATE INDEX idx_lanc_status ON lancamentos(status);
CREATE INDEX idx_reservas_inicio ON reservas_sala(inicio);
CREATE INDEX idx_reservas_sala ON reservas_sala(sala_id, inicio);
