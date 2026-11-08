import { Response } from 'express';
import { db } from '../database/migrations';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export function listarTitulosFornecedor(req: AuthenticatedRequest, res: Response) {
  const seqpessoa = req.user?.seqpessoa;
  if (!seqpessoa) {
    return res.status(401).json({ error: 'Fornecedor não autenticado.' });
  }

  // Data de referência: permite simular via query param (?dataRef=2026-11-07) ou usa a data atual do sistema
  const hojeIso =
    typeof req.query.dataRef === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.dataRef)
      ? req.query.dataRef
      : new Date().toISOString().slice(0, 10);

  // Consulta SQL relacionando as tabelas titulos e especies
  const sql = `
    SELECT 
      t.seqtitulo,
      t.seqpessoa,
      t.codespecie,
      e.descricao AS descricao_especie,
      e.obrigdireito,
      t.dtaemissao,
      t.dtavencimento,
      t.dtavencimento_iso,
      t.vlrnominal,
      t.vlrpago,
      ROUND(t.vlrnominal - t.vlrpago, 2) AS valor_aberto,
      CASE 
        WHEN t.dtavencimento_iso < ? THEN 'VENCIDO'
        ELSE 'A_VENCER'
      END AS status_vencimento
    FROM titulos t
    INNER JOIN especies e ON t.codespecie = e.codespecie
    WHERE t.seqpessoa = ?
      AND ROUND(t.vlrnominal - t.vlrpago, 2) > 0
    ORDER BY t.dtavencimento_iso ASC, t.seqtitulo ASC
  `;

  const rows = db.prepare(sql).all(hojeIso, seqpessoa) as Array<{
    seqtitulo: number;
    seqpessoa: number;
    codespecie: string;
    descricao_especie: string;
    obrigdireito: 'D' | 'O';
    dtaemissao: string;
    dtavencimento: string;
    dtavencimento_iso: string;
    vlrnominal: number;
    vlrpago: number;
    valor_aberto: number;
    status_vencimento: 'VENCIDO' | 'A_VENCER';
  }>;

  // Títulos 'D' = Direito do Queiroz (o fornecedor DEVE ao Queiroz)
  const titulosDevidosAoQueiroz = rows.filter((r) => r.obrigdireito === 'D');
  const totalDevidoAoQueiroz = Number(
    titulosDevidosAoQueiroz.reduce((acc, cur) => acc + cur.valor_aberto, 0).toFixed(2)
  );
  const totalDevidoVencido = Number(
    titulosDevidosAoQueiroz
      .filter((r) => r.status_vencimento === 'VENCIDO')
      .reduce((acc, cur) => acc + cur.valor_aberto, 0)
      .toFixed(2)
  );
  const totalDevidoAVencer = Number(
    titulosDevidosAoQueiroz
      .filter((r) => r.status_vencimento === 'A_VENCER')
      .reduce((acc, cur) => acc + cur.valor_aberto, 0)
      .toFixed(2)
  );

  // Títulos 'O' = Obrigação do Queiroz (o Queiroz deve ao fornecedor)
  const titulosObrigacaoQueiroz = rows.filter((r) => r.obrigdireito === 'O');
  const totalObrigacaoQueiroz = Number(
    titulosObrigacaoQueiroz.reduce((acc, cur) => acc + cur.valor_aberto, 0).toFixed(2)
  );

  return res.json({
    fornecedor: {
      seqpessoa,
      nomerazao: req.user?.nomerazao,
    },
    dataReferencia: hojeIso,
    resumo: {
      totalDevidoAoQueiroz,
      totalDevidoVencido,
      totalDevidoAVencer,
      qtdTitulosDevidos: titulosDevidosAoQueiroz.length,
       qtdVencidosDevidos: titulosDevidosAoQueiroz.filter((r) => r.status_vencimento === 'VENCIDO').length,
      qtdAVencerDevidos: titulosDevidosAoQueiroz.filter((r) => r.status_vencimento === 'A_VENCER').length,
      totalObrigacaoQueiroz,
      qtdTitulosObrigacao: titulosObrigacaoQueiroz.length,
    },
    titulos: rows,
  });
}
