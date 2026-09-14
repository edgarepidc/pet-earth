import type { Metadata } from 'next';
import { IBM_Plex_Sans, Source_Serif_4 } from 'next/font/google';

import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin'],
  variable: '--font-ibm-plex-sans',
  weight: ['400', '500', '600', '700'],
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'Cartilla · Pet Earth',
  description: 'Historial y seguimiento de tu mascota',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${plex.variable} ${serif.variable} h-full antialiased`}>
      <body className="pe-app min-h-full font-sans">{children}</body>
    </html>
  );
}
