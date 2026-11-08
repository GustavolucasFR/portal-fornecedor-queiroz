import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { db, runMigrations } from './migrations';

const SALT = 'queiroz_salt_2026';

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, SALT, 100000, 32, 'sha256').toString('hex');
}

export function runSeeds(force = false) {
  runMigrations();

  const countEspecies = db.prepare('SELECT COUNT(*) as count FROM especies').get() as { count: number };
  if (countEspecies.count > 0 && !force) {
    return;
  }

  const especiesPath = path.resolve(__dirname, '../../data/consulta2_especies.csv');
  const titulosPath = path.resolve(__dirname, '../../data/consulta1_titulos.csv');

  const especiesContent = fs.readFileSync(especiesPath, 'utf-8').replace(/^\uFEFF/, '');
  const titulosContent = fs.readFileSync(titulosPath, 'utf-8').replace(/^\uFEFF/, '');

  const insertEspecie = db.prepare(`
    INSERT OR REPLACE INTO especies (codespecie, descricao, obrigdireito)
    VALUES (?, ?, ?)
  `);

  const insertFornecedor = db.prepare(`
    INSERT OR IGNORE INTO fornecedores (seqpessoa, nomerazao, senha_hash)
    VALUES (?, ?, ?)
  `);

  const insertTitulo = db.prepare(`
    INSERT OR REPLACE INTO titulos (
      seqtitulo, seqpessoa, codespecie, dtaemissao, dtavencimento, dtavencimento_iso, vlrnominal, vlrpago
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const defaultPasswordHash = hashPassword('queiroz@2026');

  const seedTransaction = db.transaction(() => {
    const especieLines = especiesContent.split(/\r?\n/).slice(1);
    for (const line of especieLines) {
      if (!line.trim()) continue;
      const [codespecie, descricao, obrigdireito] = line.split(';');
      if (codespecie && descricao && obrigdireito) {
        insertEspecie.run(codespecie.trim(), descricao.trim(), obrigdireito.trim());
      }
    }

    const tituloLines = titulosContent.split(/\r?\n/).slice(1);
    for (const line of tituloLines) {
      if (!line.trim()) continue;
      const parts = line.split(';');
      if (parts.length < 8) continue;

      const [seqpessoa, nomerazao, seqtitulo, codespecie, dtaemissao, dtavencimento, vlrnominal, vlrpago] = parts;

      insertFornecedor.run(Number(seqpessoa.trim()), nomerazao.trim(), defaultPasswordHash);

      const [dia, mes, ano] = dtavencimento.trim().split('/');
      const dtavencimentoIso = `${ano}-${mes}-${dia}`;

      const nominal = parseFloat(vlrnominal.trim().replace(',', '.'));
      const pago = parseFloat(vlrpago.trim().replace(',', '.'));

      insertTitulo.run(
        Number(seqtitulo.trim()),
        Number(seqpessoa.trim()),
        codespecie.trim(),
        dtaemissao.trim(),
        dtavencimento.trim(),
        dtavencimentoIso,
        nominal,
        pago
      );
    }
  });

  seedTransaction();
  console.log('✅ Migrations e Seeds executados com sucesso (CSVs importados no SQLite).');
}
