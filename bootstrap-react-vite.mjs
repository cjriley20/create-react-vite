#!/usr/bin/env node
/**
 * React + Vite + Prettier + ESLint + Husky + lint-staged + VS Code
 * Optional: Tailwind CSS (+ prettier-plugin-tailwindcss)
 *
 * Usage:
 *   node bootstrap-react-vite.mjs <app-name> [react|react-ts] [options]
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------ CLI metadata ------------------------------ */

const CLI_OPTIONS = {
  pm: {
    flags: ['--pm <name>', '--package-manager <name>'],
    description: 'Package manager: npm | yarn | pnpm',
    default: 'npm',
  },
  framework: {
    flags: ['--framework', '-f'],
    description: 'Framework template: react | react-ts',
    default: 'react',
  },
  tailwind: {
    flags: ['--tailwind', '-t'],
    description: 'Include Tailwind CSS and prettier-plugin-tailwindcss',
    default: false,
  },
  help: {
    flags: ['--help', '-h'],
    description: 'Show this help message',
    default: false,
  },
};

const CLI_ARGS = [
  {
    name: '<app-name>',
    description: 'Name of the new project folder',
  },
];

function printHelp() {
  console.log(`
Usage:
  node bootstrap-react-vite.mjs ${CLI_ARGS.map((a) => a.name).join(
    ' '
  )} [options]

Arguments:
${CLI_ARGS.map(
  (a) => `  ${a.name.padEnd(12)} ${a.description} (default: ${a.default})`
).join('\n')}

Options:
${Object.values(CLI_OPTIONS)
  .map(
    (opt) =>
      `  ${opt.flags.join(', ').padEnd(30)} ${opt.description}${
        opt.default !== undefined ? ` (default: ${opt.default})` : ''
      }`
  )
  .join('\n')}

Examples:
  node bootstrap-react-vite.mjs my-app
  node bootstrap-react-vite.mjs my-app -f react-ts --pm pnpm -t
`);
}

/* --------------------------------- Utils ---------------------------------- */

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

function writeFile(filepath, content) {
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, content);
  console.log(`  ✍️  ${path.relative(process.cwd(), filepath)}`);
}

function upsertJSON(filepath, mutate) {
  const exists = fs.existsSync(filepath);
  const data = exists ? JSON.parse(fs.readFileSync(filepath, 'utf8')) : {};
  const updated = mutate(data) || data;
  fs.writeFileSync(filepath, JSON.stringify(updated, null, 2) + '\n');
  console.log(`  🔧 updated ${path.relative(process.cwd(), filepath)}`);
}

function parseArgs(argv) {
  // If user passed help anywhere, print and exit early
  if (argv.some((a) => a === '-h' || a === '--help')) {
    printHelp();
    process.exit(0);
  }

  // positional
  const appName = argv[0];
  if (appName === undefined) {
    console.log('Missing required app name');
    printHelp();
    process.exit(0);
  }

  // options
  let pm = CLI_OPTIONS.pm.default;
  let tailwind = CLI_OPTIONS.tailwind.default;
  let template = CLI_OPTIONS.framework.default;

  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];

    // --pm / --package-manager <name>
    if (CLI_OPTIONS.pm.flags.includes(a) && argv[i + 1]) {
      pm = argv[i + 1];
      i++;
      continue;
    }

    // --tailwind / -t
    if (CLI_OPTIONS.tailwind.flags.includes(a)) {
      tailwind = true;
      continue;
    }

    // --framework / -f
    if (CLI_OPTIONS.framework.flags.includes(a) && argv[i + 1]) {
      template = argv[i + 1];
      i++;
      continue;
    }
  }

  if (!['npm', 'yarn', 'pnpm'].includes(pm)) pm = CLI_OPTIONS.pm.default;

  return { appName, template, pm, tailwind };
}

function depCmd(pm, deps, dev = true) {
  if (!deps.length) return null;
  switch (pm) {
    case 'npm':
      return `npm i ${dev ? '-D ' : ''}${deps.join(' ')}`;
    case 'yarn':
      return `yarn add ${dev ? '-D ' : ''}${deps.join(' ')}`;
    case 'pnpm':
      return `pnpm add ${dev ? '-D ' : ''}${deps.join(' ')}`;
    default:
      return null;
  }
}

function installCmd(pm) {
  switch (pm) {
    case 'npm':
      return 'npm install';
    case 'yarn':
      return 'yarn install';
    case 'pnpm':
      return 'pnpm install';
    default:
      return 'npm install';
  }
}

