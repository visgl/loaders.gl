// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Worker} from 'node:worker_threads';
import {expect, test} from 'vitest';

test('Node compression worker initializes the bundled LZO WASM decoder', async () => {
  const worker = new Worker(new URL('../dist/compression-worker-node.js', import.meta.url));
  try {
    const output = await new Promise<ArrayBuffer>((resolve, reject) => {
      worker.once('error', reject);
      worker.on('message', message => {
        if (message.type === 'error') reject(new Error(message.payload.error));
        else if (message.type === 'done') resolve(message.payload.result);
      });
      worker.postMessage({
        source: 'loaders.gl',
        type: 'process',
        payload: {
          input: new Uint8Array([22, 104, 101, 108, 108, 111, 17, 0, 0]).buffer,
          options: {compression: 'lzo', operation: 'decompress', expectedSize: 10}
        }
      });
    });
    expect(new TextDecoder().decode(output)).toBe('hello');
  } finally {
    await worker.terminate();
  }
});
