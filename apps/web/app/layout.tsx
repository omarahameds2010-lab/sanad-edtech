import '@lp/design-system/tokens.css';
import './globals.css';
import type { Metadata } from 'next';
import { CommandPaletteProvider } from '@/app/hooks/useCommandPalette';
import { AuthProvider } from '@/app/lib/auth';
import { ThemeProvider } from '@/app/lib/theme-provider';
import { THEME_INIT_SCRIPT } from '@/app/lib/theme';
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
    <html
      lang="ar"
      dir="rtl"
      data-theme="dark"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
        />
      </head>
      <body>
        <ThemeProvider>
          <CommandPaletteProvider>
            <AuthProvider>
              <LangProvider>{(children as any)}</LangProvider>
            </AuthProvider>
          </CommandPaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
