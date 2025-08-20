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
import { parseArgs } from 'node:util';

import { getFileRegistry } from './file-registry.mjs';
import { runScriptCmd } from './utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ------------------------------ CLI metadata ------------------------------ */

const CLI_OPTIONS = {
  'package-manager': {
    type: 'string',
    description: 'Package manager: npm | yarn | pnpm',
    short: 'p',
    default: 'npm',
  },
  template: {
    type: 'string',
    description: 'Vite template: react | react-ts',
    short: 't',
    default: 'react',
  },
  tailwind: {
    type: 'boolean',
    description: 'Include Tailwind CSS and prettier-plugin-tailwindcss',
    default: false,
  },
  help: {
    type: 'boolean',
    description: 'Show this help message',
    short: 'h',
    default: false,
  },
};

const CLI_ARGS = [
  {
    name: 'app-name',
    description: 'Name of the new project folder',
  },
];

function printHelp() {
  const argNames = CLI_ARGS.map((arg) => `<${arg.name}>`).join(' ');

  console.log(`\nUsage: bootstrap-react-vite.mjs ${argNames} [options]`);

  console.log(`\nPositional arguments:`);
  CLI_ARGS.map((arg) => {
    console.log(`  ${arg.name.padEnd(16)} ${arg.description}`);
  });

  console.log(`\nOptions:`);
  for (const [name, config] of Object.entries(CLI_OPTIONS)) {
    const longOpt = `--${name}`;
    const shortOpt = config.short ? `-${config.short}, ` : '';
    const opt = `${shortOpt}${longOpt}`;
    const desc = config.description || '';
    console.log(`  ${opt.padEnd(30)} ${desc} (default: ${config.default})`);
  }
}

/* --------------------------------- Utils ---------------------------------- */

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', shell: true, ...opts });
}

function writeAllFilesFromRegistry(appDir, fileRegistry) {
  for (const [relPath, content] of Object.entries(fileRegistry)) {
    writeFile(path.join(appDir, relPath), content);
  }
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

function ensureIndexCss(appDir) {
  const p = path.join(appDir, 'src', 'index.css');
  if (!fs.existsSync(p)) writeFile(p, `/* App styles */\n`);
  return p;
}

function enableTailwind({ appDir, pm, useTypeScript }) {
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

  // Update README
  fs.appendFileSync(
    path.join(appDir, 'README.md'),
    `\n## Tailwind CSS\n\n- Tailwind CSS and \`prettier-plugin-tailwindcss\` are enabled.\n- Utility classes are automatically sorted by Prettier.\n`
  );

  console.log('✅ Tailwind CSS enabled.');
}

/* --------------------------------- Main ----------------------------------- */

async function main() {
  // Get command-line arguments.
  const { values, positionals } = parseArgs({
    options: CLI_OPTIONS,
    allowPositionals: true,
  });

  if (values.help || positionals.length === 0) {
    printHelp();
    process.exit(0);
  }

  const appName = positionals[0];
  const template = values.template;
  const pm = values['package-manager'];
  const withTailwind = values.tailwind;

  const useTypeScript = template === 'react-ts';

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

  // Get contents of local files to write.
  const fileRegistry = getFileRegistry({
    appName,
    packageManager: chosenPM,
    useTypeScript,
    withTailwind,
  });

  // Base configs
  console.log('➡ Writing base config files…');
  writeAllFilesFromRegistry(appDir, fileRegistry);

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
  const allDev = useTypeScript ? baseDeps.concat(tsDeps) : baseDeps;
  const installBase = depCmd(chosenPM, allDev, true);
  if (installBase) run(installBase);

  // Optional Tailwind
  if (withTailwind) enableTailwind({ appDir, pm: chosenPM, useTypeScript });

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
