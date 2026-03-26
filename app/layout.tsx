import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bolsa de Valores RP',
  description: 'Exchange RP para ativos e operações com aprovação manual.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
