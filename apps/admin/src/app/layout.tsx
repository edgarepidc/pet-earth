import type { Metadata } from 'next';
import { DM_Sans } from 'next/font/google';

import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Pet Earth Admin',
  description: 'Panel clínico para veterinarias',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-sans text-slate-900">{children}</body>
    </html>
  );
}
