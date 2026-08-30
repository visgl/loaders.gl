// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';

import {scanParquetEncodedPages} from '../src/parquetjs/parser/encoded-pages';
import {
  DataPageHeader,
  DataPageHeaderV2,
  DictionaryPageHeader,
  Encoding,
  PageHeader,
  PageType
} from '../src/parquetjs/parquet-thrift';
import {serializeThrift} from '../src/parquetjs/utils/read-utils';
import {crc32} from '../src/parquetjs/utils/crc32';
import type {ParquetEncodedPageContext} from '../src/parquetjs/parser/encoded-pages';

const REQUIRED_CONTEXT: ParquetEncodedPageContext = {
  column: {
    name: 'value',
    path: ['value'],
    key: 'value',
    primitiveType: 'INT32',
    repetitionType: 'REQUIRED',
    rLevelMax: 0,
    dLevelMax: 0
  },
  compression: 'UNCOMPRESSED',
  decompressPage: async value => value
};

describe('encoded Parquet page scanning', () => {
  test('normalizes required V1 pages without decoding their values', async () => {
    const body = new Uint8Array([1, 0, 0, 0]);
    const page = createPage(
      new PageHeader({
        type: PageType.DATA_PAGE,
        compressed_page_size: body.length,
        uncompressed_page_size: body.length,
        data_page_header: new DataPageHeader({
          num_values: 1,
          encoding: Encoding.PLAIN,
          repetition_level_encoding: Encoding.RLE,
          definition_level_encoding: Encoding.RLE
        })
      }),
      body
    );
    const [encodedPage] = await scanParquetEncodedPages(page, REQUIRED_CONTEXT);

    expect(encodedPage).toMatchObject({
      type: 'data-v1',
      pageOrdinal: 0,
      encoding: 'PLAIN',
      compressionState: 'decompressed',
      repetitionLevels: {byteOffset: 0, byteLength: 0},
      definitionLevels: {byteOffset: 0, byteLength: 0},
      values: {byteOffset: 0, byteLength: 4}
    });
    expect(encodedPage.data).toEqual(body);
  });

  test('normalizes V1 RLE and BIT_PACKED level framing', async () => {
    const rleBody = new Uint8Array([2, 0, 0, 0, 0xaa, 0xbb, 7, 0, 0, 0]);
    const rlePage = createV1Page(rleBody, 2, Encoding.RLE);
    const optionalContext = {
      ...REQUIRED_CONTEXT,
      column: {...REQUIRED_CONTEXT.column, repetitionType: 'OPTIONAL' as const, dLevelMax: 1}
    };
    const [encodedRlePage] = await scanParquetEncodedPages(rlePage, optionalContext);
    expect(encodedRlePage.definitionLevels).toEqual({byteOffset: 4, byteLength: 2});
    expect(encodedRlePage.values).toEqual({byteOffset: 6, byteLength: 4});

    const bitPackedBody = new Uint8Array([0xff, 0xff, 0xff, 7, 0, 0, 0]);
    const bitPackedPage = createV1Page(bitPackedBody, 3, Encoding.BIT_PACKED);
    const [encodedBitPackedPage] = await scanParquetEncodedPages(
      bitPackedPage,
      {...optionalContext, column: {...optionalContext.column, dLevelMax: 7}}
    );
    expect(encodedBitPackedPage.definitionLevels).toEqual({byteOffset: 0, byteLength: 3});
    expect(encodedBitPackedPage.values).toEqual({byteOffset: 3, byteLength: 4});
  });

  test('inflates only the compressed V2 values section', async () => {
    const body = new Uint8Array([0xaa, 0xbb, 0xcc, 1, 2]);
    const page = createV2Page(body, true);
    const context: ParquetEncodedPageContext = {
      ...REQUIRED_CONTEXT,
      column: {...REQUIRED_CONTEXT.column, rLevelMax: 1, dLevelMax: 1},
      compression: 'GZIP',
      decompressPage: async (value, size) => {
        expect(Array.from(value)).toEqual([1, 2]);
        expect(size).toBe(4);
        return new Uint8Array([9, 8, 7, 6]);
      }
    };
    const [encodedPage] = await scanParquetEncodedPages(page, context);

    expect(encodedPage.compressionState).toBe('decompressed');
    expect(encodedPage.repetitionLevels).toEqual({byteOffset: 0, byteLength: 1});
    expect(encodedPage.definitionLevels).toEqual({byteOffset: 1, byteLength: 2});
    expect(encodedPage.values).toEqual({byteOffset: 3, byteLength: 4});
    expect(Array.from(encodedPage.data)).toEqual([0xaa, 0xbb, 0xcc, 9, 8, 7, 6]);
    expect(encodedPage.nonNullValueCount).toBe(1);
  });

  test('preserves requested V1, V2, and dictionary compression', async () => {
    const preservedContext: ParquetEncodedPageContext = {
      ...REQUIRED_CONTEXT,
      compression: 'GZIP',
      preserveCompression: new Set(['GZIP']),
      decompressPage: async () => {
        throw new Error('preserved pages must not be inflated');
      }
    };
    const v1Body = new Uint8Array([1, 2]);
    const [v1Page] = await scanParquetEncodedPages(
      createV1Page(v1Body, 1, Encoding.RLE),
      preservedContext
    );
    expect(v1Page).toMatchObject({compressionState: 'compressed', values: undefined});
    expect(v1Page.data).toEqual(v1Body);

    const v2Body = new Uint8Array([1, 2, 3, 4, 5]);
    const [v2Page] = await scanParquetEncodedPages(
      createV2Page(v2Body, true),
      preservedContext
    );
    expect(v2Page).toMatchObject({
      compressionState: 'compressed',
      values: {byteOffset: 3, byteLength: 2}
    });
    expect(v2Page.data).toEqual(v2Body);

    const dictionaryBody = new Uint8Array([5, 6]);
    const [dictionaryPage] = await scanParquetEncodedPages(
      createPage(
        new PageHeader({
          type: PageType.DICTIONARY_PAGE,
          compressed_page_size: 2,
          uncompressed_page_size: 4,
          dictionary_page_header: new DictionaryPageHeader({
            num_values: 1,
            encoding: Encoding.PLAIN
          })
        }),
        dictionaryBody
      ),
      preservedContext
    );
    expect(dictionaryPage).toMatchObject({
      type: 'dictionary',
      pageOrdinal: -1,
      compressionState: 'compressed',
      values: undefined
    });
  });

  test('handles uncompressed V2 values and verifies checksums before exposure', async () => {
    const body = new Uint8Array([0xaa, 0xbb, 0xcc, 1, 2]);
    const v2Page = createV2Page(body, false);
    const [encodedPage] = await scanParquetEncodedPages(v2Page, {
      ...REQUIRED_CONTEXT,
      column: {...REQUIRED_CONTEXT.column, rLevelMax: 1, dLevelMax: 1},
      compression: 'GZIP'
    });
    expect(encodedPage.compressionState).toBe('decompressed');
    expect(encodedPage.data).toEqual(body);

    const checkedHeader = new PageHeader({
      type: PageType.DATA_PAGE,
      compressed_page_size: body.length,
      uncompressed_page_size: body.length,
      crc: crc32(body),
      data_page_header: new DataPageHeader({
        num_values: 1,
        encoding: Encoding.PLAIN,
        repetition_level_encoding: Encoding.RLE,
        definition_level_encoding: Encoding.RLE
      })
    });
    await expect(
      scanParquetEncodedPages(createPage(checkedHeader, body), {
        ...REQUIRED_CONTEXT,
        verifyPageChecksums: true
      })
    ).resolves.toHaveLength(1);
    const corruptedBody = body.slice();
    corruptedBody[0] ^= 1;
    await expect(
      scanParquetEncodedPages(createPage(checkedHeader, corruptedBody), {
        ...REQUIRED_CONTEXT,
        verifyPageChecksums: true
      })
    ).rejects.toThrow('Parquet page checksum mismatch');
  });

  test('rejects malformed and unsupported page framing', async () => {
    await expect(
      scanParquetEncodedPages(createV1Page(new Uint8Array([3, 0, 0, 0, 1]), 1, Encoding.RLE), {
        ...REQUIRED_CONTEXT,
        column: {...REQUIRED_CONTEXT.column, dLevelMax: 1}
      })
    ).rejects.toThrow('section extends beyond');

    const indexBody = new Uint8Array([1]);
    await expect(
      scanParquetEncodedPages(
        createPage(
          new PageHeader({
            type: PageType.INDEX_PAGE,
            compressed_page_size: 1,
            uncompressed_page_size: 1
          }),
          indexBody
        ),
        REQUIRED_CONTEXT
      )
    ).rejects.toThrow('Unsupported Parquet page type');
  });
});

