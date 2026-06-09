import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-5rem)] bg-[#050505] text-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#06A77D]">Privacidade</p>
            <h1 className="mt-4 text-4xl font-bold text-white">Política de Privacidade</h1>
            <p className="mt-4 text-gray-400 leading-relaxed">Entenda como coletamos, usamos e protegemos seus dados ao usar o Petly.</p>
          </div>

          <section className="space-y-8 text-gray-300">
            <div>
              <h2 className="text-2xl font-semibold text-white">1. Dados que coletamos</h2>
              <p className="mt-3 leading-relaxed">Coletamos dados básicos de cadastro, como nome, e-mail, CPF e localização, para fornecer os serviços e otimizar sua experiência no Petly.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">2. Uso das informações</h2>
              <p className="mt-3 leading-relaxed">Os dados são usados para criar sua conta, facilitar conexões entre usuários e melhorar o serviço. Nunca comercializamos seus dados pessoais sem consentimento.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">3. Compartilhamento e segurança</h2>
              <p className="mt-3 leading-relaxed">Compartilhamos somente as informações necessárias com cuidadores quando você solicita um serviço. Aplicamos medidas técnicas e administrativas para proteger seus dados.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">4. Direitos do usuário</h2>
              <p className="mt-3 leading-relaxed">Você pode revisar e atualizar seus dados a qualquer momento em seu perfil. Caso deseje cancelar a conta, solicite pelo suporte e seus dados serão excluídos conforme a legislação aplicável.</p>
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cadastro" className="text-sm text-[#06A77D] hover:text-[#05a36a]">Voltar para cadastro</Link>
            <Link href="/termos" className="text-sm text-white/80 hover:text-white">Leia também os Termos de Uso</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
