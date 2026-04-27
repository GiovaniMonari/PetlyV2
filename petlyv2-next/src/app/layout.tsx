import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Petly - Encontre o cuidador ideal para seu pet',
  description: 'Cuidamos com amor e responsabilidade do seu melhor amigo.',
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
