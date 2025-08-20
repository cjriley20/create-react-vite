// Base config files

const prettierRcJson =
  JSON.stringify(
    {
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 80,
      tabWidth: 2,
      bracketSpacing: true,
      arrowParens: 'always',
    },
    null,
    2
  ) + '\n';

const prettierIgnore = [
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '',
].join('\n');

export function getFileRegistry() {
  // Key should be the local file path relative to the app directory.
  return {
    '.prettierrc.json': prettierRcJson,
    '.prettierignore': prettierIgnore,
  };
}
