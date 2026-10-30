// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

const requireModule = createRequire(import.meta.url);

// Exercise installed CommonJS exports in a fresh process so cache inspection is meaningful.
test('published documents root stays lightweight in CommonJS', () => {
  const output = execFileSync(
    process.execPath,
    [
      '-e',
      `
    const documents = require('@loaders.gl/documents');
    console.log(JSON.stringify({exports: Object.keys(documents), files: Object.keys(require.cache)}));
  `
    ],
    {encoding: 'utf8'}
  );
  const result = JSON.parse(output);
  expect(result.exports).toEqual(
    expect.arrayContaining([
      'XMLLoader',
      'HTMLLoader',
      'YAMLLoader',
      'TOMLLoader',
      'BSONLoader',
      'MarkdownLoader'
    ])
  );
  expect(result.exports).not.toContain('BSONWriter');
  expect(result.exports.some((name: string) => name.endsWith('WithParser'))).toBe(false);
  expect(
    result.files.filter((filename: string) =>
      /fast-xml-parser|bson-codec|bson-writer|parse-markdown|parse-yaml|parse-toml|sax\.cjs/.test(
        filename
      )
    )
  ).toEqual([]);
  const rootBundle = requireModule('node:fs').readFileSync(
    requireModule.resolve('@loaders.gl/documents'),
    'utf8'
  );
  expect(rootBundle).not.toMatch(
    /function (parseXMLSync|parseMarkdownSync|encodeBSONSync|parseYAMLSync|parseTOMLSync)/
  );
});

test.each([
  'JSON',
  'XML',
  'HTML',
  'YAML',
  'TOML',
  'BSON',
  'Markdown'
])('published %s metadata preloads a flat parser entry', async format => {
  const documents = requireModule('@loaders.gl/documents');
  const loader = documents[format + 'Loader'];
  expect(loader.module).toBe('documents');
  expect(loader.parse).toBeUndefined();
  expect(loader.parseTextSync).toBeUndefined();
  const parser = await loader.preload();
  expect(parser.id).toBe(loader.id);
  expect(parser.parse).toBeTypeOf('function');
  const direct = requireModule('@loaders.gl/documents/' + format.toLowerCase() + '-loader');
  expect(direct[format + 'LoaderWithParser'].id).toBe(loader.id);
});

test('documents ESM metadata graph excludes parser implementations', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/documents/src/index.ts'],
    bundle: true,
    packages: 'external',
    tsconfigRaw: {},
    format: 'esm',
    platform: 'browser',
    write: false,
    metafile: true
  });
  expect(
    Object.keys(result.metafile!.inputs).filter(filename =>
      /\/lib\/|\/sax-ts\/|bson-writer/.test(filename)
    )
  ).toEqual([]);
});

test('tables no longer forwards BSON document exports', async () => {
  const {readFileSync} = await import('node:fs');
  const manifest = JSON.parse(readFileSync('modules/tables/package.json', 'utf8'));
  expect(Object.keys(manifest.exports).filter(entry => entry.startsWith('./bson'))).toEqual([]);
  expect(readFileSync('modules/tables/src/index.ts', 'utf8')).not.toMatch(/BSON|documents\/src/);
});
