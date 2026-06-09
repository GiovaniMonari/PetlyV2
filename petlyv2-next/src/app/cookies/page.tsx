import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-5rem)] bg-[#050505] text-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#FFAA00]">Cookies</p>
            <h1 className="mt-4 text-4xl font-bold text-white">Como usamos cookies</h1>
            <p className="mt-4 text-gray-400 leading-relaxed">Utilizamos cookies para melhorar a sua navegação, lembrar preferências e permitir que nosso sistema funcione adequadamente.</p>
          </div>

          <section className="space-y-8 text-gray-300">
            <div>
              <h2 className="text-2xl font-semibold text-white">1. O que são cookies?</h2>
              <p className="mt-3 leading-relaxed">Cookies são pequenos arquivos gravados no navegador para lembrar informações sobre sua visita e preferências dentro do site.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">2. Por que usamos cookies?</h2>
              <p className="mt-3 leading-relaxed">Eles ajudam a manter você conectado, lembrar suas preferências e apresentar conteúdo mais relevante durante sua navegação.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">3. Consentimento</h2>
              <p className="mt-3 leading-relaxed">Ao aceitar o banner de cookies, você permite que usemos cookies essenciais e de desempenho. Você pode recusar clicando fora do banner e continuar usando a maioria dos recursos.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">4. Gerenciamento</h2>
              <p className="mt-3 leading-relaxed">Você pode limpar cookies diretamente nas configurações do navegador ou alterar seu consentimento a qualquer momento se estiver em um ambiente compatível.</p>
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cadastro" className="text-sm text-[#FFAA00] hover:text-[#ff9f00]">Voltar para cadastro</Link>
            <Link href="/privacidade" className="text-sm text-white/80 hover:text-white">Ver Política de Privacidade</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
