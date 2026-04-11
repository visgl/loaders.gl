import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(packageDirectory, '..', '..', '..');
const biomeArguments = process.argv.slice(2);
const mode = biomeArguments[0] === 'fix' ? 'fix' : 'check';
const extraArguments = mode === 'fix' ? biomeArguments.slice(1) : biomeArguments;
const targetPaths = [
  'modules/**/*.js',
  'modules/**/*.jsx',
  'modules/**/*.ts',
  'modules/**/*.tsx',
  'apps/**/*.js',
  'apps/**/*.jsx',
  'apps/**/*.ts',
  'apps/**/*.tsx',
  'dev-docs/**/*.js',
  'dev-docs/**/*.jsx',
  'dev-docs/**/*.ts',
  'dev-docs/**/*.tsx',
  'docs/**/*.js',
  'docs/**/*.jsx',
  'docs/**/*.ts',
  'docs/**/*.tsx',
  'test/**/*.js',
  'test/**/*.jsx',
  'test/**/*.ts',
  'test/**/*.tsx'
];
const sharedArguments = [
  '--config-path=biome.jsonc',
  '--files-ignore-unknown=true',
  '--no-errors-on-unmatched',
  '--reporter=summary'
];

runBiome('format', mode === 'fix' ? ['--write'] : []);
runBiome('lint', mode === 'fix' ? ['--write', '--diagnostic-level=error'] : ['--diagnostic-level=warn']);

function runBiome(command, commandArguments) {
  const result = spawnSync(
    'yarn',
    [
      'exec',
      'biome',
      command,
      ...commandArguments,
      ...sharedArguments,
      ...extraArguments,
      ...targetPaths
    ],
    {
      cwd: repoRoot,
      stdio: 'inherit'
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
