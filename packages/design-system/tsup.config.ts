import { defineConfig } from 'tsup';

/**
 * Build config for @lp/design-system.
 *
 * Entries mirror the package.json "exports" map so every public subpath
 * resolves to a real artifact in dist/:
 *   @lp/design-system            -> dist/index.{js,mjs}
 *   @lp/design-system/tokens     -> dist/tokens/index.{js,mjs}
 *   @lp/design-system/theme      -> dist/theme/index.{js,mjs}
 *   @lp/design-system/components -> dist/components/index.{js,mjs}
 *
 * CSS entry points (./tokens.css, ./theme.css, ./global.css) are shipped
 * from source files — no build step needed for them.
 */
export default defineConfig({
  entry: {
    index: 'index.ts',
    'tokens/index': 'tokens/index.ts',
    'theme/index': 'theme/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'framer-motion'],
});