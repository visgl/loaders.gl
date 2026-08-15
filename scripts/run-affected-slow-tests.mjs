#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {spawn, spawnSync} from 'node:child_process';

const arguments_ = process.argv.slice(2);
const coverage = arguments_.includes('--coverage');
const runAll =
  arguments_.includes('--all') ||
  process.env.GITHUB_EVENT_NAME === 'push' ||
  process.env.GITHUB_EVENT_NAME === 'schedule' ||
  process.env.GITHUB_EVENT_NAME === 'workflow_dispatch';
const baseReference = getArgumentValue('--base') || process.env.GITHUB_BASE_REF || 'master';
const testArguments = getTestArguments();
const testFilters = runAll ? null : findAffectedModuleFilters(baseReference);

if (testFilters?.length === 0) {
  console.log('No published module changes require slow tests.');
  process.exit(0);
}

const testCommand = coverage ? 'test-slow-cover' : 'test-slow';
process.exitCode = await runProcess('yarn', [
  testCommand,
  ...(testFilters || []),
  ...testArguments
]);

/** Returns a named command-line argument value. */
function getArgumentValue(argumentName) {
  const argumentIndex = arguments_.indexOf(argumentName);
  return argumentIndex >= 0 ? arguments_[argumentIndex + 1] : undefined;
}

/** Returns arguments intended for Vitest rather than this affected-test wrapper. */
function getTestArguments() {
  const testArguments_ = [];
  for (let argumentIndex = 0; argumentIndex < arguments_.length; argumentIndex++) {
    const argument = arguments_[argumentIndex];
    if (argument === '--coverage' || argument === '--all') {
      continue;
    }
    if (argument === '--base') {
      argumentIndex++;
      continue;
    }
    testArguments_.push(argument);
  }
  return testArguments_;
}

/** Returns module directory filters affected by a Git diff, or null for shared changes. */
function findAffectedModuleFilters(baseReference_) {
  const resolvedBaseReference = resolveBaseReference(baseReference_);
  const diffResult = spawnSync('git', ['diff', '--name-only', `${resolvedBaseReference}...HEAD`], {
    cwd: process.cwd(),
    encoding: 'utf8'
  });
  if (diffResult.status !== 0) {
    throw new Error(diffResult.stderr || `Unable to compare against ${baseReference_}`);
  }

  const changedFiles = diffResult.stdout.split(/\r?\n/).filter(Boolean);
  const sharedChangePatterns = [
    /^\.ocularrc\.js$/,
    /^package\.json$/,
    /^yarn\.lock$/,
    /^vitest\.config\.[cm]?[jt]s$/,
    /^test\//,
    /^scripts\/(?:audit-tests|check-coverage|run-affected-slow-tests)/,
    /^modules\/(?:core|loader-utils|worker-utils)\/src\//
  ];
  if (changedFiles.some(changedFile => sharedChangePatterns.some(pattern => pattern.test(changedFile)))) {
    return null;
  }

  const affectedModules = new Set();
  for (const changedFile of changedFiles) {
    const match = changedFile.match(/^modules\/([^/]+)\//);
    if (match) {
      affectedModules.add(`modules/${match[1]}`);
    }
  }
  return [...affectedModules].sort();
}

/** Resolves a branch name to its fetched remote ref when available. */
function resolveBaseReference(baseReference_) {
  const candidates = baseReference_.startsWith('origin/')
    ? [baseReference_]
    : [`origin/${baseReference_}`, baseReference_];

  for (const candidate of candidates) {
    const verifyResult = spawnSync('git', ['rev-parse', '--verify', `${candidate}^{commit}`], {
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    if (verifyResult.status === 0) {
      return candidate;
    }
  }

  throw new Error(`Unable to resolve slow-test base reference ${baseReference_}`);
}

/** Runs the affected slow test process and forwards its output. */
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
