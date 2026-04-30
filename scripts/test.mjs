#!/usr/bin/env node

import {spawn} from 'node:child_process';

const args = process.argv.slice(2);
const mode = args[0];
const passthroughArgs = args.slice(1);

const VITEST_CONFIG = 'vitest.config.ts';

const modeArguments = {
  node: ['run', '--config', VITEST_CONFIG, '--project', 'node'],
  browser: ['run', '--config', VITEST_CONFIG, '--project', 'browser'],
  'browser-headless': ['run', '--config', VITEST_CONFIG, '--project', 'headless'],
  full: ['run', '--config', VITEST_CONFIG, '--project', 'node', '--project', 'headless'],
  'cover-node': [
    'run',
    '--config',
    VITEST_CONFIG,
    '--coverage',
    '--testTimeout',
    '60000',
    '--project',
    'node'
  ],
  'cover-headless': [
    'run',
    '--config',
    VITEST_CONFIG,
    '--coverage',
    '--testTimeout',
    '60000',
    '--project',
    'headless'
  ],
  cover: [
    'run',
    '--config',
    VITEST_CONFIG,
    '--coverage',
    '--testTimeout',
    '60000',
    '--project',
    'node',
    '--project',
    'headless'
  ]
};

if (mode === 'bench') {
  const benchLoaderRegistration =
    'data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register("@loaders.gl/devtools-extensions/bench-loader", pathToFileURL("./"));';
  process.exitCode = await runProcess(
    'node',
    ['--import', benchLoaderRegistration, './test/bench/node.js', ...passthroughArgs]
  );
  process.exit(process.exitCode ?? 1);
}

if (mode === 'bench-browser') {
  process.exitCode = await runProcess('node', ['./scripts/run-browser-bench.mjs', ...passthroughArgs]);
  process.exit(process.exitCode ?? 1);
}

if (mode === 'bench-headless') {
  process.exitCode = await runProcess(
    'node',
    ['./scripts/run-browser-bench.mjs', '--headless', ...passthroughArgs]
  );
  process.exit(process.exitCode ?? 1);
}

if (!mode) {
  printUsage();
  process.exit(0);
}

const vitestArguments = modeArguments[mode];

if (!vitestArguments) {
  printUsage();
  process.exit(1);
}

process.exitCode = await runProcess('vitest', [...vitestArguments, ...passthroughArgs]);

/**
 * Prints supported test runner modes.
 */
function printUsage() {
  console.log(`loaders.gl test runner

Usage:
  yarn test <mode> [options]

Modes:
  bench            Run the repo benchmark suite in Node.js
  bench-browser    Run the repo benchmark suite in a headed browser
  bench-headless   Run the repo benchmark suite in a headless browser
  full             Run Node-only tests, then browser tests in headless mode
  node             Run Node-only tests
  browser          Run browser tests in a headed browser
  browser-headless Run browser tests in a headless browser
  cover-node       Run Node-only tests with coverage
  cover-headless   Run headless browser tests with coverage
  cover            Run Node-only and headless browser tests with coverage
`);
}

/**
 * Runs a child process and forwards stdio.
 * @param {string} command Command to run.
 * @param {string[]} commandArguments Command arguments.
 * @returns {Promise<number>} Process exit code.
 */
function runProcess(command, commandArguments) {
  return new Promise(resolveExitCode => {
    const childProcess = spawn(command, commandArguments, {
      cwd: process.cwd(),
      env: {...process.env, NODE_ENV: 'test'},
      shell: process.platform === 'win32',
      stdio: 'inherit'
    });

    childProcess.on('exit', exitCode => resolveExitCode(exitCode ?? 1));
    childProcess.on('error', error => {
      console.error(error);
      resolveExitCode(1);
    });
  });
}
