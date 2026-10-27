// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {cp, mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Worker} from 'node:worker_threads';
import {expect, test} from 'vitest';

/** Runs one compression request in an isolated Node worker. */
async function runWorkerRequest(
  worker: Worker,
  input: ArrayBuffer,
  operation: 'compress' | 'decompress'
): Promise<ArrayBuffer> {
  return await new Promise((resolve, reject) => {
    worker.once('error', reject);
    worker.once('message', message => {
      if (message.type === 'error') reject(new Error(message.payload.error));
      else resolve(message.payload.result);
    });
    worker.postMessage({
      source: 'loaders.gl',
      type: 'process',
      payload: {
        input,
        options: {compression: 'zstd', operation, useNative: false}
      }
    });
  });
}

test('Node worker loads external WASM sidecars and round-trips Zstandard', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'loaders-codec-worker-'));
  const workerPath = join(directory, 'compression-worker-node.mjs');
  try {
    await cp(new URL('../dist/compression-worker-node.js', import.meta.url), workerPath);
    await cp(new URL('../dist/codec-assets', import.meta.url), join(directory, 'codec-assets'), {
      recursive: true
    });
    const worker = new Worker(workerPath);
    try {
      const input = new TextEncoder().encode('Node worker external WASM round trip');
      const compressed = await runWorkerRequest(worker, input.slice().buffer, 'compress');
      const result = await runWorkerRequest(worker, compressed, 'decompress');
      expect(new Uint8Array(result)).toEqual(input);
    } finally {
      await worker.terminate();
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test('Node worker reports an error when its WASM sidecars are missing', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'loaders-codec-worker-missing-'));
  try {
    const workerPath = join(directory, 'compression-worker-node.mjs');
    await cp(new URL('../dist/compression-worker-node.js', import.meta.url), workerPath);
    const worker = new Worker(workerPath);
    try {
      const input = new TextEncoder().encode('missing WASM sidecar');
      await expect(runWorkerRequest(worker, input.buffer, 'compress')).rejects.toThrow(/ENOENT/);
    } finally {
      await worker.terminate();
    }
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});
