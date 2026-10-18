// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {createRequire} from 'node:module';

test('core utility subpaths expose independent ESM entry points', async () => {
  const [core, loaderUtilities, workerUtilities] = await Promise.all([
    import('@loaders.gl/core'),
    import('@loaders.gl/core/loader-utils'),
    import('@loaders.gl/core/worker-utils')
  ]);

  expect(typeof loaderUtilities.HttpFile).toBe('function');
  expect(typeof workerUtilities.WorkerFarm).toBe('function');
  expect('HttpFile' in core).toBe(false);
  expect('WorkerFarm' in core).toBe(false);
  expect('isBrowser' in core).toBe(false);
});

test('core utility subpaths expose independent CommonJS entry points', () => {
  const require = createRequire(import.meta.url);
  const loaderUtilities = require('@loaders.gl/core/loader-utils');
  const workerUtilities = require('@loaders.gl/core/worker-utils');

  expect(typeof loaderUtilities.HttpFile).toBe('function');
  expect(typeof workerUtilities.WorkerFarm).toBe('function');
});
