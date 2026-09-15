import type { Metadata } from 'next';
import { Geist, Geist_Mono, Source_Serif_4 } from 'next/font/google';

import './globals.css';

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const mono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Pet Earth · Clínica',
  description: 'Panel clínico para veterinarias',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${mono.variable} ${serif.variable} h-full antialiased`}>
      <body className="pe-app min-h-full font-sans">{children}</body>
    </html>
  );
}
