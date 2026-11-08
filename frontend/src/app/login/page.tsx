'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, AlertCircle, ArrowRight, Building2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario, senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.error || 'Falha na autenticação. Verifique usuário e senha.');
        setLoading(false);
        return;
      }

      localStorage.setItem('queiroz_token', data.token);
      localStorage.setItem('queiroz_fornecedor', JSON.stringify(data.fornecedor));
      router.push('/pendencias');
    } catch (err) {
      setErro('Não foi possível conectar ao servidor da API (porta 3001). Verifique se o back-end está rodando.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        <div className="bg-blue-900 px-8 py-7 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-800/80 rounded-xl">
              <Building2 className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-blue-200 font-semibold block">
                Setor Financeiro
              </span>
              <h1 className="text-xl font-bold tracking-tight">Grupo Queiroz</h1>
            </div>
          </div>
          <p className="text-sm text-blue-100/90 mt-2">
            Portal do Fornecedor — Acesse para consultar seus títulos e pendências em aberto.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {erro && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <div>
            <label htmlFor="usuario" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Código do Fornecedor (Usuário)
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="usuario"
                type="text"
                inputMode="numeric"
                required
                placeholder="Ex: 4827"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-semibold text-slate-700 mb-1.5">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="senha"
                type="password"
                required
                placeholder="••••••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 outline-none transition text-slate-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2"
          >
            {loading ? 'Autenticando...' : 'Entrar no Portal'}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>

          <div className="pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
            <span>Credencial de teste homologada:</span>
            <button
              type="button"
              onClick={() => {
                setUsuario('4827');
                setSenha('queiroz@2026');
              }}
              className="text-blue-700 hover:underline font-medium"
            >
              Preencher (4827)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