function runScriptCmd(pm, script) {
  switch (pm) {
    case 'npm':
      return `npm run ${script}`;
    case 'yarn':
      return `yarn ${script}`;
    case 'pnpm':
      return `pnpm ${script}`;
    default:
      return `npm run ${script}`;
  }
}

function ensureIndexCss(appDir) {
  const p = path.join(appDir, 'src', 'index.css');
  if (!fs.existsSync(p)) writeFile(p, `/* App styles */\n`);
  return p;
}

function enableTailwind({ appDir, pm, isTS }) {
  // https://tailwindcss.com/docs/installation/using-vite
  console.log('➡ Enabling Tailwind CSS…');

  // Install Tailwind CSS and dependencies.
  const tailwindPkgs = ['tailwindcss', '@tailwindcss/vite'];
  let cmd = depCmd(pm, tailwindPkgs, false);
  if (cmd) run(cmd);

  const tailwindDeps = ['prettier-plugin-tailwindcss'];
  cmd = depCmd(pm, tailwindDeps, true);
  if (cmd) run(cmd);

  // Update Vite config.
  const viteConfigPath = path.join(appDir, 'vite.config.js');
  let config = fs.readFileSync(viteConfigPath, 'utf-8');

  // Add the import if missing
  if (!config.includes('@tailwindcss/vite')) {
    config = `import tailwindcss from '@tailwindcss/vite';\n` + config;
  }

  // Update plugins line
  config = config.replace(
    /plugins:\s*\[\s*react\(\)\s*\]/,
    'plugins: [react(), tailwindcss()]'
  );

  writeFile(viteConfigPath, config);

  // CSS directives
  const indexCssPath = ensureIndexCss(appDir);
  writeFile(indexCssPath, `@import "tailwindcss";\n`);

  // Add Prettier plugin
  const prettierPath = path.join(appDir, '.prettierrc.json');
  upsertJSON(prettierPath, (cfg) => {
    const plugins = new Set([...(cfg.plugins || [])]);
    plugins.add('prettier-plugin-tailwindcss');
    return { ...cfg, plugins: [...plugins] };
  });

  // Add tailwind config to VS Code settings.
  const vsCodePath = path.join(appDir, '.vscode', 'settings.json');
  upsertJSON(vsCodePath, (cfg) => {
    return { ...cfg, 'tailwindCSS.experimental.configFile': 'src/index.css' };
  });

  // Starter App with Tailwind UI
  const appFile = path.join(appDir, 'src', isTS ? 'App.tsx' : 'App.jsx');

  const appTypeScript = `import { useState } from 'react';
import './App.css';
import './index.css';

export default function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="rounded-2xl shadow p-8 bg-white dark:bg-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">
          Hello, React + Vite + Tailwind 🚀
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}
`;

  const appJavaScript = `import { useState } from 'react';
import './App.css';
import './index.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
      <div className="rounded-2xl shadow p-8 bg-white dark:bg-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-50">
          Hello, React + Vite + Tailwind 🚀
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700"
        >
          Count: {count}
        </button>
      </div>
    </div>
  );
}
`;

  if (isTS) {
    writeFile(appFile, appTypeScript);
  } else {
    writeFile(appFile, appJavaScript);
  }

  // Update README
  fs.appendFileSync(
    path.join(appDir, 'README.md'),
    `\n## Tailwind CSS\n\n- Tailwind CSS and \`prettier-plugin-tailwindcss\` are enabled.\n- Utility classes are automatically sorted by Prettier.\n`
  );

  console.log('✅ Tailwind CSS enabled.');
}

/* --------------------------------- Main ----------------------------------- */

