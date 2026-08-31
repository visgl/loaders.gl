// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ReadableFile} from '@loaders.gl/loader-utils';
import {expect, test, vi} from 'vitest';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import {
  CompressionCodec,
  FieldRepetitionType,
  Type
} from '../src/parquetjs/parquet-thrift/index';

/** Minimal random-access file used to exercise reader control flow without fixture I/O. */
class MemoryFile implements ReadableFile {
  readonly handle: unknown;
  readonly size: number;
  readonly bigsize: bigint;
  readonly url = 'memory.parquet';
  readonly close = vi.fn(async () => {});

  constructor(readonly bytes: Uint8Array, exposeArrayBuffer = true) {
    this.handle = exposeArrayBuffer ? bytes.buffer : {};
    this.size = bytes.byteLength;
    this.bigsize = BigInt(bytes.byteLength);
  }

  async read(start: number | bigint = 0, length = this.size): Promise<ArrayBuffer> {
    const offset = Number(start);
    return this.bytes.slice(offset, offset + length).buffer;
  }
}

const schema = new ParquetSchema({value: {type: 'INT32'}});
const metadata = {
  type: Type.INT32,
  encodings: [],
  path_in_schema: ['value'],
  codec: CompressionCodec.UNCOMPRESSED,
  num_values: 0,
  total_uncompressed_size: 0,
  total_compressed_size: 0,
  data_page_offset: 4
};

test('reader exposes immutable encryption snapshots and exact worker key views', async () => {
  const backing = Uint8Array.from([9, 1, 2, 8]);
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(16)), {
    int96AsTimestamp: true,
    encryptionContext: {
      algorithm: 'AES_GCM_V1',
      aadPrefix: Uint8Array.from([3]),
      fileUnique: Uint8Array.from([4]),
      footerKeyMetadata: Uint8Array.from([5])
    },
    keyRetriever: async () => backing.subarray(1, 3)
  });

  expect(reader.encrypted).toBe(true);
  expect(reader.int96AsTimestamp).toBe(true);
  const context = reader.getEncryptionContextForWorker();
  expect(context).toEqual({
    algorithm: 'AES_GCM_V1',
    aadPrefix: Uint8Array.from([3]),
    fileUnique: Uint8Array.from([4]),
    footerKeyMetadata: Uint8Array.from([5])
  });
  context!.fileUnique[0] = 99;
  expect(reader.getEncryptionContextForWorker()!.fileUnique[0]).toBe(4);

  const key = await reader.getColumnKeyForWorker({meta_data: metadata} as any, 2, 3);
  expect(key.keyMaterial).toEqual(Uint8Array.from([1, 2]));
  expect(key.keyMaterial.byteLength).toBe(2);
});

test('reader rejects worker encryption operations without required context', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(16)));
  expect(reader.encrypted).toBe(false);
  expect(reader.getEncryptionContextForWorker()).toBeUndefined();
  await expect(reader.getColumnKeyForWorker({} as any, 0, 0)).rejects.toThrow('keyRetriever');

  const encryptedColumn = {crypto_metadata: {ENCRYPTION_WITH_FOOTER_KEY: {}}} as any;
  await expect(reader.decryptIndexModule(new Uint8Array(), 'column-index', 0, 0, encryptedColumn))
    .rejects.toThrow('keyRetriever');
  await expect(reader.decryptBloomFilter(new Uint8Array(), 0, 0, encryptedColumn)).rejects.toThrow(
    'keyRetriever'
  );

  const plain = Uint8Array.from([1, 2]);
  await expect(reader.decryptIndexModule(plain, 'offset-index', 0, 0, {} as any)).resolves.toBe(
    plain
  );
  await expect(reader.decryptBloomFilter(plain, 0, 0, {} as any)).resolves.toBe(plain);
});

test('header, footer, abort, and close boundaries fail before decoding payloads', async () => {
  await expect(new ParquetReader(new MemoryFile(new TextEncoder().encode('NOPE'))).readHeader())
    .rejects.toThrow('Invalid parquet file');
  await expect(
    new ParquetReader(new MemoryFile(new TextEncoder().encode('PAR1'))).readHeader(
      AbortSignal.abort()
    )
  ).rejects.toThrow('Request aborted');

  const badTrailer = new Uint8Array(12);
  badTrailer.set(new TextEncoder().encode('PAR1'), 0);
  badTrailer.set(new TextEncoder().encode('NOPE'), 8);
  await expect(new ParquetReader(new MemoryFile(badTrailer)).readFooter()).rejects.toThrow(
    'Not a valid parquet file'
  );

  const oversizedFooter = new Uint8Array(12);
  new DataView(oversizedFooter.buffer).setUint32(4, 20, true);
  oversizedFooter.set(new TextEncoder().encode('PAR1'), 8);
  await expect(new ParquetReader(new MemoryFile(oversizedFooter)).readFooter()).rejects.toThrow(
    'Invalid metadata size'
  );

  const file = new MemoryFile(new Uint8Array(8));
  const reader = new ParquetReader(file);
  reader.close();
  expect(file.close).toHaveBeenCalledOnce();
});

