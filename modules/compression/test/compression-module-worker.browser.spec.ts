// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {processOnWorker} from '@loaders.gl/worker-utils';
import {CompressionWorker} from '../src/compress-on-worker';

test.each([
  'module',
  'classic'
] as const)('%s compression worker loads sidecar WASM and round-trips Zstandard', async workerType => {
  const workerDescriptor =
    workerType === 'module'
      ? {
          ...CompressionWorker,
          loadWorker: () =>
            new Worker(new URL('/modules/compression/dist/compression-worker.mjs', location.href), {
              type: 'module'
            })
        }
      : CompressionWorker;
  const input = new TextEncoder().encode('small deterministic codec payload');
  const options = {
    compression: 'zstd',
    useNative: false,
    reuseWorkers: false,
    ...(workerType === 'classic'
      ? {workerUrl: new URL('/modules/compression/dist/compression-worker.js', location.href).href}
      : {})
  };
  const compressed = await processOnWorker(workerDescriptor, input.slice().buffer, {
    ...options,
    operation: 'compress'
  });
  const decompressed = await processOnWorker(workerDescriptor, compressed, {
    ...options,
    operation: 'decompress'
  });
  expect(new Uint8Array(decompressed)).toEqual(input);
});

test('missing classic-worker WASM sidecars reject instead of silently falling back', async () => {
  const scriptUrl = new URL('/modules/compression/dist/compression-worker.js', location.href).href;
  const missingBaseUrl = new URL('/missing-codec-assets/compression-worker.js', location.href).href;
  const source = `globalThis.__loadersWorkerUrl = ${JSON.stringify(missingBaseUrl)}; importScripts(${JSON.stringify(scriptUrl)});`;
  const blobUrl = URL.createObjectURL(new Blob([source], {type: 'application/javascript'}));
  try {
    await expect(
      processOnWorker(
        {
          ...CompressionWorker,
          loadWorker: () => new Worker(blobUrl)
        },
        new Uint8Array([1, 2, 3]).buffer,
        {
          compression: 'zstd',
          operation: 'compress',
          useNative: false,
          reuseWorkers: false
        }
      )
    ).rejects.toThrow();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
});
