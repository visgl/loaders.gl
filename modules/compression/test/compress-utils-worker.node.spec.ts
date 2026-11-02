// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {processOnWorker, destroyWorkerTasks} from '@loaders.gl/core/worker-utils';
import {CompressionWorker} from '../src/compress-on-worker';

test('Node compression task initializes the bundled LZO WASM decoder', async () => {
  try {
    const output = await processOnWorker(
      {
        ...CompressionWorker,
        worker: new URL('../dist/compression-worker-node.js', import.meta.url).href
      },
      new Uint8Array([22, 104, 101, 108, 108, 111, 17, 0, 0]).buffer,
      {compression: 'lzo', operation: 'decompress', expectedSize: 10}
    );
    expect(new TextDecoder().decode(output)).toBe('hello');
  } finally {
    await destroyWorkerTasks();
  }
});