/** Creates a complete V1 page with only a definition-level stream. */
function createV1Page(body: Uint8Array, valueCount: number, levelEncoding: Encoding): Uint8Array {
  return createPage(
    new PageHeader({
      type: PageType.DATA_PAGE,
      compressed_page_size: body.length,
      uncompressed_page_size: body.length,
      data_page_header: new DataPageHeader({
        num_values: valueCount,
        encoding: Encoding.PLAIN,
        repetition_level_encoding: Encoding.RLE,
        definition_level_encoding: levelEncoding
      })
    }),
    body
  );
}

/** Creates a V2 page whose one-byte repetition and two-byte definition sections precede values. */
function createV2Page(body: Uint8Array, isCompressed: boolean): Uint8Array {
  return createPage(
    new PageHeader({
      type: PageType.DATA_PAGE_V2,
      compressed_page_size: body.length,
      uncompressed_page_size: 7,
      data_page_header_v2: new DataPageHeaderV2({
        num_values: 2,
        num_nulls: 1,
        num_rows: 2,
        encoding: Encoding.PLAIN,
        definition_levels_byte_length: 2,
        repetition_levels_byte_length: 1,
        is_compressed: isCompressed
      })
    }),
    body
  );
}

/** Serializes one page header immediately before its body. */
function createPage(header: PageHeader, body: Uint8Array): Uint8Array {
  const headerBytes = serializeThrift(header);
  const page = new Uint8Array(headerBytes.byteLength + body.byteLength);
  page.set(headerBytes);
  page.set(body, headerBytes.byteLength);
  return page;
}
