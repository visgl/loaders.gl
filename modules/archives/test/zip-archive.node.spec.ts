// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {expect, test} from 'vitest';

/** Node package consumers can load the installed ESM and CommonJS roots. */
test('installed ESM/CJS ZIP entrypoints expose portable reading and writing', async () => {
  const require = createRequire(import.meta.url);
  const entrypointUrl = new URL(
    './index.js',
    pathToFileURL(require.resolve('@loaders.gl/archives/zip'))
  );
  const modules = [await import(entrypointUrl.href), require('@loaders.gl/archives/zip')];
  const bytes = new Uint8Array(readFileSync(new URL('./fixtures/python.zip', import.meta.url)));
  for (const module of modules) {
    const archive = await module.openZipArchive(bytes);
    try {
      for (const path of ['folder/abc.txt', 'café.txt']) {
        expect(new TextDecoder().decode(await archive.read(path))).toBe('abc');
      }
    } finally {
      await archive.close();
    }
    const encoded = await module.encodeZip(
      {a: new Uint8Array([97, 98, 99])},
      {compression: 'deflate', zip64: 'always'}
    );
    const written = await module.openZipArchive(encoded);
    try {
      expect(new TextDecoder().decode(await written.read('a'))).toBe('abc');
    } finally {
      await written.close();
    }
  }
  expect(typeof require('@loaders.gl/archives/zip/zip-encode').encodeZipInBatches).toBe('function');
  const parser = require('@loaders.gl/archives/zip-loader').ZipLoaderWithParser;
  expect(modules[0].ZipLoader.parse).toBeUndefined();
  expect(modules[1].ZipLoader.parse).toBeUndefined();
  expect(typeof (await modules[0].ZipLoader.preload()).parse).toBe('function');
  const files = await parser.parse(bytes);
  expect(new TextDecoder().decode(files['folder/abc.txt'])).toBe('abc');
  for (const subpath of ['bundled', 'unbundled'])
    expect(() => require.resolve('@loaders.gl/archives/zip/' + subpath)).toThrow();
});

/** Dependency ownership is part of the ZIP package contract. */
test('ZIP declares only loaders.gl runtime dependencies', () => {
  const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  expect(Object.keys(manifest.dependencies).every(name => name.startsWith('@loaders.gl/'))).toBe(
    true
  );
});
