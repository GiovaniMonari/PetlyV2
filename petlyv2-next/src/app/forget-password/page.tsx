'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Mail, PawPrint } from 'lucide-react';
import { apiForgetPassword } from '@/utils/api';

const DEFAULT_SUCCESS_MESSAGE =
  'Se o e-mail informado estiver cadastrado, enviaremos as instruções de recuperação em instantes.';

export default function ForgetPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState(DEFAULT_SUCCESS_MESSAGE);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const response = await apiForgetPassword({ email: normalizedEmail });
      setSuccessMessage(response.message || DEFAULT_SUCCESS_MESSAGE);
      setIsSent(true);
    } catch (err: any) {
      setError(err?.message || 'Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B35]/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06A77D]/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        <div className="mb-8 flex flex-col items-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="bg-[#FF6B35]/10 p-3 rounded-2xl group-hover:bg-[#FF6B35]/20 transition-colors">
              <PawPrint className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Petly</span>
          </Link>
          <h1 className="text-2xl font-semibold text-white mb-2 text-center">Esqueceu sua senha?</h1>
          <p className="text-gray-400 text-center">
            Informe seu e-mail para receber o passo a passo de recuperação da conta.
          </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35]/50 to-transparent"></div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {isSent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#06A77D]/20 border border-[#06A77D]/40 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#06A77D]" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Pedido enviado</h2>
              <p className="text-gray-400 text-sm leading-relaxed">{successMessage}</p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold rounded-xl py-3 px-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Ir para login <ArrowRight className="w-5 h-5" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsSent(false);
                    setError('');
                  }}
                  className="w-full bg-black/30 border border-white/10 text-gray-200 font-medium rounded-xl py-3 px-4 hover:border-white/20 transition-colors"
                >
                  Tentar com outro e-mail
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300 ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-[#FF6B35] transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 outline-none focus:border-[#FF6B35]/50 focus:ring-1 focus:ring-[#FF6B35]/50 transition-all placeholder:text-gray-600"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden bg-[#FF6B35] text-white font-semibold rounded-xl py-3 px-4 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 flex items-center justify-center gap-2 mt-6"
              >
                <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out"></div>
                <span className="relative z-10 flex items-center gap-2">
                  {isLoading ? (
                    <span className="inline-block animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                  ) : (
                    <>
                      Enviar instruções <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </span>
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
