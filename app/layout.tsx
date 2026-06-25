import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { FavoritesProvider } from '@/context/favorites-context';
import { UserProvider } from '@/context/user-context';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoiceCook — Hands-Free Smart Cooking Assistant',
  description:
    'A futuristic culinary hands-free smart cooking assistant designed for a clean sensory kitchen experience.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfairDisplay.variable} dark`}>
      <body
        suppressHydrationWarning
        className="bg-[#0a0c10] text-slate-100 font-sans min-h-screen selection:bg-teal-500/30 selection:text-teal-200 antialiased overflow-x-hidden relative"
      >
        {/* Soft atmospheric gradient background */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Aurora Teal Glow */}
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-teal-500/20 blur-[120px] rounded-full" />

          {/* Heat Amber Glow */}
          <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-amber-500/10 blur-[100px] rounded-full" />

          {/* Subtly animated floating particles or soft secondary mesh */}
          <div className="absolute top-[30%] right-[20%] w-[35vw] h-[35vw] rounded-full bg-indigo-500/5 blur-[100px]" />
        </div>

        {/* Main layout container */}
        <div className="relative z-10 flex flex-col min-h-screen">
          <UserProvider>
            <FavoritesProvider>{children}</FavoritesProvider>
          </UserProvider>
        </div>
      </body>
    </html>
  );
}