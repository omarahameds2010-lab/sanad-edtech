import '@lp/design-system/tokens.css';
import './globals.css';
import type { Metadata } from 'next';
import { CommandPaletteProvider } from '@/app/hooks/useCommandPalette';
import { AuthProvider } from '@/app/lib/auth';
import { LangProvider } from '@/app/components/landing/i18n';

export const metadata: Metadata = {
  title: 'Learning Platform',
  description: 'One learning universe. Many learning identities.',
  // Google Search Console ownership proof (HTML-tag method).
  verification: {
    google: 'dlUCblFqO6NLb7gMtDGyont0pwN09Jg1TEU7j_Mkb_s',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <CommandPaletteProvider>
          <AuthProvider>
            <LangProvider>{(children as any)}</LangProvider>
          </AuthProvider>
        </CommandPaletteProvider>
      </body>
    </html>
  );
}
