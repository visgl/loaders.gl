// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

test('core utility subpaths expose independent ESM entry points', async () => {
  const [core, loaderUtilities, workerUtilities] = await Promise.all([
    import('@loaders.gl/core'),
    import('@loaders.gl/core/loader-utils'),
    import('@loaders.gl/core/worker-utils')
  ]);

  expect(typeof loaderUtilities.HttpFile).toBe('function');
  expect(typeof workerUtilities.createWorker).toBe('function');
  expect('HttpFile' in core).toBe(false);
  expect('TaskRunner' in core).toBe(false);
  expect(core.isBrowser).toBe(loaderUtilities.isBrowser);
});

test('core utility subpaths expose independent CommonJS entry points', () => {
  const require = createRequire(import.meta.url);
  const loaderUtilities = require('@loaders.gl/core/loader-utils');
  const workerUtilities = require('@loaders.gl/core/worker-utils');

  expect(typeof loaderUtilities.HttpFile).toBe('function');
  expect(typeof workerUtilities.createWorker).toBe('function');
});

test('ordinary core entry points do not initialize math.gl Arrow utilities', () => {
  const result = spawnSync(
    process.execPath,
    [
      '--input-type=module',
      '-e',
      `import {createRequire, registerHooks} from 'node:module';
       registerHooks({resolve(specifier, context, nextResolve) {
         if (specifier === '@math.gl/arrow' || specifier.startsWith('@math.gl/arrow/')) {
           throw new Error('Ordinary core imports must not initialize math.gl Arrow');
         }
         return nextResolve(specifier, context);
       }});
       await import('@loaders.gl/core');
       await import('@loaders.gl/core/loader-utils');
       const require = createRequire(import.meta.url);
       require('@loaders.gl/core');
       require('@loaders.gl/core/loader-utils');`
    ],
    {encoding: 'utf8'}
  );
  expect(result.status, result.stderr).toBe(0);
});
