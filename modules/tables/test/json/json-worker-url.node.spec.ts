// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {build, transform} from 'esbuild';
import {expect, test} from 'vitest';

test('an ESM browser bundle retains CDN fallback instead of inventing an application asset URL', async () => {
  const bundle = await build({
    entryPoints: [fileURLToPath(new URL('../../src/json/json-worker-url.ts', import.meta.url))],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    logLevel: 'silent'
  });
  // Bind import.meta.url to a relocated application bundle before evaluating in a browser realm.
  const relocatedSource = bundle.outputFiles[0].text.replaceAll(
    'import.meta.url',
    JSON.stringify('https://app.example/assets/application.js')
  );
  const executable = await transform(relocatedSource, {format: 'iife', globalName: 'workerAssets'});
  const browserRealm = {};
  runInNewContext(executable.code, browserRealm);
  expect(
    (browserRealm as {workerAssets?: {JSON_WORKER_URL: unknown}}).workerAssets?.JSON_WORKER_URL
  ).toBe(true);
});
