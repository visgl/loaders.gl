// SPDX-License-Identifier: MIT
import {expect, test, vi} from 'vitest';
import {createWorker} from '@loaders.gl/core/worker-utils';

test('creating a worker on the calling thread leaves message handling untouched', async () => {
  const previous = globalThis.onmessage;
  const handler = vi.fn();
  globalThis.onmessage = handler;
  try {
    await createWorker(async input => input);
    expect(globalThis.onmessage).toBe(handler);
  } finally {
    globalThis.onmessage = previous;
  }
});
