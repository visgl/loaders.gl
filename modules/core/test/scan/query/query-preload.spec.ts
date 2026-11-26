// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {tableFromArrays} from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {preloadQuery, queryInBatches} from '../../../src/scan/query';
import {createScanQueryMetadata} from '@loaders.gl/core/loader-utils';
import {convertArrowToSchema} from '@loaders.gl/core/schema-utils';

/** Signals one deterministic step in the asynchronous query lifecycle. */
function createGate() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => {
    release = resolve;
  });
  return {promise, release};
}

const importStarted = createGate();
const allowImport = createGate();
vi.mock('../../../src/scan/query-executor', async importOriginal => {
  importStarted.release();
  await allowImport.promise;
  return importOriginal<typeof import('../../../src/scan/query-executor')>();
});

test('first pull overlaps executor preload with metadata and waits for both before reading', async () => {
  const metadataStarted = createGate();
  const allowMetadata = createGate();
  const table = tableFromArrays({value: [1, 2]});
  const source = {
    getQueryMetadata: vi.fn(async () => {
      metadataStarted.release();
      await allowMetadata.promise;
      return createScanQueryMetadata({
        sourceType: 'test',
        queryType: 'table',
        schema: convertArrowToSchema(table.schema),
        execution: {status: 'supported', method: 'read'},
        capabilities: {}
      });
    }),
    read: vi.fn(async function* () {
      yield* table.batches;
    })
  };
  const iterator = queryInBatches({}, {source})[Symbol.asyncIterator]();
  expect(source.getQueryMetadata).not.toHaveBeenCalled();
  const first = iterator.next();
  try {
    await Promise.all([importStarted.promise, metadataStarted.promise]);
    expect(source.read).not.toHaveBeenCalled();
    allowImport.release();
    await Promise.all([preloadQuery(), preloadQuery()]);
    expect(source.read).not.toHaveBeenCalled();
    allowMetadata.release();
    expect((await first).value.numRows).toBe(2);
    expect(source.getQueryMetadata).toHaveBeenCalledTimes(1);
    expect(source.read).toHaveBeenCalledTimes(1);
  } finally {
    allowImport.release();
    allowMetadata.release();
    await iterator.return?.();
  }
});
