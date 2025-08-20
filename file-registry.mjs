import { runScriptCmd } from './utils.mjs';

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

// App

const appTypeScript = `\
import { useState } from 'react';
import './App.css';

export default function App() {
  const [count, setCount] = useState<number>(0);
  return (
    <div className="App" style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Hello, React + Vite 🚀</h1>
      <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
    </div>
  );
}
`;

const appJavaScript = `\
import { useState } from 'react';
import './App.css';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="App" style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>Hello, React + Vite 🚀</h1>
      <p>Edit <code>src/App.jsx</code> and save to test HMR</p>
      <button onClick={() => setCount((c) => c + 1)}>Count: {count}</button>
    </div>
  );
}
`;

// README
const readme = ({ appName, packageManager }) => `\
# ${appName}

[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![Linting: ESLint](https://img.shields.io/badge/linting-eslint-blue.svg)](https://eslint.org)

A React + Vite starter with Prettier, ESLint, Husky, lint-staged, and VS Code settings pre-configured.

## Scripts

- \`${runScriptCmd(packageManager, 'dev')}\` — Start development server
- \`${runScriptCmd(packageManager, 'build')}\` — Build for production
- \`${runScriptCmd(packageManager, 'preview')}\` — Preview production build
- \`${runScriptCmd(packageManager, 'lint')}\` — Run ESLint
- \`${runScriptCmd(packageManager, 'lint:fix')}\` — Fix ESLint issues
- \`${runScriptCmd(packageManager, 'format')}\` — Format code with Prettier
`;

// Registry

const tsTemplates = {
  '.eslintrc.json': eslintrcTypeScript,
  'src/App.tsx': appTypeScript,
};

const jsTemplates = {
  '.eslintrc.json': eslintrcJavaScript,
  'src/App.jsx': appJavaScript,
};

export function getFileRegistry({ appName, packageManager, useTypeScript }) {
  // Key should be the local file path relative to the app directory.
  return {
    '.prettierrc.json': prettierrcJson,
    '.prettierignore': prettierIgnore,
    '.eslintignore': eslintIgnore,
    '.vscode/settings.json': vsCodeSettings,
    'README.md': readme({ appName, packageManager }),
    ...(useTypeScript ? tsTemplates : jsTemplates),
  };
}