test('metadata accessors cache schema and preserve key/value metadata', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(8)));
  const fileMetadata = {
    version: 1,
    schema: [
      {name: 'schema', num_children: 1},
      {name: 'value', type: Type.INT32, repetition_type: FieldRepetitionType.REQUIRED}
    ],
    num_rows: 7,
    row_groups: [],
    key_value_metadata: [
      {key: 'owner', value: 'loaders.gl'},
      {key: 'empty', value: ''}
    ]
  } as any;
  reader.metadata = Promise.resolve(fileMetadata);

  expect(await reader.getRowCount()).toBe(7);
  expect(await reader.getSchemaMetadata()).toEqual({owner: 'loaders.gl', empty: ''});
  const firstSchema = await reader.getSchema();
  expect(firstSchema.fields.value.primitiveType).toBe('INT32');
  expect(await reader.getSchema()).toBe(firstSchema);
  expect(await reader.getFileMetadata()).toBe(fileMetadata);
});

test.each([-1, 1, 0.5])('row-group iterator rejects invalid index %s', async rowGroupIndex => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(8)));
  reader.metadata = Promise.resolve({
    schema: [],
    row_groups: [{num_rows: 0, columns: []}],
    num_rows: 0,
    key_value_metadata: []
  } as any);
  (reader as any).schema = Promise.resolve(schema);
  const iterator = reader.rowGroupIterator({rowGroups: [rowGroupIndex]});
  await expect(iterator.next()).rejects.toThrow(`Invalid Parquet row-group index ${rowGroupIndex}`);
});

test('row, batch, and row-group iterators preserve order and column normalization', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(8)));
  reader.metadata = Promise.resolve({
    schema: [],
    row_groups: [
      {num_rows: 1, columns: []},
      {num_rows: 1, columns: []}
    ],
    num_rows: 2,
    key_value_metadata: []
  } as any);
  (reader as any).schema = Promise.resolve(schema);
  const readRowGroup = vi
    .spyOn(reader, 'readRowGroup')
    .mockImplementation(async (_schema, _group, columns, _signal, ordinal) => ({
      rowCount: 1,
      columnData: {
        value: {values: [ordinal! + 10], rlevels: [0], dlevels: [0], count: 1}
      },
      columns
    }) as any);

  const rows: any[] = [];
  for await (const row of reader.rowIterator({columnList: ['value'], rowGroups: [1, 0]})) {
    rows.push(row);
  }
  expect(rows).toEqual([{value: 11}, {value: 10}]);
  expect(readRowGroup.mock.calls[0][2]).toEqual([['value']]);
});

test('column and row-range planners reject malformed plans without reading bytes', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(32)));
  const chunk = {meta_data: metadata} as any;

  await expect(
    reader.readColumnChunkEncodedPages(schema, {...chunk, file_path: 'external'} as any, new Set())
  ).rejects.toThrow('external references');
  await expect(reader.readColumnChunkEncodedPages(schema, {} as any, new Set())).rejects.toThrow(
    'metadata is missing'
  );
  await expect(
    reader.readColumnChunkEncodedPages(
      schema,
      {meta_data: {...metadata, type: Type.BOOLEAN}} as any,
      new Set()
    )
  ).rejects.toThrow('chunk type not matching schema');

  await expect(
    reader.readColumnChunkRange(schema, {...chunk, file_path: 'external'} as any, {start: 0, end: 1}, [])
  ).rejects.toThrow('external references');
  await expect(
    reader.readColumnChunkRange(schema, {} as any, {start: 0, end: 1}, [])
  ).rejects.toThrow('metadata is missing');
  await expect(
    reader.readColumnChunkRange(
      schema,
      {meta_data: {...metadata, type: Type.BOOLEAN}} as any,
      {start: 0, end: 1},
      []
    )
  ).rejects.toThrow('chunk type not matching schema');
  await expect(
    reader.readColumnChunkRange(schema, chunk, {start: 10, end: 11}, [
      {offset: 4, compressedByteLength: 0, firstRowIndex: 0, endRowIndex: 2}
    ])
  ).rejects.toThrow('does not overlap');

  await expect(
    reader.readRowGroupRange(
      schema,
      {num_rows: 1, columns: [chunk]} as any,
      [],
      {start: 0, end: 1},
      {}
    )
  ).rejects.toThrow('offset index missing for value');
  await expect(reader.getDictionary(0, {} as any, 4)).resolves.toEqual([]);
});

