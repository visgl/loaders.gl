import path from 'path';
import {spawn} from 'child_process';
import {fileURLToPath} from 'url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tileConverterDirectory = path.join(repositoryRoot, 'apps', 'tile-converter');
const tileConverterPackageName = '@loaders.gl/tile-converter';

async function main() {
  const commandType = process.argv[2];

  if (commandType !== 'build' && commandType !== 'test') {
    throw new Error('Usage: node ./scripts/run-app-commands.mjs <build|test>');
  }

  const packageJson = await import(path.join(tileConverterDirectory, 'package.json'), {
    with: {type: 'json'}
  });
  const scriptName = determineScriptName(packageJson.default, commandType);

  if (!scriptName) {
    console.warn(`Skipping ${tileConverterPackageName} (no ${commandType} script)`); // eslint-disable-line no-console
    return;
  }

  console.log(`Running ${commandType} for workspace ${tileConverterPackageName}`); // eslint-disable-line no-console
  await runCommand('yarn', ['workspace', tileConverterPackageName, 'run', scriptName], repositoryRoot);
}

function determineScriptName(packageJson, commandType) {
  if (commandType === 'build') {
    if (packageJson.scripts?.build) {
      return 'build';
    }

    if (packageJson.scripts?.['pre-build']) {
      return 'pre-build';
    }

    return null;
  }

  if (packageJson.scripts?.test) {
    return 'test';
  }

  if (packageJson.scripts?.build) {
    return 'build';
  }

  if (packageJson.scripts?.['pre-build']) {
    return 'pre-build';
  }

  return null;
}

async function runCommand(command, argumentsList, workingDirectory) {
  await new Promise((resolve, reject) => {
    const childProcess = spawn(command, argumentsList, {cwd: workingDirectory, stdio: 'inherit'});

    childProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} ${argumentsList.join(' ')} failed with code ${code}`));
        return;
      }

      resolve();
    });
  });
}

main().catch((error) => {
  console.error(error); // eslint-disable-line no-console
  process.exit(1);
});
