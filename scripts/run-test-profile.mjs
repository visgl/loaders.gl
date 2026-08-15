#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {spawn} from 'node:child_process';
import path from 'node:path';

const arguments_ = process.argv.slice(2);
const mode = arguments_[0] || 'headless';
const passthroughArguments = arguments_.slice(1);
const outputFile = path.resolve(
  process.env.LOADERS_GL_TEST_PROFILE_OUTPUT || `test-results/test-profile-${mode}.json`
);

const scriptNames = {
  browser: 'test-browser',
  'browser-headless': 'test-headless',
  external: 'test-external',
  headless: 'test-headless',
  node: 'test-node',
  slow: 'test-slow'
};
const scriptName = scriptNames[mode];
if (!scriptName) {
  throw new Error(`Unknown profile mode: ${mode}`);
}

const exitCode = await runProcess('yarn', [
  scriptName,
  '--reporter=default',
  '--reporter=./scripts/test-profile-reporter.mjs',
  ...passthroughArguments
]);

process.exitCode = exitCode;

/** Runs the profiled test process and forwards its output. */
function runProcess(command, commandArguments) {
  return new Promise(resolveExitCode => {
    const childProcess = spawn(command, commandArguments, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        LOADERS_GL_TEST_PROFILE_OUTPUT: outputFile,
        NODE_ENV: 'test'
      },
      shell: process.platform === 'win32',
      stdio: 'inherit'
    });

    childProcess.on('exit', processExitCode => resolveExitCode(processExitCode ?? 1));
    childProcess.on('error', error => {
      console.error(error);
      resolveExitCode(1);
    });
  });
}
