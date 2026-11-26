// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {queryInBatches, preloadQuery} from '../../../src/scan/query';
import {openQuerySource} from '../../../src/scan/query-open-source';

const executorFailure = new Error('executor import failed');
const metadataFailure = new Error('metadata preparation failed');

/** Creates a gate for independently controlling query preparation and import. */
function createGate() {
  let release!: () => void;
  const finished = new Promise<void>(resolve => {
    release = resolve;
  });
  return {finished, release};
}

const allowImportFailure = createGate();
vi.mock('../../../src/scan/query-executor', async () => {
  await allowImportFailure.finished;
  throw executorFailure;
});
vi.mock('../../../src/scan/query-open-source', () => ({openQuerySource: vi.fn()}));

test('executor failure drains pending owned-source metadata before closing once', async () => {
  const metadataStarted = createGate();
  const allowMetadataFailure = createGate();
  const events: string[] = [];
  const close = vi.fn(() => events.push('close'));
  const onQueryComplete = vi.fn(() => events.push('complete'));
  vi.mocked(openQuerySource).mockResolvedValue({
    async getQueryMetadata() {
      metadataStarted.release();
      await allowMetadataFailure.finished;
      events.push('metadata settled');
      throw metadataFailure;
    },
    read: vi.fn(),
    close
  });
  const iterator = queryInBatches({}, {source: 'memory://table', onQueryComplete});
  const first = iterator.next().catch(error => error);
  try {
    await metadataStarted.finished;
    const warming = preloadQuery().catch(error => error);
    allowImportFailure.release();
    const importError = await warming;
    expect(importError).toBeInstanceOf(Error);

    expect(close).not.toHaveBeenCalled();
    expect(onQueryComplete).not.toHaveBeenCalled();
    allowMetadataFailure.release();
    expect(await first).toBe(importError);
    expect(onQueryComplete).toHaveBeenCalledWith(
      expect.objectContaining({status: 'failed', error: importError})
    );
    expect(close).toHaveBeenCalledTimes(1);
    expect(events).toEqual(['metadata settled', 'close', 'complete']);
  } finally {
    allowImportFailure.release();
    allowMetadataFailure.release();
    await iterator.return?.();
  }
});
