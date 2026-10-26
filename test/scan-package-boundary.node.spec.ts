// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';

import {build} from 'esbuild';
import {expect, test} from 'vitest';

const REPOSITORY_ROOT = process.cwd();
const MAXIMUM_SCAN_BUNDLE_BYTES = 310 * 1024;
const MAXIMUM_PREDICATE_ONLY_BUNDLE_BYTES = 40 * 1024;

test('implementations and tests do not import removed utility entrypoints', () => {
  const violations: string[] = [];
  const sourceDirectories = [
    path.join(REPOSITORY_ROOT, 'test'),
    ...listDirectories(path.join(REPOSITORY_ROOT, 'modules')).flatMap(directory => [
      path.join(directory, 'src'),
      path.join(directory, 'test')
    ])
  ];
  for (const sourceDirectory of sourceDirectories) {
    if (!fs.existsSync(sourceDirectory)) continue;
    for (const filename of listSourceFiles(sourceDirectory)) {
      const source = fs.readFileSync(filename, 'utf8');
      if (
        /['"]@loaders\.gl\/(?:scan|arrow-geometry|geoarrow)(?:\/[^'"]*)?['"]/.test(source) ||
        /['"]@loaders\.gl\/sql\/(?:arrow-query|table-query|sql-predicate(?:-zod)?)['"]/.test(source)
      ) {
        violations.push(path.relative(REPOSITORY_ROOT, filename));
      }
    }
  }
  expect(violations).toEqual([]);
});

test('scan and representative format packages remain tree-shakeable', () => {
  for (const moduleName of ['tables']) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(REPOSITORY_ROOT, 'modules', moduleName, 'package.json'), 'utf8')
    ) as {sideEffects?: unknown};
    expect(packageJson.sideEffects, `${moduleName} package sideEffects`).toBe(false);
  }
});

test('optional scan runtime stays within its v5 bundle budget', async () => {
  const result = await build({
    entryPoints: [path.join(REPOSITORY_ROOT, 'modules/core/scan-bundle.ts')],
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    treeShaking: true,
    write: false
  });
  const byteLength = result.outputFiles.reduce((sum, file) => sum + file.contents.byteLength, 0);
  expect(byteLength).toBeLessThanOrEqual(MAXIMUM_SCAN_BUNDLE_BYTES);
});

test('query-vocabulary-only imports shake out the Arrow executor', async () => {
  const result = await build({
    stdin: {
      contents: `import {parseSQLPredicate} from './modules/core/src/scan/index.ts';\nconsole.log(parseSQLPredicate('value >= 2'));`,
      resolveDir: REPOSITORY_ROOT,
      sourcefile: 'scan-predicate-only.ts'
    },
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    treeShaking: true,
    write: false
  });
  const byteLength = result.outputFiles.reduce((sum, file) => sum + file.contents.byteLength, 0);
  expect(byteLength).toBeLessThanOrEqual(MAXIMUM_PREDICATE_ONLY_BUNDLE_BYTES);
});

/** Lists immediate package directories in deterministic order. */
function listDirectories(directory: string): string[] {
  return fs
    .readdirSync(directory, {withFileTypes: true})
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(directory, entry.name))
    .sort();
}

/** Recursively lists source files that can contain ECMAScript imports. */
function listSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listSourceFiles(filename));
    else if (/\.(?:c|m)?(?:js|ts)x?$/.test(entry.name)) files.push(filename);
  }
  return files;
}
