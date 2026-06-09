import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[calc(100vh-5rem)] bg-[#050505] text-gray-200 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl border border-white/10 bg-[#0f0f0f]/90 p-8 shadow-2xl shadow-black/20">
          <div className="mb-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#FF6B35]">Termos de Uso</p>
            <h1 className="mt-4 text-4xl font-bold text-white">Condições para uso do Petly</h1>
            <p className="mt-4 text-gray-400 leading-relaxed">Leia com atenção para entender como você pode utilizar nossos serviços, suas responsabilidades e os direitos sobre a sua conta.</p>
          </div>

          <section className="space-y-8 text-gray-300">
            <div>
              <h2 className="text-2xl font-semibold text-white">1. Aceitação dos Termos</h2>
              <p className="mt-3 leading-relaxed">Ao criar uma conta e usar o Petly, você concorda com estes Termos de Uso, nossa Política de Privacidade e os requisitos de consentimento de cookies. Caso não concorde com qualquer parte, não utilize a plataforma.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">2. Uso da plataforma</h2>
              <p className="mt-3 leading-relaxed">A plataforma é destinada a conectar tutores e cuidadores de pets. Você é responsável pelas informações fornecidas no cadastro e por manter seus dados atualizados.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">3. Responsabilidades</h2>
              <p className="mt-3 leading-relaxed">Não nos responsabilizamos por decisões de contratação entre usuários. Utilize as informações do perfil e avaliações para escolher o melhor cuidador ou contratar serviços de forma segura.</p>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white">4. Segurança e privacidade</h2>
              <p className="mt-3 leading-relaxed">Suas informações são protegidas conforme nossa Política de Privacidade. Não compartilhe senhas e evite expor dados sensíveis em mensagens públicas.</p>
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/cadastro" className="text-sm text-[#FF6B35] hover:text-[#E55A2B]">Voltar para cadastro</Link>
            <Link href="/privacidade" className="text-sm text-white/80 hover:text-white">Veja também a Política de Privacidade</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
