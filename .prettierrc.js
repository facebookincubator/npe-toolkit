module.exports = {
  arrowParens: 'avoid',
  bracketSameLine: true,
  bracketSpacing: false,
  requirePragma: false,
  singleQuote: true,
  trailingComma: 'all',
  overrides: [
    {
      files: ['**/*.{cjs,mjs,js,jsx,flow}'],
      options: {
        parser: 'flow',
      },
    },
    {
      files: ['**/*.graphql'],
      options: {
        parser: 'graphql',
      },
    },
    {
      files: ['**/*.json'],
      options: {
        parser: 'json-stringify',
      },
    },
    {
      files: ['**/*.{md,markdown}'],
      options: {
        parser: 'markdown',
        proseWrap: 'always',
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      options: {
        parser: 'typescript',
      },
    },
    {
      files: ['**/*.d.ts'],
      options: {
        requirePragma: true,
      },
    },
  ],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  importOrder: [
    '^(react|react-native)$',
    '<THIRD_PARTY_MODULES>',
    '@toolkit/(.*)$',
    '@app/(.*)$',
    '^[./]',
  ],
};
