'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LogOut,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Search,
  Building2,
  Receipt,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatCurrencyBRL } from '@/utils/formatters';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Titulo {
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
}

interface ApiResponse {
  fornecedor: {
    seqpessoa: number;
    nomerazao: string;
  };
  dataReferencia: string;
  resumo: {
    totalDevidoAoQueiroz: number;
    totalDevidoVencido: number;
    totalDevidoAVencer: number;
    qtdTitulosDevidos: number;
    qtdVencidosDevidos: number;
    qtdAVencerDevidos: number;
    totalObrigacaoQueiroz: number;
    qtdTitulosObrigacao: number;
  };
  titulos: Titulo[];
}

export default function PendenciasPage() {
  const [dados, setDados] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [abaNatureza, setAbaNatureza] = useState<'D' | 'O' | 'TODOS'>('D');
  const [filtroStatus, setFiltroStatus] = useState<'TODOS' | 'VENCIDO' | 'A_VENCER'>('TODOS');
  const [busca, setBusca] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('queiroz_token');
    if (!token) {
      router.replace('/login');
      return;
    }

    fetch(`${API_URL}/titulos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Sessão expirada');
        return res.json();
      })
      .then((json: ApiResponse) => {
        setDados(json);
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('queiroz_token');
        localStorage.removeItem('queiroz_fornecedor');
        router.replace('/login');
      });
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('queiroz_token');
    localStorage.removeItem('queiroz_fornecedor');
    router.replace('/login');
  }

  if (loading || !dados) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-600 font-medium">Carregando suas pendências financeiras...</p>
        </div>
      </div>
    );
  }

  const titulosFiltrados = dados.titulos.filter((t) => {
    const matchNatureza = abaNatureza === 'TODOS' ? true : t.obrigdireito === abaNatureza;
    const matchStatus = filtroStatus === 'TODOS' ? true : t.status_vencimento === filtroStatus;
    const termo = busca.trim().toLowerCase();
    const matchBusca =
      !termo ||
      String(t.seqtitulo).includes(termo) ||
      t.descricao_especie.toLowerCase().includes(termo) ||
      t.codespecie.toLowerCase().includes(termo);

    return matchNatureza && matchStatus && matchBusca;
  });

  const totalExibido = titulosFiltrados.reduce((acc, cur) => acc + cur.valor_aberto, 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header Responsivo */}
      <header className="bg-blue-950 text-white shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-900 rounded-lg border border-blue-800">
              <Building2 className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight">Portal do Fornecedor</h1>
                <span className="text-xs bg-blue-800 text-blue-100 px-2 py-0.5 rounded font-mono">
                  Cód. {dados.fornecedor.seqpessoa}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-200 font-medium truncate max-w-xs sm:max-w-md">
                {dados.fornecedor.nomerazao}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-blue-900 sm:border-0 pt-2 sm:pt-0">
            <span className="text-xs text-blue-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Ref: {dados.dataReferencia.split('-').reverse().join('/')}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Sair do Portal
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 flex-1">
        {/* Cards Principais - Destaque claro para o que o Fornecedor DEVE ao Queiroz */}
        <section aria-label="Resumo financeiro">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              Resumo de Pendências junto ao Grupo Queiroz
            </h2>
            <p className="text-xs text-slate-500">
              Valores atualizados referentes aos débitos do fornecedor (devoluções, avarias e verbas comerciais)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Total em Aberto com o Grupo Queiroz */}
            <div className="bg-white rounded-2xl p-5 border-2 border-blue-600 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  Total em Aberto (Você deve ao Queiroz)
                </span>
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                {formatCurrencyBRL(dados.resumo.totalDevidoAoQueiroz)}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {dados.resumo.qtdTitulosDevidos} títulos pendentes de liquidação (Espécies tipo D)
              </p>
            </div>

            {/* Card 2: Total Vencido */}
            <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-red-700">
                  Títulos Vencidos
                </span>
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-2">
                {formatCurrencyBRL(dados.resumo.totalDevidoVencido)}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {dados.resumo.qtdVencidosDevidos} títulos com vencimento anterior a hoje
              </p>
            </div>

            {/* Card 3: Total a Vencer */}
            <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  Títulos a Vencer
                </span>
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2">
                {formatCurrencyBRL(dados.resumo.totalDevidoAVencer)}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                {dados.resumo.qtdAVencerDevidos} títulos dentro do prazo de vencimento
              </p>
            </div>
          </div>
        </section>

        {/* Controles de Filtro e Busca */}
        <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Abas de Natureza */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setAbaNatureza('D')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  abaNatureza === 'D'
                    ? 'bg-blue-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                O que devo ao Queiroz ({dados.resumo.qtdTitulosDevidos})
              </button>
              <button
                onClick={() => setAbaNatureza('O')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  abaNatureza === 'O'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Valores a Receber / Duplicatas ({dados.resumo.qtdTitulosObrigacao})
              </button>
              <button
                onClick={() => setAbaNatureza('TODOS')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
                  abaNatureza === 'TODOS'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Todos os Títulos ({dados.titulos.length})
              </button>
            </div>

            {/* Filtro de Status + Busca */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <Filter className="w-4 h-4 text-slate-500 ml-2" />
                {(['TODOS', 'VENCIDO', 'A_VENCER'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFiltroStatus(status)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      filtroStatus === status
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'TODOS' ? 'Todos' : status === 'VENCIDO' ? 'Vencidos' : 'A Vencer'}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar nº título ou espécie..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:border-blue-600 outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Lista de Títulos: Visão Mobile (Cards) + Visão Desktop (Tabela) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                Relação de Títulos em Aberto ({titulosFiltrados.length})
              </h3>
            </div>
            <div className="text-xs sm:text-sm font-semibold text-slate-700">
              Subtotal listado:{' '}
              <span className="text-slate-900 font-extrabold">{formatCurrencyBRL(totalExibido)}</span>
            </div>
          </div>

          {titulosFiltrados.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              Nenhum título encontrado para os filtros selecionados.
            </div>
          ) : (
            <>
              {/* Tabela Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-6">Nº do Título</th>
                      <th className="py-3.5 px-6">Descrição da Espécie</th>
                      <th className="py-3.5 px-6">Emissão</th>
                      <th className="py-3.5 px-6">Vencimento</th>
                      <th className="py-3.5 px-6 text-right">Valor Original</th>
                      <th className="py-3.5 px-6 text-right">Valor Pago</th>
                      <th className="py-3.5 px-6 text-right">Valor em Aberto</th>
                      <th className="py-3.5 px-6 text-center">Situação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {titulosFiltrados.map((t) => (
                      <tr key={t.seqtitulo} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-6 font-mono font-semibold text-slate-900">
                          #{t.seqtitulo}
                        </td>
                        <td className="py-3.5 px-6">
                          <div className="font-medium text-slate-800">{t.descricao_especie}</div>
                          <span className="text-xs text-slate-400 font-mono">
                            Cód: {t.codespecie} •{' '}
                            {t.obrigdireito === 'D' ? 'Débito do Fornecedor' : 'Crédito do Fornecedor'}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-600">{t.dtaemissao}</td>
                        <td className="py-3.5 px-6 font-medium text-slate-800">{t.dtavencimento}</td>
                        <td className="py-3.5 px-6 text-right text-slate-500">
                          {formatCurrencyBRL(t.vlrnominal)}
                        </td>
                        <td className="py-3.5 px-6 text-right text-slate-500">
                          {formatCurrencyBRL(t.vlrpago)}
                        </td>
                        <td className="py-3.5 px-6 text-right font-bold text-slate-900">
                          {formatCurrencyBRL(t.valor_aberto)}
                        </td>
                        <td className="py-3.5 px-6 text-center">
                          {t.status_vencimento === 'VENCIDO' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Vencido
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              A Vencer
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards Mobile (Responsividade total) */}
              <div className="md:hidden divide-y divide-slate-100">
                {titulosFiltrados.map((t) => (
                  <div key={t.seqtitulo} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        Título #{t.seqtitulo}
                      </span>
                      {t.status_vencimento === 'VENCIDO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
                          Vencido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          A Vencer
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">{t.descricao_especie}</div>
                    <div className="flex justify-between text-xs text-slate-500 pt-1">
                      <span>Emissão: {t.dtaemissao}</span>
                      <span className="font-medium text-slate-700">Venc.: {t.dtavencimento}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Valor em aberto:</span>
                      <span className="text-base font-extrabold text-slate-900">
                        {formatCurrencyBRL(t.valor_aberto)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
