import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
export const db = new Database(dbPath);

// Habilita integridade referencial no SQLite
db.pragma('foreign_keys = ON');

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS fornecedores (
      seqpessoa INTEGER PRIMARY KEY,
      nomerazao TEXT NOT NULL,
      senha_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS especies (
      codespecie TEXT PRIMARY KEY,
      descricao TEXT NOT NULL,
      obrigdireito TEXT CHECK(obrigdireito IN ('O', 'D')) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS titulos (
      seqtitulo INTEGER PRIMARY KEY,
      seqpessoa INTEGER NOT NULL,
      codespecie TEXT NOT NULL,
      dtaemissao TEXT NOT NULL,
      dtavencimento TEXT NOT NULL,
      dtavencimento_iso TEXT NOT NULL,
      vlrnominal REAL NOT NULL,
      vlrpago REAL NOT NULL,
      FOREIGN KEY (seqpessoa) REFERENCES fornecedores (seqpessoa),
      FOREIGN KEY (codespecie) REFERENCES especies (codespecie)
    );
  `);
}
