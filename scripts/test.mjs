#!/usr/bin/env node

import {spawn} from 'node:child_process';

const args = process.argv.slice(2);
const mode = args[0] || 'full';
const passthroughArgs = args.slice(1);

const VITEST_CONFIG = 'vitest.config.ts';

const modeArguments = {
  node: ['run', '--config', VITEST_CONFIG, '--project', 'node'],
  browser: ['run', '--config', VITEST_CONFIG, '--project', 'browser'],
  'browser-headless': ['run', '--config', VITEST_CONFIG, '--project', 'headless'],
  full: ['run', '--config', VITEST_CONFIG, '--project', 'node', '--project', 'headless'],
  cover: [
    'run',
    '--config',
    VITEST_CONFIG,
    '--coverage',
    '--project',
    'node',
    '--project',
    'headless'
  ]
};

if (mode === 'bench' || mode === 'bench-browser') {
  console.error(
    `The legacy ${mode} runner was not migrated to Vitest. Use the benchmark entrypoints directly.`
  );
  process.exit(1);
}

const vitestArguments = modeArguments[mode];

if (!vitestArguments) {
  printUsage();
  process.exit(mode ? 1 : 0);
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
  full             Run Node-only tests, then browser tests in headless mode
  node             Run Node-only tests
  browser          Run browser tests in a headed browser
  browser-headless Run browser tests in a headless browser
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
