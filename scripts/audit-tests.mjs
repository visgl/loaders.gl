#!/usr/bin/env node

// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repositoryRoot = process.cwd();
const testRoots = ['modules', 'test'];
const tapeAllowlistPath = path.resolve('test/tape-allowlist.txt');
const largeFixtureAllowlistPath = path.resolve('test/large-fixture-allowlist.txt');
const coverageExclusionsPath = path.resolve('test/coverage-exclusions.json');
const outputPath = path.resolve('test-results/test-audit.json');
const updateAllowlists = process.argv.includes('--update-allowlists');
const testFiles = testRoots
  .flatMap(testRoot => walkFiles(path.resolve(testRoot)))
  .filter(isTestFile)
  .map(toRepositoryPath)
  .sort();
const fastTestFiles = testFiles.filter(
  testFile => !testFile.includes('.slow.spec.') && !testFile.includes('.external.spec.')
);
const tapeFiles = testFiles.filter(testFile => {
  const source = fs.readFileSync(testFile, 'utf8');
  return /from\s+['"](?:tape|tape-promise\/tape)['"]/.test(source);
});
const largeFixtureReferences = findLargeFixtureReferences(fastTestFiles);

if (updateAllowlists) {
  writeAllowlist(tapeAllowlistPath, tapeFiles);
  writeAllowlist(largeFixtureAllowlistPath, largeFixtureReferences);
}

const tapeAllowlist = readAllowlist(tapeAllowlistPath);
const largeFixtureAllowlist = readAllowlist(largeFixtureAllowlistPath);
const emptyTestFiles = testFiles.filter(testFile => !containsTestRegistration(testFile));
const remoteFetches = findRemoteFetches(fastTestFiles);
const coverageExclusionViolations = auditCoverageExclusions();
const violations = [
  ...findAllowlistViolations('Tape import', tapeFiles, tapeAllowlist),
  ...findStaleAllowlistEntries('Tape allowlist', tapeFiles, tapeAllowlist),
  ...emptyTestFiles.map(testFile => `Empty test file: ${testFile}`),
  ...remoteFetches.map(remoteFetch => `Remote fetch in hermetic test: ${remoteFetch}`),
  ...findAllowlistViolations(
    'Large fixture reference',
    largeFixtureReferences,
    largeFixtureAllowlist
  ),
  ...findStaleAllowlistEntries(
    'Large fixture allowlist',
    largeFixtureReferences,
    largeFixtureAllowlist
  ),
  ...findMissingAllowlistExplanations(largeFixtureAllowlistPath),
  ...coverageExclusionViolations
];
const report = {
  generatedAt: new Date().toISOString(),
  counts: {
    testFiles: testFiles.length,
    fastTestFiles: fastTestFiles.length,
    tapeFiles: tapeFiles.length,
    nativeVitestFiles: testFiles.filter(testFile => {
      const source = fs.readFileSync(testFile, 'utf8');
      return /from\s+['"]vitest['"]/.test(source);
    }).length,
    skippedRegistrations: testFiles.reduce((count, testFile) => {
      const source = fs.readFileSync(testFile, 'utf8');
      return count + (source.match(/\b(?:test|it|describe)\.skip\s*\(/g)?.length || 0);
    }, 0),
    emptyTestFiles: emptyTestFiles.length,
    remoteFetches: remoteFetches.length,
    largeFixtureReferences: largeFixtureReferences.length
  },
  tapeFiles,
  emptyTestFiles,
  remoteFetches,
  largeFixtureReferences,
  exactDuplicateGroups: findExactDuplicateGroups(testFiles),
  violations
};

fs.mkdirSync(path.dirname(outputPath), {recursive: true});
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  `Test audit: ${report.counts.testFiles} files, ${report.counts.tapeFiles} Tape, ` +
    `${report.counts.skippedRegistrations} skipped, ${violations.length} violations`
);
console.log(`Test audit report written to ${path.relative(repositoryRoot, outputPath)}`);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
}

/** Verifies that every production coverage exclusion has one reviewed adjacent reason. */
function auditCoverageExclusions() {
  const coverageConfig = JSON.parse(fs.readFileSync(path.resolve('.nycrc'), 'utf8'));
  const exclusionReasons = JSON.parse(fs.readFileSync(coverageExclusionsPath, 'utf8'));
  const exclusions = [...new Set(coverageConfig.exclude || [])];
  const violations_ = [];

  for (const exclusion of exclusions) {
    if (!exclusionReasons[exclusion]?.trim()) {
      violations_.push(`Coverage exclusion has no reviewed reason: ${exclusion}`);
    }
  }
  for (const exclusion of Object.keys(exclusionReasons)) {
    if (!exclusions.includes(exclusion)) {
      violations_.push(`Coverage exclusion reason is stale: ${exclusion}`);
    }
  }
  return violations_;
}

/** Recursively returns all files below a directory. */
function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const directoryEntry of fs.readdirSync(directory, {withFileTypes: true})) {
    const entryPath = path.join(directory, directoryEntry.name);
    if (directoryEntry.isDirectory()) {
      if (directoryEntry.name !== 'node_modules' && directoryEntry.name !== 'dist') {
        files.push(...walkFiles(entryPath));
      }
    } else if (directoryEntry.isFile()) {
      files.push(entryPath);
    }
  }
  return files;
}

/** Returns true when a path follows the repository test filename convention. */
function isTestFile(filePath) {
  return /\.(?:spec|test)\.[cm]?[jt]sx?$/.test(filePath);
}

/** Converts an absolute path to a portable repository-relative path. */
function toRepositoryPath(filePath) {
  return path.relative(repositoryRoot, filePath).replaceAll(path.sep, '/');
}

