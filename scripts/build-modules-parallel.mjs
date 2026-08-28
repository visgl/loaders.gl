#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const MAXIMUM_BUILD_CONCURRENCY = 4;
const QUIET_BUILD =
  process.env.LOADERS_GL_BUILD_QUIET === '1' || process.env.CI === 'true';
const modulesDirectory = path.resolve('modules');
const typeScriptCompilerPath = path.resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'tspc.cmd' : 'tspc'
);
const lernaPath = path.resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'lerna.cmd' : 'lerna'
);
const ocularCleanPath = path.resolve(
  'node_modules/.bin',
  process.platform === 'win32' ? 'ocular-clean.cmd' : 'ocular-clean'
);
const commonJsBuildPath = path.resolve('node_modules/@vis.gl/dev-tools/dist/build-cjs.js');
const modules = discoverModules();
const buildLevels = createBuildLevels(modules);
const buildConcurrency = getBuildConcurrency();

await runCommand(ocularCleanPath, [], process.cwd());

console.log(
  `Building ${modules.size} modules in ${buildLevels.length} dependency levels ` +
    `with up to ${buildConcurrency} concurrent builds.`
);

for (const [levelIndex, moduleNames] of buildLevels.entries()) {
  if (!QUIET_BUILD) {
    console.log(
      `Building dependency level ${levelIndex + 1}/${buildLevels.length}: ${moduleNames.join(', ')}`
    );
  }
  await runModuleBuilds(moduleNames, buildConcurrency);
}

await runCommand(lernaPath, ['run', 'pre-build'], process.cwd());

if (QUIET_BUILD) {
  console.log(`Built ${modules.size} modules and package assets successfully.`);
}

/** Discovers TypeScript module projects and their intra-repository dependencies. */
function discoverModules() {
  const discoveredModules = new Map();

  for (const directoryEntry of fs.readdirSync(modulesDirectory, {withFileTypes: true})) {
    if (!directoryEntry.isDirectory()) {
      continue;
    }

    const moduleDirectory = path.join(modulesDirectory, directoryEntry.name);
    const packagePath = path.join(moduleDirectory, 'package.json');
    const tsconfigPath = path.join(moduleDirectory, 'tsconfig.json');
    if (!fs.existsSync(packagePath)) {
      continue;
    }
    if (!fs.existsSync(tsconfigPath)) {
      throw new Error(
        `Published module has no tsconfig.json: ${path.relative(process.cwd(), moduleDirectory)}`
      );
    }

    const parsedConfig = ts.parseConfigFileTextToJson(
      tsconfigPath,
      fs.readFileSync(tsconfigPath, 'utf8')
    );
    if (parsedConfig.error) {
      throw new Error(ts.flattenDiagnosticMessageText(parsedConfig.error.messageText, '\n'));
    }

    const dependencyDirectories = (parsedConfig.config.references || []).map(reference =>
      path.resolve(moduleDirectory, reference.path)
    );
    discoveredModules.set(moduleDirectory, {
      name: directoryEntry.name,
      dependencyDirectories
    });
  }

  return discoveredModules;
}

/** Groups modules into dependency-safe parallel build levels. */
function createBuildLevels(discoveredModules) {
  const resolvedLevels = new Map();
  const resolvingModules = new Set();

  /** Resolves the dependency level for one module. */
  function resolveBuildLevel(moduleDirectory) {
    const resolvedLevel = resolvedLevels.get(moduleDirectory);
    if (resolvedLevel !== undefined) {
      return resolvedLevel;
    }
    if (resolvingModules.has(moduleDirectory)) {
      throw new Error(`Circular TypeScript project references include ${moduleDirectory}`);
    }

    const moduleDefinition = discoveredModules.get(moduleDirectory);
    if (!moduleDefinition) {
      throw new Error(`TypeScript project reference is not a module: ${moduleDirectory}`);
    }

    resolvingModules.add(moduleDirectory);
    const dependencyLevels = moduleDefinition.dependencyDirectories.map(resolveBuildLevel);
    resolvingModules.delete(moduleDirectory);

    const level = dependencyLevels.length > 0 ? Math.max(...dependencyLevels) + 1 : 0;
    resolvedLevels.set(moduleDirectory, level);
    return level;
  }

  for (const moduleDirectory of discoveredModules.keys()) {
    resolveBuildLevel(moduleDirectory);
  }

  const levels = [];
  for (const [moduleDirectory, level] of resolvedLevels) {
    levels[level] ||= [];
    levels[level].push(discoveredModules.get(moduleDirectory).name);
  }
  return levels.map(moduleNames => moduleNames.sort());
}

/** Returns the requested build concurrency, capped for predictable CI memory use. */
function getBuildConcurrency() {
  const requestedConcurrency = process.env.LOADERS_GL_BUILD_CONCURRENCY
    ? Number.parseInt(process.env.LOADERS_GL_BUILD_CONCURRENCY, 10)
    : os.availableParallelism();
  if (!Number.isInteger(requestedConcurrency) || requestedConcurrency < 1) {
    throw new Error('LOADERS_GL_BUILD_CONCURRENCY must be a positive integer.');
  }
  return Math.min(requestedConcurrency, MAXIMUM_BUILD_CONCURRENCY);
}

/** Builds a dependency level with bounded concurrency. */
async function runModuleBuilds(moduleNames, concurrency) {
  let nextModuleIndex = 0;
  let buildFailure;

  /** Runs module builds until the queue is exhausted or a build fails. */
  async function runBuildWorker() {
    while (nextModuleIndex < moduleNames.length && !buildFailure) {
      const moduleName = moduleNames[nextModuleIndex++];
      try {
        await runModuleBuild(moduleName);
      } catch (error) {
        buildFailure = error;
      }
    }
  }

  const workerCount = Math.min(concurrency, moduleNames.length);
  await Promise.all(Array.from({length: workerCount}, () => runBuildWorker()));
  if (buildFailure) {
    throw buildFailure;
  }
}

/** Runs the TypeScript and CommonJS build steps for one module. */
async function runModuleBuild(moduleName) {
  const moduleDirectory = path.join(modulesDirectory, moduleName);
  if (!QUIET_BUILD) {
    console.log(`Building modules/${moduleName}`);
  }
  await runCommand(
    typeScriptCompilerPath,
    [
      '--declaration',
      '--declarationMap',
      '--sourceMap',
      '--outDir',
      'dist',
      '--project',
      'tsconfig.json'
    ],
    moduleDirectory
  );
  await runCommand(process.execPath, [commonJsBuildPath], moduleDirectory);
}

/** Runs one child command and rejects when it fails. */
function runCommand(command, commandArguments, workingDirectory) {
  return new Promise((resolve, reject) => {
    let output = '';
    const childProcess = spawn(command, commandArguments, {
      cwd: workingDirectory,
      env: process.env,
      shell: process.platform === 'win32',
      stdio: QUIET_BUILD ? ['ignore', 'pipe', 'pipe'] : 'inherit'
    });

    if (QUIET_BUILD) {
      childProcess.stdout.on('data', chunk => {
        output += chunk;
      });
      childProcess.stderr.on('data', chunk => {
        output += chunk;
      });
    }

    childProcess.on('exit', (exitCode, signal) => {
      if (exitCode === 0) {
        resolve();
        return;
      }
      if (output) {
        process.stderr.write(output);
      }
      reject(
        new Error(
          `${path.basename(command)} failed in ${path.relative(process.cwd(), workingDirectory) || '.'} ` +
            `(exit ${exitCode ?? 'unknown'}, signal ${signal ?? 'none'})`
        )
      );
    });
    childProcess.on('error', reject);
  });
}