async function main() {
  const argv = process.argv.slice(2);
  const { appName, template, pm, tailwind } = parseArgs(argv);

  console.log(`➡ Creating Vite app: ${appName} (template: ${template})`);
  run(`npm create vite@latest ${appName} -- --template ${template}`);

  const appDir = path.resolve(process.cwd(), appName);
  process.chdir(appDir);
  console.log(`➡ Working directory: ${appDir}`);

  // Detect PM via lockfile (post-create)
  let chosenPM = pm;
  if (fs.existsSync('pnpm-lock.yaml')) chosenPM = 'pnpm';
  else if (fs.existsSync('yarn.lock')) chosenPM = 'yarn';
  console.log(`➡ Package manager: ${chosenPM}`);

  // Base configs
  console.log('➡ Writing base config files…');

  writeFile(
    path.join(appDir, '.prettierrc.json'),
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
    ) + '\n'
  );

  writeFile(
    path.join(appDir, '.prettierignore'),
    [
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
    ].join('\n')
  );

  const isTS = template === 'react-ts';

  const eslintrcTypeScript = {
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
  };

  const eslintrcJavaScript = {
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
  };

  writeFile(
    path.join(appDir, '.eslintrc.json'),
    JSON.stringify(isTS ? eslintrcTypeScript : eslintrcJavaScript, null, 2) +
      '\n'
  );

  writeFile(
    path.join(appDir, '.eslintignore'),
    ['dist', 'node_modules', 'vite.config.*.ts', 'vite.config.*.js', ''].join(
      '\n'
    )
  );

  writeFile(
    path.join(appDir, '.vscode', 'settings.json'),
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
    ) + '\n'
  );

  // Starter App (non-TW; Tailwind flow overwrites later)
  if (isTS) {
    writeFile(
      path.join(appDir, 'src', 'App.tsx'),
      `import { useState } from 'react';
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
`
    );
  } else {
    writeFile(
      path.join(appDir, 'src', 'App.jsx'),
      `import { useState } from 'react';
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
`
    );
  }

  // README
  writeFile(
    path.join(appDir, 'README.md'),
    `# ${appName}

[![Code Style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![Linting: ESLint](https://img.shields.io/badge/linting-eslint-blue.svg)](https://eslint.org)

A React + Vite starter with Prettier, ESLint, Husky, lint-staged, and VS Code settings pre-configured.

## Scripts

- \`${runScriptCmd(chosenPM, 'dev')}\` — Start development server
- \`${runScriptCmd(chosenPM, 'build')}\` — Build for production
- \`${runScriptCmd(chosenPM, 'preview')}\` — Preview production build
- \`${runScriptCmd(chosenPM, 'lint')}\` — Run ESLint
- \`${runScriptCmd(chosenPM, 'lint:fix')}\` — Fix ESLint issues
- \`${runScriptCmd(chosenPM, 'format')}\` — Format code with Prettier
`
  );

  // Ensure package.json scripts + lint-staged
  console.log('➡ Updating package.json…');
  upsertJSON(path.join(appDir, 'package.json'), (pkg) => {
    pkg.scripts ||= {};
    pkg.scripts.prepare ||= 'husky';
    pkg.scripts.lint ||= 'eslint .';
    pkg.scripts['lint:fix'] ||= 'eslint . --fix';
    pkg.scripts.format ||= 'prettier --write .';

    pkg['lint-staged'] ||= {};
    pkg['lint-staged']['*.{js,jsx,ts,tsx}'] ||= [
      'eslint --fix',
      'prettier --write',
    ];
    pkg['lint-staged']['*.{json,css,md}'] ||= ['prettier --write'];
    return pkg;
  });

  // Install base dev deps
  console.log('➡ Installing base dev dependencies…');
  const baseDeps = [
    'prettier',
    'eslint',
    'eslint-config-prettier',
    'eslint-plugin-prettier',
    'eslint-plugin-react',
    'eslint-plugin-react-hooks',
    'husky',
    'lint-staged',
  ];
  const tsDeps = [
    '@typescript-eslint/parser',
    '@typescript-eslint/eslint-plugin',
  ];
  const allDev = isTS ? baseDeps.concat(tsDeps) : baseDeps;
  const installBase = depCmd(chosenPM, allDev, true);
  if (installBase) run(installBase);

  // Optional Tailwind
  if (tailwind) enableTailwind({ appDir, pm: chosenPM, isTS });

  // Final install
  console.log('➡ Ensuring dependencies are installed…');
  run(installCmd(chosenPM));

  // Git + Husky
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    console.log('➡ Initializing git repo…');
    run('git init');
  }
  console.log('➡ Configuring Husky pre-commit hook…');

  // Initialize Husky (creates .husky/pre-commit and sets "prepare": "husky")
  run('npx husky init');

  // Overwrite the default pre-commit to run lint-staged (no npx needed in v9)
  writeFile(path.join(appDir, '.husky', 'pre-commit'), 'lint-staged\n');

  console.log('\n✅ All set!');
  console.log(`Next steps:
  cd ${appName}
  ${runScriptCmd(chosenPM, 'dev')}

Need help?
  node ${path.basename(__filename)} --help

Pre-commit hooks are active. Try:
  git add -A && git commit -m "test hooks"
`);
}

main().catch((err) => {
  console.error('❌ Bootstrap failed:\n', err);
  process.exit(1);
});
