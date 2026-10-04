// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test, vi} from 'vitest';
import {BlobFile} from '@loaders.gl/loader-utils';
import {ParquetEnvelopeWriter} from '../src/parquetjs/encoder/parquet-encoder';
import {
  decodeDataPages,
  decodePage,
  decodeUncompressedDataPages,
  decodeUncompressedDictionaryBuffer
} from '../src/parquetjs/parser/decoders';
import {ParquetReader} from '../src/parquetjs/parser/parquet-reader';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import {shredRecord} from '../src/parquetjs/schema/shred';
import type {ParquetReaderContext} from '../src/parquetjs/schema/declare';
import {concatUint8Arrays} from '../src/parquetjs/utils/binary-utils';
import {decodePageHeader, serializeThrift} from '../src/parquetjs/utils/read-utils';
import {decompress} from '../src/parquetjs/compression';
import {PARQUET_CODECS} from '../src/parquetjs/codecs';
import {
  DataPageHeader,
  DataPageHeaderV2,
  DictionaryPageHeader,
  Encoding,
  PageHeader,
  PageType
} from '../src/parquetjs/parquet-thrift';

type PageFixture = {
  /** Actual encoded column chunks, including dictionaries where present. */
  columns: Map<string, {buffer: Uint8Array; context: ParquetReaderContext}>;
};

const fixtures = new Map<string, PageFixture>();

beforeAll(async () => {
  for (const compression of ['UNCOMPRESSED', 'GZIP'] as const) {
    for (const useDataPageV2 of [false, true]) {
      const schema = new ParquetSchema({
        required: {type: 'INT32', compression},
        optional: {type: 'INT32', optional: true, compression},
        repeated: {type: 'INT32', repeated: true, compression},
        label: {type: 'UTF8', compression}
      });
      const chunks: Uint8Array[] = [];
      const writer = new ParquetEnvelopeWriter(
        schema,
        async (chunk) => {
          chunks.push(chunk);
        },
        async () => {},
        0,
        {
          useDataPageV2,
          dictionary: false,
          columnDictionaries: {label: true},
          pageSize: 2,
          writePageChecksums: true
        }
      );
      const rowGroup = schema.rowGroup();
      for (const row of [
        {required: 7, optional: 7, repeated: [7, 8], label: 'alpha'},
        {required: 8, optional: null, repeated: [], label: 'beta'},
        {required: 9, optional: 9, repeated: [9], label: 'alpha'}
      ])
        shredRecord(schema, row, rowGroup);
      await writer.writeHeader();
      await writer.writeRowGroup(rowGroup);
      await writer.writeFooter({suite: 'deep-pages'});
      const buffer = concatUint8Arrays(chunks);
      const reader = new ParquetReader(new BlobFile(buffer.slice().buffer));
      const metadata = await reader.getFileMetadata();
      const columns: PageFixture['columns'] = new Map();
      for (const chunk of metadata.row_groups[0].columns) {
        const columnMetadata = chunk.meta_data!;
        const column = schema.findField(columnMetadata.path_in_schema);
        const start = Number(
          columnMetadata.dictionary_page_offset ?? columnMetadata.data_page_offset
        );
        columns.set(column.name, {
          buffer: buffer.slice(start, start + Number(columnMetadata.total_compressed_size)),
          context: {
            type: column.primitiveType!,
            column,
            rLevelMax: column.rLevelMax,
            dLevelMax: column.dLevelMax,
            compression,
            verifyPageChecksums: true
          }
        });
      }
      fixtures.set(`${compression}:${useDataPageV2}`, {columns});
      reader.close();
    }
  }
});

test.each([
  'UNCOMPRESSED:false',
  'UNCOMPRESSED:true',
  'GZIP:false',
  'GZIP:true'
])('standalone pages preserve values, implicit levels, nulls, repeated rows and cursor boundaries (%s)', async (fixtureName) => {
  const fixture = fixtures.get(fixtureName)!;
  for (const [name, {buffer, context}] of fixture.columns) {
    const cursor = {buffer, offset: 0};
    const values: unknown[] = [];
    const definitionLevels: number[] = [];
    const repetitionLevels: number[] = [];
    let dictionary: unknown[] = [];
    while (cursor.offset < buffer.length) {
      const previousOffset = cursor.offset;
      const page = await decodePage(cursor, context);
      expect(cursor.offset).toBeGreaterThan(previousOffset);
      if (page.dictionary) {
        dictionary = page.dictionary;
        continue;
      }
      values.push(
        ...Array.from(page.values, (value) =>
          dictionary.length ? dictionary[Number(value)] : value
        )
      );
      definitionLevels.push(...page.dlevels);
      repetitionLevels.push(...page.rlevels);
    }
    expect(cursor.offset).toBe(buffer.length);
    if (name === 'label') {
      expect(values.map((value) => new TextDecoder().decode(value as Uint8Array))).toEqual([
        'alpha',
        'beta',
        'alpha'
      ]);
      expect(dictionary).toHaveLength(2);
    } else {
      expect(values).toEqual(name === 'optional' ? [7, 9] : [7, 8, 9]);
    }
    expect(definitionLevels).toEqual(
      name === 'optional' ? [1, 0, 1] : name === 'repeated' ? [1, 1, 0, 1] : [0, 0, 0]
    );
    expect(repetitionLevels).toEqual(name === 'repeated' ? [0, 1, 0, 0] : [0, 0, 0]);
  }
});

