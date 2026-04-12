#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const MIGRATED_VITEST_DIRECTORIES = [
  'modules/core/test',
  'modules/images/test',
  'modules/loader-utils/test',
  'modules/polyfills/test'
];

const GUARDRAILS = [
  {
    name: 'done-callback',
    description: 'Use async/await or promise expectations instead of done callbacks in native Vitest tests.',
    pattern: /\b(?:done\s*=>|\(\s*done\s*\)\s*=>|function\s*\(\s*done\s*[,\)])/
  },
  {
    name: 'raw-sleep',
    description:
      'Use fake-timer helpers or waitForCondition instead of sleep()/delay() or new Promise(resolve => setTimeout(...)).',
    pattern:
      /\bsleep\s*\(|\bdelay\s*\(|new Promise(?:<[^>]+>)?\s*\(\s*(?:\(\s*)?resolve\s*(?:\s*\))?\s*=>\s*setTimeout\b/
  },
  {
    name: 'expect-assertions',
    description:
      'Avoid expect.assertions()/expect.hasAssertions() except in explicit allowlisted fan-out tests.',
    pattern: /expect\.(?:assertions|hasAssertions)\s*\(/
  },
  {
    name: 'runtime-isBrowser-branch',
    description:
      'Use registration-time gating such as test.runIf()/test.skipIf() or environment-specific file names instead of if (isBrowser) inside native Vitest files.',
    pattern: /if\s*\(\s*!?isBrowser\s*\)/
  }
];

const repositoryRoot = process.cwd();
const targetFiles = listMigratedVitestFiles();
const violations = [];

for (const relativeFilePath of targetFiles) {
  const absoluteFilePath = path.resolve(repositoryRoot, relativeFilePath);
  const sourceText = fs.readFileSync(absoluteFilePath, 'utf8');
  const strippedSourceText = stripComments(sourceText);

  for (const guardrail of GUARDRAILS) {
    const match = strippedSourceText.match(guardrail.pattern);
    if (!match || match.index === undefined) {
      continue;
    }

    violations.push({
      filePath: relativeFilePath,
      line: getLineNumber(strippedSourceText, match.index),
      guardrail
    });
  }
}

if (violations.length > 0) {
  console.error('Vitest async guardrail violations found:\n');

  for (const violation of violations) {
    console.error(
      `${violation.filePath}:${violation.line} [${violation.guardrail.name}] ${violation.guardrail.description}`
    );
  }

  process.exit(1);
}

/**
 * Lists native Vitest test files inside the migrated batches.
 * @returns {string[]}
 */
function listMigratedVitestFiles() {
  const rgArguments = [
    '-l',
    "from ['\"]vitest['\"]",
    ...MIGRATED_VITEST_DIRECTORIES,
    "-g*spec*",
    "-g*.test.*"
  ];
  const stdout = execFileSync('rg', rgArguments, {cwd: repositoryRoot, encoding: 'utf8'});
  return stdout.split(/\r?\n/).filter(Boolean);
}

/**
 * Removes line and block comments to reduce false positives in the regex-based guardrails.
 * @param {string} sourceText
 * @returns {string}
 */
function stripComments(sourceText) {
  return sourceText
    .replace(/\/\*[\s\S]*?\*\//g, blockComment => preserveNewlines(blockComment))
    .replace(/(^|[^:])\/\/.*$/gm, (lineComment, prefix) => `${prefix}${preserveNewlines(lineComment.slice(prefix.length))}`);
}

/**
 * Replaces all non-newline characters in a string with spaces so line offsets remain stable.
 * @param {string} text
 * @returns {string}
 */
function preserveNewlines(text) {
  return text.replace(/[^\n]/g, ' ');
}

/**
 * Returns the 1-based line number for a character offset.
 * @param {string} sourceText
 * @param {number} index
 * @returns {number}
 */
function getLineNumber(sourceText, index) {
  return sourceText.slice(0, index).split('\n').length;
}
