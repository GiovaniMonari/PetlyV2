import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PetCare Connect - Encontre o cuidador ideal para seu pet',
  description: 'A maior rede de cuidadores de pets do Brasil. Cuidamos com amor e responsabilidade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
        {children}
      </body>
    </html>
  );
}
