import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const envExamplePath = join(root, '.env.example');
const distPath = join(root, 'dist');
const vercelConfigPath = join(root, 'vercel.json');
const azureSourceConfigPath = join(root, 'public', 'staticwebapp.config.json');
const azureBuiltConfigPath = join(distPath, 'staticwebapp.config.json');
const requiredPublicKeys = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const restrictedIdentifiers = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'AZURE_CLIENT_SECRET',
  'MICROSOFT_CLIENT_SECRET',
  'client_secret',
];

function fail(message) {
  console.error(`Config verification failed: ${message}`);
  process.exitCode = 1;
}

function listFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });
}

if (!existsSync(envExamplePath)) {
  fail('.env.example is missing.');
} else {
  const lines = readFileSync(envExamplePath, 'utf8').split(/\r?\n/);
  const entries = new Map(lines
    .filter((line) => line && !line.trimStart().startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return separator < 0 ? [line.trim(), undefined] : [line.slice(0, separator).trim(), line.slice(separator + 1)];
    }));

  for (const key of requiredPublicKeys) {
    if (!entries.has(key)) fail(`${key} is missing from .env.example.`);
    if (entries.get(key) !== '') fail(`${key} must remain an empty placeholder in .env.example.`);
  }
  for (const key of entries.keys()) {
    if (restrictedIdentifiers.some((identifier) => key.includes(identifier))) {
      fail('.env.example contains a restricted secret key name.');
    }
  }
}

if (!existsSync(distPath) || !statSync(distPath).isDirectory()) {
  fail('dist/ is missing. Run npm run build before verification.');
} else {
  const buildFiles = listFiles(distPath);
  if (!buildFiles.some((path) => relative(distPath, path) === 'index.html')) {
    fail('dist/index.html is missing.');
  }

  for (const filePath of buildFiles) {
    const contents = readFileSync(filePath, 'utf8');
    if (restrictedIdentifiers.some((identifier) => contents.includes(identifier))) {
      fail(`restricted secret identifier found in build output file ${relative(distPath, filePath)}.`);
    }
  }
}

if (!existsSync(vercelConfigPath)) {
  fail('vercel.json is missing; /auth/callback needs an SPA rewrite.');
} else {
  try {
    const vercelConfig = JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
    const hasCallbackRewrite = vercelConfig.rewrites?.some((rewrite) => (
      rewrite.source === '/auth/callback' && rewrite.destination === '/index.html'
    ));
    if (!hasCallbackRewrite) fail('vercel.json must rewrite /auth/callback to /index.html.');
  } catch {
    fail('vercel.json is not valid JSON.');
  }
}

const azureConfigs = [];
for (const configPath of [azureSourceConfigPath, azureBuiltConfigPath]) {
  const label = relative(root, configPath);
  if (!existsSync(configPath)) {
    fail(`${label} is missing; Azure needs the callback rewrite in the deployment output.`);
    continue;
  }
  try {
    const config = JSON.parse(readFileSync(configPath, 'utf8'));
    azureConfigs.push(config);
    const callback = config.routes?.find((route) => route.route === '/auth/callback');
    if (callback?.rewrite !== '/index.html' || callback.redirect
      || (callback.methods && !['GET', 'HEAD'].every((method) => callback.methods.includes(method)))
      || (callback.allowedRoles && !callback.allowedRoles.includes('anonymous'))) {
      fail(`${label} must allow the anonymous OAuth callback and rewrite it to /index.html.`);
    }
  } catch {
    fail(`${label} is not valid JSON.`);
  }
}
if (azureConfigs.length === 2 && JSON.stringify(azureConfigs[0]) !== JSON.stringify(azureConfigs[1])) {
  fail('Azure source and built configuration differ. Rebuild before deployment.');
}

if (process.exitCode !== 1) {
  console.log('Config verification passed: public env template and build output contain no restricted secret identifiers.');
}
