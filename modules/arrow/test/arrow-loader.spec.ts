// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {validateLoader} from 'test/common/conformance';
import * as fs from 'fs';
import * as arrow from 'apache-arrow';
import lz4js from 'lz4js';
import {ZstdCodec} from 'zstd-codec';
import {ArrowLoader} from '@loaders.gl/arrow';
import {registerArrowCompressionCodecs} from '../src/lib/parsers/arrow-compression';
import {
  isBrowser,
  makeIterator,
  resolvePath,
  setLoaderOptions,
  fetchFile,
  parse,
  parseInBatches
} from '@loaders.gl/core';
import {
  ARROW_SIMPLE,
  ARROW_DICTIONARY,
  ARROW_STRUCT,
  ARROW_BIOGRID_NODES
} from './data/arrow/test-cases';
const ArrowWorkerLoader = ArrowLoader;
setLoaderOptions({
  _workerType: 'test'
});
test('ArrowLoader#loader conformance', () => {
  validateLoader(ArrowLoader, 'ArrowLoader');
});
test('ArrowLoader#parseSync(simple.arrow)', async () => {
  const arrowTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false}
  });
  // Check loader specific results
  expect(arrowTable.shape).toBe('columnar-table');
  if (arrowTable.shape === 'columnar-table') {
    expect(arrowTable.data.bar, 'bar column loaded').toBeTruthy();
    expect(arrowTable.data.baz, 'baz column loaded').toBeTruthy();
    expect(arrowTable.data.foo, 'foo column loaded').toBeTruthy();
  }
});
test('ArrowLoader#parseSync(simple.arrow) type="object-row-table"', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false},
    arrow: {shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
  if (rowFormatTable.shape === 'object-row-table') {
    expect(rowFormatTable, 'Row based table loaded').toBeTruthy();
    expect(rowFormatTable.data.length).toBe(5);
    expect(rowFormatTable.data[0]).toEqual({foo: 1, bar: 1, baz: 'aa'});
  }
});
test('ArrowLoader#parseSync(simple.arrow) supports core.shape', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false, shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
  if (rowFormatTable.shape === 'object-row-table') {
    expect(rowFormatTable.data.length).toBe(5);
    expect(rowFormatTable.data[0]).toEqual({foo: 1, bar: 1, baz: 'aa'});
  }
});
test('ArrowLoader#parseSync(simple.arrow) loader shape overrides core.shape', async () => {
  const rowFormatTable = await parse(fetchFile(ARROW_SIMPLE), ArrowLoader, {
    core: {worker: false, shape: 'array-row-table'},
    arrow: {shape: 'object-row-table'}
  });
  expect(rowFormatTable.shape).toBe('object-row-table');
});
// This table has a dictionary id that is not safe to represent as a JavaScript number.
// https://github.com/visgl/loaders.gl/pull/2632#issuecomment-1712001480
// https://github.com/apache/arrow/blob/f1d2fc92f9d898fc067d46a0d032d9b117a2d7fc/js/src/ipc/metadata/message.ts#L389
test('ArrowLoader#parseSync(dictionary.arrow)', async () => {
  const columnarTable = await parse(fetchFile(ARROW_DICTIONARY), ArrowLoader);
  expect(columnarTable.shape).toBe('columnar-table');
  if (columnarTable.shape === 'columnar-table') {
    expect(columnarTable.data['example-csv'], 'example-csv loaded').toBeTruthy();
  }
});
test('ArrowLoader#parseSync supports compressed Feather V2 files', async () => {
  const compressionAPI = arrow as unknown as {
    CompressionType?: {LZ4_FRAME?: number; ZSTD?: number};
    compressionRegistry?: {
      set: (compressionType: number, codec: {encode: (data: Uint8Array) => Uint8Array}) => void;
    };
    tableToIPC: (table: arrow.Table, type: 'file', compressionType: number) => Uint8Array;
  };
  const compressionRegistry = compressionAPI.compressionRegistry;
  const compressionTypes = compressionAPI.CompressionType;
  if (
    !compressionRegistry ||
    typeof compressionTypes?.LZ4_FRAME !== 'number' ||
    typeof compressionTypes.ZSTD !== 'number'
  ) {
    return;
  }
  const sourceTable = arrow.tableFromArrays({
    id: Int32Array.from({length: 2048}, (_, index) => index),
    category: Array.from({length: 2048}, (_, index) => `category-${index % 4}`)
  });
  const zstd = await new Promise<any>(resolve => ZstdCodec.run(resolve));
  const compressionCases = [
    {
      name: 'LZ4_FRAME',
      type: compressionTypes.LZ4_FRAME,
      encode: (data: Uint8Array): Uint8Array => lz4js.compress(data)
    },
    {
      name: 'ZSTD',
      type: compressionTypes.ZSTD,
      encode: (data: Uint8Array): Uint8Array => new zstd.Simple().compress(data)
    }
  ];

  for (const compressionCase of compressionCases) {
    // Remove the decoder so this test verifies that ArrowLoader installs it while preserving the
    // encoder used to construct a representative compressed Feather V2 file.
    compressionRegistry.set(compressionCase.type, {encode: compressionCase.encode});
    const compressedData = compressionAPI.tableToIPC(sourceTable, 'file', compressionCase.type);
    expect(() => arrow.tableFromIPC(compressedData), compressionCase.name).toThrow(
      /codec not found/
    );

    const table = await parse(compressedData.slice().buffer, ArrowLoader, {
      core: {worker: false},
      arrow: {shape: 'object-row-table'}
    });
    expect(table.shape, compressionCase.name).toBe('object-row-table');
    if (table.shape === 'object-row-table') {
      expect(table.data.length, compressionCase.name).toBe(2048);
      expect(table.data[1025], compressionCase.name).toEqual({id: 1025, category: 'category-1'});
    }
  }
});
test('ArrowLoader compression registration tolerates Apache Arrow JS 17', () => {
  expect(registerArrowCompressionCodecs({})).toBe(false);
});
test('ArrowLoader#parse(fetchFile(struct).arrow)', async () => {
  const columns = await parse(fetchFile(ARROW_STRUCT), ArrowLoader);
  // Check loader specific results
  expect(columns.shape).toBe('columnar-table');
  if (columns.shape === 'columnar-table') {
    expect(columns.data.struct_nullable, 'struct_nullable loaded').toBeTruthy();
  }
});
// TODO - Arrow worker seems to not bundle apache arrow lib?
test('ArrowLoader#parse (WORKER)', async () => {
  if (!isBrowser) {
    console.log('Worker is not usable in non-browser environments');
    return;
  }
  const data = await parse(fetchFile(ARROW_SIMPLE), ArrowWorkerLoader);
  expect(data, 'Data returned').toBeTruthy();
});
test('ArrowLoader#parseInBatches(async input)', async () => {
  // TODO - parseInBatches should accept fetch response directly
  const response = await fetchFile(ARROW_BIOGRID_NODES);
  const data = await response.arrayBuffer();
  const asyncIterator = await parseInBatches(data, ArrowLoader);
  for await (const batch of asyncIterator) {
    expect(batch, 'received batch').toBeTruthy();
  }
});
// TODO - Move node stream test to generic parseInBatches test?
test('ArrowLoader#parseInBatches(Stream)', async () => {
  if (isBrowser) {
    console.log('Node stream test case only supported in Node');
    return;
  }
  const stream = fs.createReadStream(resolvePath(ARROW_BIOGRID_NODES));
  const asyncIterator = await parseInBatches(makeIterator(stream), ArrowLoader);
  for await (const batch of asyncIterator) {
    expect(batch, 'received batch').toBeTruthy();
  }
});
