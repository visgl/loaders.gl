// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

test('polyfills subpath has no loaders.gl module imports', async () => {
  const {build} = await import('esbuild');
  const result = await build({
    entryPoints: ['modules/core/src/polyfills/index.ts'],
    bundle: true,
    packages: 'external',
    platform: 'node',
    format: 'esm',
    write: false,
    metafile: true
  });
  const moduleImports = Object.values(result.metafile!.outputs)
    .flatMap(output => output.imports)
    .filter(imported => imported.path.startsWith('@loaders.gl/'));
  expect(moduleImports).toEqual([]);
});

test.each([
  'esm',
  'commonjs'
])('installed %s polyfills bootstrap the Node file and library transports', format => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import {createRequire} from 'node:module';
    import {pathToFileURL} from 'node:url';
    import path from 'node:path';
    const require = createRequire(import.meta.url);
    const nativeGlobals = {Blob, File, fetch, Headers, Response};
    const polyfills = ${format === 'esm' ? "await import('@loaders.gl/core/polyfills')" : "require('@loaders.gl/core/polyfills')"};
    assert.equal(typeof polyfills.installFilePolyfills, 'function');
    assert.equal(typeof globalThis.FileReader, 'function');
    for (const [name, value] of Object.entries(nativeGlobals)) assert.equal(globalThis[name], value);
    assert.equal(polyfills.Blob, nativeGlobals.Blob);
    assert.equal(polyfills.File, nativeGlobals.File);
    const file = new polyfills.File([new Uint8Array([0, 255])], 'sample.bin', {type: 'application/octet-stream', lastModified: 123});
    assert.ok(file instanceof polyfills.Blob);
    assert.equal(file.name, 'sample.bin');
    assert.equal(file.lastModified, 123);
    assert.deepEqual([...new Uint8Array(await file.arrayBuffer())], [0, 255]);
    assert.equal(await (await fetch('data:text/plain,hello%20world')).text(), 'hello world');
    const fixture = 'modules/core/test/polyfills-package/data/data.txt';
    for (const filename of [fixture, fixture + '.gz']) {
      const response = await globalThis.loaders.fetchNode(filename);
      assert.equal(response.ok, true);
      assert.equal(await response.text(), '123456');
    }
    assert.equal(typeof globalThis.loaders.NodeFileSystem, 'function');
    assert.equal(typeof globalThis.loaders.requireFromFile, 'function');
    assert.equal(typeof globalThis.loaders.readFileAsArrayBuffer, 'function');
    const bytes = await globalThis.loaders.readFileAsArrayBuffer(pathToFileURL(path.resolve('modules/core/package.json')).href);
    assert.equal(JSON.parse(new TextDecoder().decode(bytes)).name, '@loaders.gl/core');
    console.log('Node transports ready');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(result.trim()).toBe('Node transports ready');
});

test('browser bundles resolve both polyfills entrypoints to the browser shim', async () => {
  const {build} = await import('esbuild');
  for (const contents of [
    "import * as polyfills from '@loaders.gl/core/polyfills'; console.log(polyfills.NodeFileSystem, polyfills.setPathPrefix);",
    "const polyfills = require('@loaders.gl/core/polyfills'); console.log(polyfills.NodeFileSystem, polyfills.setPathPrefix);"
  ]) {
    const result = await build({
      stdin: {contents, resolveDir: process.cwd()},
      tsconfigRaw: {compilerOptions: {}},
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      metafile: true
    });
    expect(
      Object.keys(result.metafile!.inputs).some(path => path.endsWith('index.browser.js'))
    ).toBe(true);
    expect(
      Object.keys(result.metafile!.inputs).some(path => path.includes('require-utils.node'))
    ).toBe(false);
  }
});

test.each([
  'esm',
  'commonjs'
])('installed %s polyfills work when image codecs cannot resolve', format => {
  const result = execFileSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `
    import assert from 'node:assert/strict';
    import Module, {createRequire, register} from 'node:module';
    import {pathToFileURL} from 'node:url';
    const optionalModules = ['sharp'];
    const loadOriginal = Module._load;
    Module._load = function(request, ...parameters) {
      if (optionalModules.includes(request)) throw new Error('Optional image codec omitted');
      return loadOriginal.call(this, request, ...parameters);
    };
    const loaderSource = 'export async function resolve(specifier, context, nextResolve) { if (["sharp"].includes(specifier)) throw new Error("Optional image codec omitted"); return nextResolve(specifier, context); }';
    register('data:text/javascript,' + encodeURIComponent(loaderSource), pathToFileURL(process.cwd() + '/'));
    const require = createRequire(import.meta.url);
    ${format === 'esm' ? "await import('@loaders.gl/core/polyfills')" : "require('@loaders.gl/core/polyfills')"};
    assert.equal(typeof globalThis.loaders.NodeFileSystem, 'function');
    assert.equal(typeof globalThis.loaders.readFileAsArrayBuffer, 'function');
    await assert.rejects(globalThis.loaders.parseImageNode(new ArrayBuffer(0), 'image/png'), /npm install sharp/);
    await assert.rejects(globalThis.loaders.encodeImageNode({data: new Uint8Array(4), width: 1, height: 1}, {type: 'png'}), /npm install sharp/);
    console.log('Node transports work without image codecs');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(result.trim()).toBe('Node transports work without image codecs');
});
