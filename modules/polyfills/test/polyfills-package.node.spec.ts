// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {execFileSync} from 'node:child_process';
import {expect, test} from 'vitest';

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
    const polyfills = ${format === 'esm' ? "await import('@loaders.gl/polyfills')" : "require('@loaders.gl/polyfills')"};
    assert.equal(typeof polyfills.installFilePolyfills, 'function');
    assert.equal(typeof globalThis.loaders.NodeFileSystem, 'function');
    assert.equal(typeof globalThis.loaders.requireFromFile, 'function');
    assert.equal(typeof globalThis.loaders.readFileAsArrayBuffer, 'function');
    const bytes = await globalThis.loaders.readFileAsArrayBuffer(pathToFileURL(path.resolve('modules/polyfills/package.json')).href);
    assert.equal(JSON.parse(new TextDecoder().decode(bytes)).name, '@loaders.gl/polyfills');
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
    "import * as polyfills from '@loaders.gl/polyfills'; console.log(polyfills.NodeFileSystem);",
    "const polyfills = require('@loaders.gl/polyfills'); console.log(polyfills.NodeFileSystem);"
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
    const optionalModules = ['get-pixels', 'save-pixels', 'ndarray'];
    const loadOriginal = Module._load;
    Module._load = function(request, ...parameters) {
      if (optionalModules.includes(request)) throw new Error('Optional image codec omitted');
      return loadOriginal.call(this, request, ...parameters);
    };
    const loaderSource = 'export async function resolve(specifier, context, nextResolve) { if (["get-pixels", "save-pixels", "ndarray"].includes(specifier)) throw new Error("Optional image codec omitted"); return nextResolve(specifier, context); }';
    register('data:text/javascript,' + encodeURIComponent(loaderSource), pathToFileURL(process.cwd() + '/'));
    const require = createRequire(import.meta.url);
    ${format === 'esm' ? "await import('@loaders.gl/polyfills')" : "require('@loaders.gl/polyfills')"};
    assert.equal(typeof globalThis.loaders.NodeFileSystem, 'function');
    assert.equal(typeof globalThis.loaders.readFileAsArrayBuffer, 'function');
    await assert.rejects(globalThis.loaders.parseImageNode(new ArrayBuffer(0), 'image/png'), /Install get-pixels/);
    await assert.rejects(globalThis.loaders.encodeImageNode({data: new Uint8Array(4), width: 1, height: 1}, {type: 'png'}), /Install save-pixels and ndarray/);
    console.log('Node transports work without image codecs');
  `
    ],
    {encoding: 'utf8'}
  );
  expect(result.trim()).toBe('Node transports work without image codecs');
});
