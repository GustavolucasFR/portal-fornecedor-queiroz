import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database/migrations';
import { hashPassword } from '../database/seed';

const JWT_SECRET = process.env.JWT_SECRET || 'queiroz_super_secret_jwt_key_2026';

export function login(req: Request, res: Response) {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ error: 'Informe o código do fornecedor (usuário) e a senha.' });
  }

  const seqpessoa = Number(String(usuario).trim());
  if (isNaN(seqpessoa)) {
    return res.status(400).json({ error: 'O usuário deve ser o código numérico do fornecedor (ex: 4827).' });
  }

  const fornecedor = db
    .prepare('SELECT seqpessoa, nomerazao, senha_hash FROM fornecedores WHERE seqpessoa = ?')
    .get(seqpessoa) as { seqpessoa: number; nomerazao: string; senha_hash: string } | undefined;

  if (!fornecedor) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const senhaHashTentativa = hashPassword(String(senha));
  if (senhaHashTentativa !== fornecedor.senha_hash) {
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { seqpessoa: fornecedor.seqpessoa, nomerazao: fornecedor.nomerazao },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    fornecedor: {
      seqpessoa: fornecedor.seqpessoa,
      nomerazao: fornecedor.nomerazao,
    },
  });
}
