import './globals.css';
import type { Metadata, Viewport } from 'next';
import { PwaRegister } from '@/components/pwa-register';

export const metadata: Metadata = {
  title: 'Bolsa de Valores RP',
  description: 'Exchange RP para ativos e operações com aprovação manual.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    title: 'Bolsa RP',
    capable: true,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