test('row-group encoded planner filters columns and freezes its result', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(32)));
  const first = {meta_data: metadata} as any;
  const second = {meta_data: {...metadata, path_in_schema: ['ignored']}} as any;
  const encoded = {path: ['value'], pages: []} as any;
  const read = vi.spyOn(reader, 'readColumnChunkEncodedPages').mockResolvedValue(encoded);

  const result = await reader.readRowGroupEncodedPages(
    schema,
    {num_rows: 0, columns: [first, second]} as any,
    [['value']],
    new Set(['UNCOMPRESSED'])
  );
  expect(result).toEqual([encoded]);
  expect(Object.isFrozen(result)).toBe(true);
  expect(read).toHaveBeenCalledOnce();
});

test('column metadata resolution reports every incomplete encryption shape', async () => {
  const plainReader = new ParquetReader(new MemoryFile(new Uint8Array(32)));
  await expect(
    (plainReader as any).getColumnMetadata({}, 0, 0)
  ).rejects.toThrow('metadata is missing');

  const encryptedBytes = Uint8Array.from([1]);
  const encryptedColumn = {
    encrypted_column_metadata: encryptedBytes,
    crypto_metadata: {ENCRYPTION_WITH_COLUMN_KEY: {path_in_schema: ['value']}}
  } as any;
  await expect(
    plainReader.resolveColumnMetadata({num_rows: 0, columns: [encryptedColumn]} as any, 0)
  ).rejects.toThrow('requires parquet.keyRetriever');

  const keyReader = new ParquetReader(new MemoryFile(new Uint8Array(32)), {
    keyRetriever: async () => new Uint8Array(16)
  });
  await expect(
    keyReader.resolveColumnMetadata({num_rows: 0, columns: [encryptedColumn]} as any, 0)
  ).rejects.toThrow('has no file encryption context');

  const contextReader = new ParquetReader(new MemoryFile(new Uint8Array(32)), {
    keyRetriever: async () => new Uint8Array(16),
    encryptionContext: {algorithm: 'AES_GCM_V1', fileUnique: Uint8Array.from([1])}
  });
  await expect(
    contextReader.resolveColumnMetadata(
      {
        num_rows: 0,
        columns: [
          {
            encrypted_column_metadata: encryptedBytes,
            crypto_metadata: {},
            parquetColumnOrdinal: 7
          }
        ]
      } as any,
      0
    )
  ).rejects.toThrow('has no key reference');
});

test('encrypted page reads require a worker encryption context', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(32)), {
    keyRetriever: async () => new Uint8Array(16)
  });
  await expect(
    reader.readColumnChunkEncodedPages(
      schema,
      {meta_data: metadata, crypto_metadata: {ENCRYPTION_WITH_FOOTER_KEY: {}}} as any,
      new Set()
    )
  ).rejects.toThrow('Encrypted Parquet pages require parquet.keyRetriever');
});

test('row-group planners resolve encrypted metadata only for selected columns', async () => {
  const reader = new ParquetReader(new MemoryFile(new Uint8Array(32), false));
  const selected = {
    encrypted_column_metadata: Uint8Array.from([1]),
    crypto_metadata: {ENCRYPTION_WITH_COLUMN_KEY: {path_in_schema: ['value']}}
  } as any;
  const ignored = {
    encrypted_column_metadata: Uint8Array.from([2]),
    crypto_metadata: {ENCRYPTION_WITH_COLUMN_KEY: {path_in_schema: ['ignored']}}
  } as any;
  const getColumnMetadata = vi
    .spyOn(reader as any, 'getColumnMetadata')
    .mockResolvedValue(metadata);
  vi.spyOn(reader, 'readColumnChunkEncodedPages').mockResolvedValue({path: ['value']} as any);
  vi.spyOn(reader, 'readColumnChunkRange').mockResolvedValue({
    values: [],
    rlevels: [],
    dlevels: [],
    count: 0
  } as any);

  await reader.readRowGroupEncodedPages(
    schema,
    {num_rows: 0, columns: [selected, ignored]} as any,
    [['value']],
    new Set()
  );
  expect(getColumnMetadata).toHaveBeenCalledOnce();

  selected.meta_data = undefined;
  await reader.readRowGroupRange(
    schema,
    {num_rows: 1, columns: [selected, ignored]} as any,
    [['value']],
    {start: 0, end: 1},
    {'["value"]': [{offset: 4, compressedByteLength: 0, firstRowIndex: 0, endRowIndex: 1}]}
  );
  expect(getColumnMetadata).toHaveBeenCalledTimes(2);
});

test('synchronous column path validates backing storage and physical type', () => {
  const remoteReader = new ParquetReader(new MemoryFile(new Uint8Array(32), false));
  expect(() =>
    (remoteReader as any).readUncompressedColumnChunkFromMemory(schema, {}, metadata)
  ).toThrow('require an in-memory ArrayBuffer');

  const memoryReader = new ParquetReader(new MemoryFile(new Uint8Array(32)));
  expect(() =>
    (memoryReader as any).readUncompressedColumnChunkFromMemory(schema, {}, {
      ...metadata,
      type: Type.BOOLEAN
    })
  ).toThrow('chunk type not matching schema');
});
