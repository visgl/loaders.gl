// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import {encode} from '@loaders.gl/core';
import {ArrayBufferFile} from '@loaders.gl/core/loader-utils';
import {ParquetJSWriter} from '@loaders.gl/tables/parquet/index';
import {ParquetWasmLoaderWithParser} from '@loaders.gl/tables/parquet/parquet-wasm-loader';

/** Tiny generated fixture shared by the optional WASM reader conformance cases. */
let fixture: ArrayBuffer;

beforeAll(async () => {
  fixture = await encode({shape: 'object-row-table', data: [{id: 1}, {id: 2}]}, ParquetJSWriter);
});

test('Explicit Parquet WASM reader preserves file parsing shapes and row selection', async () => {
  const file = new ArrayBufferFile(fixture);
  const arrowTable = await ParquetWasmLoaderWithParser.parseFile(file, {
    parquet: {shape: 'arrow-table'}
  });
  expect(arrowTable.shape).toBe('arrow-table');
  if (arrowTable.shape === 'arrow-table') {
    expect(arrowTable.data.numRows).toBe(2);
  }
  const virtualFile = {
    ...file,
    handle: null,
    read: file.read.bind(file),
    close: file.close.bind(file)
  };
  const rows = await ParquetWasmLoaderWithParser.parseFile(virtualFile, {
    parquet: {shape: 'object-row-table', offset: 1, limit: 1}
  });
  expect(rows.data).toEqual([{id: 2}]);
});

test('Explicit Parquet WASM reader preserves file and fragmented-input batch APIs', async () => {
  const rows: unknown[] = [];
  for await (const batch of ParquetWasmLoaderWithParser.parseFileInBatches(new ArrayBufferFile(fixture), {
    parquet: {shape: 'object-row-table', batchSize: 1}
  })) {
    if (batch.shape === 'object-row-table') rows.push(...batch.data);
  }
  expect(rows).toEqual([{id: 1}, {id: 2}]);
  const batches = [];
  for await (const batch of ParquetWasmLoaderWithParser.parseInBatches([fixture.slice(0, 8), fixture.slice(8)], {
    parquet: {shape: 'arrow-table', batchSize: 1}
  })) {
    if (batch.shape === 'arrow-table') batches.push(batch.data.numRows);
  }
  expect(batches).toEqual([1, 1]);
});
