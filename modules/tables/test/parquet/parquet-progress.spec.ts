// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {fetchFile, parseInBatches} from '@loaders.gl/core';
import {ParquetLoader} from '@loaders.gl/tables/parquet';

let input: ArrayBuffer;
beforeAll(async () => {
  input = await (await fetchFile('@loaders.gl/tables/parquet/test/data/apache/good/alltypes_dictionary.parquet')).arrayBuffer();
});

test('Parquet batch progress reports decoded rows', async () => {
  const onProgress = vi.fn();
  const batches = await parseInBatches(input.slice(0), ParquetLoader, {
    core: {worker: false},
    _workerType: 'test',
    parquet: {shape: 'arrow-table', signal: new AbortController().signal},
    onProgress
  });
  let rows = 0;
  for await (const batch of batches) rows += batch.data.numRows;
  expect(rows).toBe(2);
  expect(onProgress).toHaveBeenLastCalledWith({phase: 'decode', completed: 2, unit: 'rows'});
});
