#!/usr/bin/env node

import {spawn} from 'child_process';
import {existsSync, readdirSync} from 'fs';
import {mkdir} from 'fs/promises';
import {dirname, join, resolve} from 'path';
import {fileURLToPath} from 'url';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '..');
const packageDirectories = getPackageDirectories();
const moduleBundlesOnly = process.argv.includes('--module-bundles-only');

for (const packageDirectory of packageDirectories) {
  const packageJson = await import(join(packageDirectory, 'package.json'), {
    with: {type: 'json'}
  });
  const buildScripts = getWorkerBuildScripts(packageJson.default.scripts || {});

  if (!buildScripts.length) {
    continue;
  }

  await prepareOutputDirectories(packageDirectory);

  for (const scriptName of buildScripts) {
    if (!hasScriptInputs(packageDirectory, packageJson.default.scripts[scriptName])) {
      console.warn(`Skipping ${packageJson.default.name} ${scriptName} (missing input file)`); // eslint-disable-line no-console
      continue;
    }

    console.log(`Running ${packageJson.default.name} ${scriptName}`); // eslint-disable-line no-console
    await runCommand('npm', ['run', scriptName], packageDirectory);
  }
}

/**
 * Returns monorepo package directories that can define build scripts.
 * @returns {string[]} Absolute package directories.
 */
function getPackageDirectories() {
  return [...getChildPackageDirectories('modules'), ...getChildPackageDirectories('apps')];
}

/**
 * Returns child directories that contain a package.json file.
 * @param {string} rootDirectoryName Workspace root directory name.
 * @returns {string[]} Absolute package directories.
 */
function getChildPackageDirectories(rootDirectoryName) {
  const rootDirectory = join(repositoryRoot, rootDirectoryName);
  if (!existsSync(rootDirectory)) {
    return [];
  }

  return readdirSync(rootDirectory, {withFileTypes: true})
    .filter(directoryEntry => directoryEntry.isDirectory())
    .map(directoryEntry => join(rootDirectory, directoryEntry.name))
    .filter(packageDirectory => existsSync(join(packageDirectory, 'package.json')));
}

/**
 * Selects scripts that generate worker or runtime library artifacts without running package bundles.
 * @param {Record<string, string>} scripts Package scripts.
 * @returns {string[]} Script names to run.
 */
function getWorkerBuildScripts(scripts) {
  if (moduleBundlesOnly) {
    return Object.keys(scripts).filter(scriptName => isModuleBundleBuildScript(scriptName, scripts));
  }

  const copyScripts = Object.keys(scripts).filter(scriptName => isCopyArtifactScript(scriptName, scripts));

  if (scripts['build-workers']) {
    return [...copyScripts, 'build-workers'];
  }

  const workerScripts = Object.keys(scripts).filter(scriptName => isWorkerBuildScript(scriptName, scripts));
  return [...copyScripts, ...deduplicateWorkerScriptsByOutput(workerScripts, scripts)];
}

/**
 * Returns whether a script builds an exported module-level worker bundle.
 * @param {string} scriptName Package script name.
 * @param {Record<string, string>} scripts Package scripts.
 * @returns {boolean} True if the script builds a module bundle artifact.
 */
function isModuleBundleBuildScript(scriptName, scripts) {
  return (
    (scriptName === 'build-combined-worker' ||
      scriptName === 'build-combined-worker-classic' ||
      scriptName === 'build-combined-worker-node') &&
    !scripts[scriptName].trim().startsWith('#')
  );
}

/**
 * Returns whether a script copies runtime artifacts needed by worker builds.
 * @param {string} scriptName Package script name.
 * @param {Record<string, string>} scripts Package scripts.
 * @returns {boolean} True if the script should be run.
 */
function isCopyArtifactScript(scriptName, scripts) {
  const scriptCommand = scripts[scriptName].trim();
  return (
    scriptName.startsWith('copy-') &&
    !scriptCommand.startsWith('#') &&
    (scriptCommand.includes('dist/libs') || scriptCommand.includes('.wasm'))
  );
}

/**
 * Returns whether a script builds a worker artifact.
 * @param {string} scriptName Package script name.
 * @param {Record<string, string>} scripts Package scripts.
 * @returns {boolean} True if the script should be run.
 */
function isWorkerBuildScript(scriptName, scripts) {
  return (
    scriptName.startsWith('build') &&
    scriptName.includes('worker') &&
    !scripts[scriptName].trim().startsWith('#')
  );
}

/**
 * Removes duplicate worker scripts that write the same output artifact.
 * @param {string[]} scriptNames Candidate script names.
 * @param {Record<string, string>} scripts Package scripts.
 * @returns {string[]} Deduplicated script names.
 */
function deduplicateWorkerScriptsByOutput(scriptNames, scripts) {
  const scriptNamesByOutput = new Map();

  for (const scriptName of scriptNames) {
    const outputPath = scripts[scriptName].match(/--outfile=([^\s]+)/)?.[1];
    if (outputPath && scriptNamesByOutput.has(outputPath)) {
      continue;
    }

    scriptNamesByOutput.set(outputPath || scriptName, scriptName);
  }

  return Array.from(scriptNamesByOutput.values());
}

/**
 * Returns whether any literal src/workers input files referenced by a script exist.
 * @param {string} packageDirectory Absolute package directory.
 * @param {string} scriptCommand Package script command.
 * @returns {boolean} True when the script has no literal worker input, or all inputs exist.
 */
function hasScriptInputs(packageDirectory, scriptCommand) {
  const workerInputPaths = scriptCommand.match(/src\/workers\/[^\s]+?\.(?:ts|js|cjs)/g) || [];
  return workerInputPaths.every(workerInputPath => existsSync(join(packageDirectory, workerInputPath)));
}

/**
 * Creates common dist directories used by copy scripts.
 * @param {string} packageDirectory Absolute package directory.
 * @returns {Promise<void>}
 */
async function prepareOutputDirectories(packageDirectory) {
  await mkdir(join(packageDirectory, 'dist', 'libs', 'laz-rs-wasm'), {recursive: true});
}

/**
 * Runs a command from a package directory.
 * @param {string} command Command executable.
 * @param {string[]} commandArguments Command arguments.
 * @param {string} workingDirectory Command working directory.
 * @returns {Promise<void>}
 */
async function runCommand(command, commandArguments, workingDirectory) {
  await new Promise((resolveCommand, rejectCommand) => {
    const childProcess = spawn(command, commandArguments, {cwd: workingDirectory, stdio: 'inherit'});

    childProcess.on('close', exitCode => {
      if (exitCode !== 0) {
        rejectCommand(new Error(`${command} ${commandArguments.join(' ')} failed with code ${exitCode}`));
        return;
      }

      resolveCommand();
    });
  });
}