/** Returns true when a test file registers at least one test or suite. */
function containsTestRegistration(testFile) {
  const source = fs.readFileSync(testFile, 'utf8');
  const scriptKind = testFile.endsWith('.tsx') || testFile.endsWith('.jsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(
    testFile,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );
  let hasRegistration = false;

  const visit = node => {
    if (ts.isCallExpression(node) && isTestRegistrationExpression(node.expression)) {
      hasRegistration = true;
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return hasRegistration || /import\s+['"][^'"]+\.spec['"]/.test(source);
}

/** Returns true when a call expression is rooted in a Vitest or Tape registration function. */
function isTestRegistrationExpression(expression) {
  let rootExpression = expression;
  while (ts.isCallExpression(rootExpression) || ts.isPropertyAccessExpression(rootExpression)) {
    rootExpression = rootExpression.expression;
  }
  return (
    ts.isIdentifier(rootExpression) &&
    ['test', 'it', 'describe', 'suite'].includes(rootExpression.text)
  );
}

/** Finds literal remote fetch calls in hermetic test files. */
function findRemoteFetches(files) {
  const remoteFetches = [];
  const remoteFetchPattern = /\b(?:fetch|fetchFile)\s*\(\s*(['"`])https?:\/\/[^'"`]+\1/g;

  for (const testFile of files) {
    const source = fs.readFileSync(testFile, 'utf8');
    for (const match of source.matchAll(remoteFetchPattern)) {
      remoteFetches.push(`${testFile}:${source.slice(0, match.index).split('\n').length}`);
    }
  }
  return remoteFetches;
}

/** Finds fast tests that reference fixture files larger than one MiB. */
function findLargeFixtureReferences(files) {
  const largeFixtures = walkFiles(path.resolve('modules'))
    .filter(filePath => filePath.includes(`${path.sep}test${path.sep}data${path.sep}`))
    .filter(filePath => fs.statSync(filePath).size > 1024 * 1024)
    .map(toRepositoryPath);
  const references = [];

  for (const testFile of files) {
    const source = fs.readFileSync(testFile, 'utf8');
    for (const fixturePath of largeFixtures) {
      const fixtureUrl = fixturePath.replace(/^modules\//, '@loaders.gl/');
      const fixturePathWithinModule = fixturePath.replace(/^modules\/[^/]+\//, '');
      if (source.includes(fixtureUrl) || source.includes(fixturePathWithinModule)) {
        references.push(`${testFile}::${fixturePath}`);
      }
    }
  }
  return references.sort();
}

/** Reads a newline-delimited allowlist. */
function readAllowlist(allowlistPath) {
  if (!fs.existsSync(allowlistPath)) {
    return [];
  }
  return fs
    .readFileSync(allowlistPath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split(/\s+#\s+/, 1)[0]);
}

/** Writes a sorted newline-delimited allowlist generated from the current baseline. */
function writeAllowlist(allowlistPath, entries) {
  const header =
    '# Generated baseline. Remove entries as tests migrate; additions require explicit review.\n';
  const existingExplanations = readAllowlistExplanations(allowlistPath);
  const lines = [...entries].sort().map(entry => {
    if (allowlistPath !== largeFixtureAllowlistPath) {
      return entry;
    }
    const explanation = existingExplanations.get(entry) || 'EXPLANATION REQUIRED';
    return `${entry} # ${explanation}`;
  });
  fs.writeFileSync(allowlistPath, lines.length > 0 ? `${header}${lines.join('\n')}\n` : header);
}

/** Returns fixture allowlist entries that lack a reviewed inline explanation. */
function findMissingAllowlistExplanations(allowlistPath) {
  const explanations = readAllowlistExplanations(allowlistPath);
  return readAllowlist(allowlistPath)
    .filter(entry => !explanations.get(entry) || explanations.get(entry) === 'EXPLANATION REQUIRED')
    .map(entry => `Large fixture allowlist entry has no explanation: ${entry}`);
}

/** Reads inline `# reason` text keyed by an allowlist entry. */
function readAllowlistExplanations(allowlistPath) {
  const explanations = new Map();
  if (!fs.existsSync(allowlistPath)) {
    return explanations;
  }
  for (const rawLine of fs.readFileSync(allowlistPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const match = line.match(/^(.*?)\s+#\s+(.+)$/);
    if (match) {
      explanations.set(match[1], match[2].trim());
    }
  }
  return explanations;
}

/** Finds current entries that are not permitted by an allowlist. */
function findAllowlistViolations(label, currentEntries, allowedEntries) {
  const allowedEntrySet = new Set(allowedEntries);
  return currentEntries
    .filter(currentEntry => !allowedEntrySet.has(currentEntry))
    .map(currentEntry => `${label} is not allowlisted: ${currentEntry}`);
}

/** Finds allowlist entries that no longer describe the current suite. */
function findStaleAllowlistEntries(label, currentEntries, allowedEntries) {
  const currentEntrySet = new Set(currentEntries);
  return allowedEntries
    .filter(allowedEntry => !currentEntrySet.has(allowedEntry))
    .map(allowedEntry => `${label} entry is stale and must be removed: ${allowedEntry}`);
}

/** Finds groups of test files with identical normalized source. */
function findExactDuplicateGroups(files) {
  const filesByHash = new Map();
  for (const testFile of files) {
    const source = fs
      .readFileSync(testFile, 'utf8')
      .replace(/\/\/.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    const sourceHash = crypto.createHash('sha256').update(source).digest('hex');
    const matchingFiles = filesByHash.get(sourceHash) || [];
    matchingFiles.push(testFile);
    filesByHash.set(sourceHash, matchingFiles);
  }
  return [...filesByHash.values()].filter(files => files.length > 1);
}
