// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync, existsSync} from 'node:fs';
import {createContext, runInContext} from 'node:vm';
import {build} from 'esbuild';
import {beforeAll, expect, test} from 'vitest';

let assetResolverSource: string;
beforeAll(async () => {
  const {createCompressUtilsAssetPlugin} = await import(
    new URL('../../../scripts/lib/compress-utils-assets.mjs', import.meta.url).href
  );
  const result = await build({
    stdin: {
      contents:
        'globalThis.getAssetURL = () => new URL("codec-assets/example.wasm", __loadersCodecAssetBaseUrl).href;'
    },
    platform: 'browser',
    format: 'iife',
    bundle: true,
    write: false,
    outfile: '/tmp/loaders-codec-base-test.js',
    plugins: [createCompressUtilsAssetPlugin()]
  });
  assetResolverSource = result.outputFiles[0].text;
});

test('standalone bundles capture independent script locations before lazy codec loading', () => {
  const context = createContext({
    URL,
    document: {currentScript: {src: 'https://example.invalid/first/dist.min.js'}}
  });
  runInContext(assetResolverSource, context);
  const firstResolver = context.getAssetURL;
  context.document.currentScript.src = 'https://example.invalid/second/dist.min.js';
  runInContext(assetResolverSource, context);
  expect(firstResolver()).toBe('https://example.invalid/first/codec-assets/example.wasm');
  expect(context.getAssetURL()).toBe('https://example.invalid/second/codec-assets/example.wasm');
});

test.each([
  [
    {__loadersWorkerUrl: 'https://example.invalid/worker/codec.js'},
    'https://example.invalid/worker/codec-assets/example.wasm'
  ],
  [
    {__filename: '/app with spaces/#codec/codec.js'},
    'file:///app%20with%20spaces/%23codec/codec-assets/example.wasm'
  ],
  [
    {__filename: 'C:\\app with spaces\\codec.js'},
    'file:///C:/app%20with%20spaces/codec-assets/example.wasm'
  ]
] as const)('classic asset resolution preserves worker and filesystem locations %j', (globals, expectedUrl) => {
  const context = createContext({URL, ...globals});
  runInContext(assetResolverSource, context);
  expect(context.getAssetURL()).toBe(expectedUrl);
});

test.each([
  'compression',
  'arrow'
])('%s ESM worker publishes resolvable WASM sidecars', moduleName => {
  const workerUrl = new URL(`../../${moduleName}/dist/${moduleName}-worker.mjs`, import.meta.url);
  const source = readFileSync(workerUrl, 'utf8');
  expect(source).not.toContain('data:application/wasm;base64');
  expect(source).toContain('import.meta.url');
  const paths = [...source.matchAll(/codec-assets\/[A-Za-z0-9_-]+\.wasm/g)].map(match => match[0]);
  expect(paths.length).toBeGreaterThan(0);
  for (const path of paths) {
    const assetUrl = new URL(path, workerUrl);
    expect(existsSync(assetUrl), path).toBe(true);
    expect(Array.from(readFileSync(assetUrl).subarray(0, 4)), path).toEqual([0, 97, 115, 109]);
  }
  const classicSource = readFileSync(
    new URL(`../../${moduleName}/dist/${moduleName}-worker.js`, import.meta.url),
    'utf8'
  );
  expect(classicSource).not.toContain('data:application/wasm;base64');
  expect(classicSource).toContain('__loadersWorkerUrl');
});
