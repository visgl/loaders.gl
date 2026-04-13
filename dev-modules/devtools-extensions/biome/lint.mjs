import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const packageDirectory = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(packageDirectory, '..');
const repoRoot = path.resolve(packageDirectory, '..', '..', '..');
const biomeConfigPath = path.join(repoRoot, 'biome.jsonc');
const biomeArguments = process.argv.slice(2);
const mode = biomeArguments[0] === 'fix' ? 'fix' : 'check';
const extraArguments = mode === 'fix' ? biomeArguments.slice(1) : biomeArguments;
const targetPaths = [repoRoot];
const sharedArguments = [`--config-path=${biomeConfigPath}`, '--files-ignore-unknown=true', '--no-errors-on-unmatched'];

runBiome('format', mode === 'fix' ? ['--write', '--reporter=summary'] : ['--reporter=summary']);
runBiome(
  'lint',
  mode === 'fix'
    ? ['--write', '--diagnostic-level=warn']
    : ['--diagnostic-level=warn', '--reporter=summary']
);

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
      cwd: workspaceRoot,
      stdio: 'inherit'
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
