// Base config files

// Prettier

const prettierrcJson =
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

// ESLint

const eslintrcTypeScript =
  JSON.stringify(
    {
      env: { browser: true, es2021: true, node: true },
      parser: '@typescript-eslint/parser',
      parserOptions: { project: false },
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
      plugins: ['@typescript-eslint', 'react', 'react-hooks', 'prettier'],
      rules: { 'prettier/prettier': 'error', 'react/prop-types': 'off' },
      settings: { react: { version: 'detect' } },
    },
    null,
    2
  ) + '\n';

const eslintrcJavaScript =
  JSON.stringify(
    {
      env: { browser: true, es2021: true, node: true },
      extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:prettier/recommended',
      ],
      plugins: ['react', 'react-hooks', 'prettier'],
      rules: { 'prettier/prettier': 'error', 'react/prop-types': 'off' },
      settings: { react: { version: 'detect' } },
    },
    null,
    2
  ) + '\n';

const eslintIgnore = [
  'dist',
  'node_modules',
  'vite.config.*.ts',
  'vite.config.*.js',
  '',
].join('\n');

// VS Code Settings

const vsCodeSettings =
  JSON.stringify(
    {
      'editor.defaultFormatter': 'esbenp.prettier-vscode',
      'editor.formatOnSave': true,
      'editor.formatOnSaveMode': 'modifications',
      'prettier.prettierPath': './node_modules/prettier',
      'eslint.validate': [
        'javascript',
        'javascriptreact',
        'typescript',
        'typescriptreact',
      ],
      'editor.codeActionsOnSave': {
        'source.fixAll': 'explicit',
        'source.fixAll.eslint': 'explicit',
      },
    },
    null,
    2
  ) + '\n';

// Registry

export function getFileRegistry({ isTypeScript }) {
  // Key should be the local file path relative to the app directory.
  return {
    '.prettierrc.json': prettierrcJson,
    '.prettierignore': prettierIgnore,
    '.eslintrc.json': isTypeScript ? eslintrcTypeScript : eslintrcJavaScript,
    '.eslintignore': eslintIgnore,
    '.vscode/settings.json': vsCodeSettings,
  };
}