test.each([
  false,
  true
])('whole-column decoding discovers dictionaries and trims boxed buffers with V2=%s', async (useDataPageV2) => {
  const fixture = fixtures.get(`UNCOMPRESSED:${useDataPageV2}`)!;
  for (const [name, {buffer, context}] of fixture.columns) {
    const synchronous = decodeUncompressedDataPages(buffer, context);
    const asynchronous = await decodeDataPages(buffer, context);
    expect(asynchronous).toEqual(synchronous);
    expect(synchronous.count).toBe(name === 'repeated' ? 4 : 3);
    expect(synchronous.nullCount).toBe(name === 'optional' || name === 'repeated' ? 1 : 0);
    expect(synchronous.pageHeaders).toHaveLength(2);
    expect(synchronous.values).toHaveLength(name === 'optional' ? 2 : 3);
    if (name === 'optional') expect(synchronous.dlevels).toEqual([1, 0, 1]);
    if (name === 'repeated') {
      expect(synchronous.dlevels).toEqual([1, 1, 0, 1]);
      expect(synchronous.rlevels).toEqual([0, 1, 0, 0]);
    }
  }
});

test('RLE repeated runs grow a boxed destination at a nonzero offset while retaining its prefix', () => {
  const buffer = PARQUET_CODECS.RLE.encodeValues('INT32', [1, 1, 1, 1], {
    bitWidth: 1,
    disableEnvelope: true
  });
  const output = ['sentinel'];
  expect(
    PARQUET_CODECS.RLE.decodeValues('INT32', {buffer, offset: 0}, 4, {
      bitWidth: 1,
      disableEnvelope: true,
      output,
      outputOffset: 1
    })
  ).toBe(output);
  expect(output).toEqual(['sentinel', 1, 1, 1, 1]);
});

test.each([
  false,
  true
])('compressed pages use a caller decompressor for dictionary and data sections with V2=%s', async (useDataPageV2) => {
  const {buffer, context} = fixtures.get(`GZIP:${useDataPageV2}`)!.columns.get('label')!;
  const decompressPage = vi.fn((bytes: Uint8Array, size: number) =>
    decompress('GZIP', bytes, size)
  );
  const result = await decodeDataPages(buffer, {...context, decompressPage, numValues: 3});
  expect(result.values.map((value) => new TextDecoder().decode(value as Uint8Array))).toEqual([
    'alpha',
    'beta',
    'alpha'
  ]);
  expect(decompressPage).toHaveBeenCalledTimes(3);
  expect(result.pageHeaders.map((header) => header.type)).toEqual(
    new Array(2).fill(useDataPageV2 ? PageType.DATA_PAGE_V2 : PageType.DATA_PAGE)
  );
});

test('V2 pages explicitly marked uncompressed bypass a declared column decompressor', async () => {
  const {buffer, context} = fixtures.get('UNCOMPRESSED:true')!.columns.get('required')!;
  const decompressPage = vi.fn(async () => {
    throw new Error('Unexpected decompression');
  });
  const result = await decodeDataPages(buffer, {...context, compression: 'GZIP', decompressPage});
  expect(result.values).toEqual([7, 8, 9]);
  expect(decompressPage).not.toHaveBeenCalled();
});

test('BOOLEAN RLE pages use their physical bit width and preserve false values', async () => {
  // The RLE BOOLEAN value section has a four-byte envelope followed by one packed run.
  const body = Uint8Array.from([2, 0, 0, 0, 3, 5]);
  const buffer = serializePage(
    new PageHeader({
      type: PageType.DATA_PAGE,
      compressed_page_size: body.length,
      uncompressed_page_size: body.length,
      data_page_header: new DataPageHeader({
        num_values: 3,
        encoding: Encoding.RLE,
        repetition_level_encoding: Encoding.RLE,
        definition_level_encoding: Encoding.RLE
      })
    }),
    body
  );
  const column = new ParquetSchema({value: {type: 'BOOLEAN'}}).findField('value');
  const result = await decodeDataPages(buffer, {
    column,
    type: 'BOOLEAN',
    compression: 'UNCOMPRESSED',
    rLevelMax: 0,
    dLevelMax: 0
  });
  expect(result.values).toEqual([1, 0, 1]);
});

