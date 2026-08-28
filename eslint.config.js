import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['.output/**', '.wxt/**', 'dist/**', 'graphify-out/**', 'node_modules/**', 'public/sw.js']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        chrome: 'readonly'
      }
    }
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { globals: globals.node }
  }
);
