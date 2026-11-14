// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import fs from 'node:fs';
import path from 'node:path';

import {build} from 'esbuild';
import {expect, test} from 'vitest';
import {preProcessFile} from 'typescript';

const REPOSITORY_ROOT = process.cwd();
// The eager bundle includes the upstream SQL predicate grammar and physical Arrow row gatherer.
const MAXIMUM_EAGER_SCAN_BUNDLE_BYTES = 324 * 1024;
const MAXIMUM_COMPLETE_SCAN_BUNDLE_BYTES = 390 * 1024;
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
      const imports = preProcessFile(source, true, true).importedFiles.map(file => file.fileName);
      if (
        imports.some(
          specifier =>
            /^@loaders\.gl\/(?:scan|arrow-geometry|geoarrow)(?:\/|$)/.test(specifier) ||
            /^@loaders\.gl\/sql\/(?:arrow-query|table-query|sql-predicate(?:-zod)?)$/.test(
              specifier
            )
        )
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

test('optional scan runtime budgets startup and lazy expression code separately', async () => {
  const entryPoint = path.join(REPOSITORY_ROOT, 'modules/core/scan-bundle.ts');
  const result = await build({
    entryPoints: [entryPoint],
    outdir: path.join(REPOSITORY_ROOT, 'dist/scan-bundle-budget'),
    bundle: true,
    splitting: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    treeShaking: true,
    metafile: true,
    write: false
  });
  const outputs = result.metafile.outputs;
  const entry = Object.keys(outputs).find(output =>
    outputs[output].entryPoint?.endsWith('scan-bundle.ts')
  )!;
  const eager = new Set([entry]);
  for (const output of eager) {
    for (const dependency of outputs[output].imports) {
      if (!dependency.external && dependency.kind === 'import-statement')
        eager.add(dependency.path);
    }
  }
  const eagerBytes = [...eager].reduce((sum, output) => sum + outputs[output].bytes, 0);
  const totalBytes = Object.values(outputs).reduce((sum, output) => sum + output.bytes, 0);
  const eagerInputs = [...eager].flatMap(output => Object.keys(outputs[output].inputs));
  expect(
    eagerInputs.some(input => input.includes('@math.gl/expressions/dist/arrow/compiler'))
  ).toBe(false);
  expect(eagerBytes).toBeLessThanOrEqual(MAXIMUM_EAGER_SCAN_BUNDLE_BYTES);
  expect(totalBytes).toBeLessThanOrEqual(MAXIMUM_COMPLETE_SCAN_BUNDLE_BYTES);
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

test.each([
  // The upstream structural parser includes SQL OFFSET, source-located diagnostics and explicit casts.
  ['parseSQLSelect', 14 * 1024],
  ['parseSQLQuery', 40 * 1024]
] as const)('%s imports shake out Arrow and stay within the parser budget', async (parser, maximumBytes) => {
  const result = await build({
    stdin: {
      contents: `import {${parser}} from './modules/core/src/scan/query.ts'; console.log(${parser}('SELECT *'));`,
      resolveDir: REPOSITORY_ROOT,
      sourcefile: 'sql-parser-only.ts'
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    treeShaking: true,
    write: false
  });
  const output = result.outputFiles.map(file => file.text).join('');
  expect(
    result.outputFiles.reduce((sum, file) => sum + file.contents.byteLength, 0)
  ).toBeLessThanOrEqual(maximumBytes);
  expect(output).not.toMatch(/RecordBatch|VectorLoader|ArrowTable/);
});

test('metadata-only catalog imports shake out Arrow execution', async () => {
  const result = await build({
    stdin: {
      contents: `import {createSQLCatalog} from './modules/core/src/scan/query.ts'; console.log(createSQLCatalog([]).getSources());`,
      resolveDir: REPOSITORY_ROOT,
      sourcefile: 'sql-catalog-only.ts'
    },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    minify: true,
    treeShaking: true,
    write: false
  });
  expect(result.outputFiles.map(file => file.text).join('')).not.toMatch(
    /RecordBatch|VectorLoader|ArrowTable/
  );
});