test.each([
  ['negative compressed size', {compressed_page_size: -1}, 'Invalid Parquet data page v2 header'],
  ['truncated payload', {compressed_page_size: 1}, 'Invalid Parquet data page v2 header'],
  [
    'more nulls than values',
    {data_page_header_v2: {num_nulls: 2}},
    'Invalid Parquet data page v2 header'
  ],
  [
    'negative uncompressed size',
    {uncompressed_page_size: -1},
    'Invalid Parquet data page v2 level lengths'
  ],
  [
    'oversized level section',
    {data_page_header_v2: {definition_levels_byte_length: 1}},
    'Invalid Parquet data page v2 level lengths'
  ],
  [
    'negative level section',
    {data_page_header_v2: {definition_levels_byte_length: -1}},
    'Invalid Parquet data page v2 level lengths'
  ]
] as const)('V2 decoder rejects %s in synchronous and asynchronous paths', async (_name, overrides, message) => {
  // Required columns isolate the value-size guard from definition-level decoding.
  const optional =
    'data_page_header_v2' in overrides &&
    'definition_levels_byte_length' in overrides.data_page_header_v2;
  const column = new ParquetSchema({value: {type: 'INT32', optional}}).findField('value');
  const context: ParquetReaderContext = {
    column,
    type: 'INT32',
    compression: 'UNCOMPRESSED',
    rLevelMax: 0,
    dLevelMax: column.dLevelMax
  };
  const header = new PageHeader({
    type: PageType.DATA_PAGE_V2,
    compressed_page_size: 0,
    uncompressed_page_size: 0,
    ...overrides,
    data_page_header_v2: new DataPageHeaderV2({
      num_values: 1,
      num_nulls: 1,
      num_rows: 1,
      encoding: Encoding.PLAIN,
      repetition_levels_byte_length: 0,
      definition_levels_byte_length: 0,
      ...('data_page_header_v2' in overrides ? overrides.data_page_header_v2 : {})
    })
  });
  const buffer = serializePage(header);
  expect(() => decodeUncompressedDataPages(buffer, context)).toThrow(message);
  await expect(decodePage({buffer, offset: 0}, {...context, compression: 'GZIP'})).rejects.toThrow(
    message
  );
});

test('page-kind, absent V2 headers, unknown value encoding enums and truncated dictionaries fail explicitly', async () => {
  const column = new ParquetSchema({value: {type: 'INT32'}}).findField('value');
  const context: ParquetReaderContext = {
    column,
    type: 'INT32',
    compression: 'UNCOMPRESSED',
    rLevelMax: 0,
    dLevelMax: 0
  };
  for (const [header, message] of [
    [
      new PageHeader({
        type: PageType.INDEX_PAGE,
        compressed_page_size: 0,
        uncompressed_page_size: 0
      }),
      'invalid page type: INDEX_PAGE'
    ],
    [
      new PageHeader({
        type: PageType.DATA_PAGE_V2,
        compressed_page_size: 0,
        uncompressed_page_size: 0
      }),
      'Missing Parquet data page v2 header'
    ],
    [
      new PageHeader({
        type: PageType.DATA_PAGE,
        compressed_page_size: 0,
        uncompressed_page_size: 0,
        data_page_header: new DataPageHeader({
          num_values: 0,
          encoding: 99 as Encoding,
          definition_level_encoding: Encoding.RLE,
          repetition_level_encoding: Encoding.RLE
        })
      }),
      'Invalid ENUM value'
    ]
  ] as const) {
    const buffer = serializePage(header);
    expect(() => decodeUncompressedDataPages(buffer, context)).toThrow(message);
    await expect(decodePage({buffer, offset: 0}, context)).rejects.toThrow(message);
  }
  const dictionary = serializePage(
    new PageHeader({
      type: PageType.DICTIONARY_PAGE,
      compressed_page_size: 4,
      uncompressed_page_size: 4,
      dictionary_page_header: new DictionaryPageHeader({num_values: 1, encoding: Encoding.PLAIN})
    })
  );
  expect(() => decodeUncompressedDictionaryBuffer(dictionary, context)).toThrow(
    'dictionary page exceeds'
  );
  await expect(
    decodeDataPages(dictionary, {...context, verifyPageChecksums: true})
  ).rejects.toThrow('page extends beyond');
});

test('Arrow byte-buffer eligibility falls back for dictionary encoded pages', () => {
  const {buffer, context} = fixtures.get('UNCOMPRESSED:false')!.columns.get('label')!;
  expect(
    decodeUncompressedDataPages(buffer, {...context, numValues: 3, useArrowByteArrayBuffers: true})
      .byteArrayData
  ).toBeUndefined();
  const dictionaryHeader = decodePageHeader(buffer, 0);
  const dictionaryEnd = dictionaryHeader.length + dictionaryHeader.pageHeader.compressed_page_size;
  const data = buffer.subarray(dictionaryEnd);
  const values = decodeUncompressedDataPages(data, {
    ...context,
    dictionary: [new TextEncoder().encode('alpha'), new TextEncoder().encode('beta')],
    numValues: 3,
    useArrowByteArrayBuffers: true
  });
  expect(values.values).toHaveLength(3);
  expect(values.byteArrayData).toBeUndefined();
});

/** Serializes exactly one Thrift page header and its optional body. */
function serializePage(header: PageHeader, body = new Uint8Array()): Uint8Array {
  return concatUint8Arrays([serializeThrift(header), body]);
}
