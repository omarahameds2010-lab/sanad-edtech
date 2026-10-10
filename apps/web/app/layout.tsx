import '@lp/design-system/tokens.css';
import './globals.css';
import type { Metadata } from 'next';
import { CommandPaletteProvider } from '@/app/hooks/useCommandPalette';
import { AuthProvider } from '@/app/lib/auth';
import { LangProvider } from '@/app/components/landing/i18n';

export const metadata: Metadata = {
  title: 'Learning Platform',
  description: 'One learning universe. Many learning identities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CommandPaletteProvider>
          <AuthProvider>
            <LangProvider>{children}</LangProvider>
          </AuthProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
