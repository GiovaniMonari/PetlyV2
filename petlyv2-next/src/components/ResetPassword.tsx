'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
ArrowLeft,
ArrowRight,
CheckCircle2,
Lock,
Eye,
EyeOff,
} from 'lucide-react';

import { apiResetPassword } from '@/utils/api';
import BrandLogo from '@/components/BrandLogo';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent,) => { e.preventDefault();

    setError('');

    if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
    }

    if (!token) {
        setError('Token inválido ou ausente.');
        return;
    }

    try {
    setIsLoading(true);

    await apiResetPassword({
        token,
        password,
    });

    setIsSuccess(true);
    } catch (err: any) {
    setError(
        err?.message ||
        'Não foi possível redefinir sua senha.',
    );
    } finally {
    setIsLoading(false);
    }

    };

  return ( <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden"> <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF6B35]/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#06A77D]/10 blur-[120px] rounded-full pointer-events-none"></div>

    <div className="w-full max-w-md relative z-10">
        <div className="mb-8 flex flex-col items-center">
        <Link
            href="/"
            className="inline-flex items-center gap-2 mb-6 group"
        >
            <BrandLogo
            size="lg"
            priority
            imageClassName="rounded-2xl group-hover:ring-[#FF6B35]/40 transition-all"
            />
        </Link>

        <h1 className="text-2xl font-semibold text-white mb-2 text-center">
            Redefinir senha
        </h1>

        <p className="text-gray-400 text-center">
            Informe sua nova senha para concluir a recuperação da conta.
        </p>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FF6B35]/50 to-transparent"></div>

        {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
            </div>
        )}

        {isSuccess ? (
            <div className="text-center">
            <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#06A77D]/20 border border-[#06A77D]/40 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-[#06A77D]" />
            </div>

            <h2 className="text-xl font-semibold text-white mb-2">
                Senha atualizada
            </h2>

            <p className="text-gray-400 text-sm">
                Sua senha foi redefinida com sucesso.
            </p>

            <button
                onClick={() => router.push('/login')}
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-[#FF6B35] text-white font-semibold rounded-xl py-3 px-4 transition-all hover:scale-[1.02]"
            >
                Ir para login
                <ArrowRight className="w-5 h-5" />
            </button>
            </div>
        ) : (
            <form
            onSubmit={handleSubmit}
            className="space-y-5"
            >
            <div>
                <label className="text-sm font-medium text-gray-300 ml-1">
                Nova senha
                </label>

                <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />

                <input
                    type={
                    showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={password}
                    onChange={(e) =>
                    setPassword(e.target.value)
                    }
                    required
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-12 outline-none focus:border-[#FF6B35]/50"
                    placeholder="Digite sua nova senha"
                />

                <button
                    type="button"
                    onClick={() =>
                    setShowPassword(
                        !showPassword,
                    )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                    {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                    )}
                </button>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-gray-300 ml-1">
                Confirmar senha
                </label>

                <div className="relative mt-2">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />

                <input
                    type={
                    showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                    setConfirmPassword(
                        e.target.value,
                    )
                    }
                    required
                    className="w-full bg-black/40 border border-white/10 text-white rounded-xl py-3 pl-11 pr-12 outline-none focus:border-[#FF6B35]/50"
                    placeholder="Confirme sua senha"
                />

                <button
                    type="button"
                    onClick={() =>
                    setShowConfirmPassword(
                        !showConfirmPassword,
                    )
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                    {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                    ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                    )}
                </button>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#FF6B35] text-white font-semibold rounded-xl py-3 px-4 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
                {isLoading ? (
                <span className="inline-block animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span>
                ) : (
                <>
                    Redefinir senha
                    <ArrowRight className="w-5 h-5" />
                </>
                )}
            </button>
            </form>
        )}
        </div>

        <div className="mt-8 text-center">
        <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
        >
            <ArrowLeft className="w-4 h-4" />
            Voltar para login
        </Link>
     </div>
    </div>
  </div>

  );
}
