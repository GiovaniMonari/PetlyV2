import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
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
        <Toaster position="bottom-right" toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)'
          }
        }} />
        {children}
      </body>
    </html>
  );
}
