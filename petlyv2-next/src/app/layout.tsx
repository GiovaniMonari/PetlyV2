import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Petly Connect - Encontre o cuidador ideal para seu pet',
  description: 'A maior rede de cuidadores de pets do Brasil. Cuidamos com amor e responsabilidade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#0a0a0a] text-gray-200 font-sans selection:bg-[#FF6B35] selection:text-white">
        {children}
      </body>
    </html>
  );
}
