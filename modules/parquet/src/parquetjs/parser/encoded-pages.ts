// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ParquetEncodedPage, ParquetEncodedPageSection} from '../../parquet-encoded-page-types';
import type {ParquetCompression, ParquetField} from '../schema/declare';
import {Encoding, PageType, type PageHeader} from '../parquet-thrift/index';
import {crc32} from '../utils/crc32';
import {readUInt32LE} from '../utils/binary-utils';
import {decodePageHeader, getBitWidth, getThriftEnum} from '../utils/read-utils';
import type {ParquetPageDecompressor} from '../compression';

/** Context required to expose page framing without decoding Parquet values. */
export type ParquetEncodedPageContext = Readonly<{
  /** Schema field associated with the column chunk. */
  column: ParquetField;
  /** Compression codec declared by the column chunk. */
  compression: ParquetCompression;
  /** Reusable decompressor for independently compressed pages. */
  decompressPage: ParquetPageDecompressor;
  /** Compression codecs a downstream decoder can consume directly. */
  preserveCompression?: ReadonlySet<string>;
  /** Verify page CRC values before exposing page bytes. */
  verifyPageChecksums?: boolean;
}>;

/**
 * Splits a plaintext column-chunk buffer into transport-neutral encoded page descriptors.
 *
 * This parses only page headers and level framing. It deliberately does not decode levels,
 * dictionaries, or values, allowing the returned bytes to be consumed by a CPU or GPU backend.
 */
export async function scanParquetEncodedPages(
  buffer: Uint8Array,
  context: ParquetEncodedPageContext
): Promise<ParquetEncodedPage[]> {
  const pages: ParquetEncodedPage[] = [];
  let offset = 0;
  let dataPageOrdinal = 0;
  while (offset < buffer.byteLength) {
    const {pageHeader, length: headerByteLength} = decodePageHeader(buffer, offset);
    const bodyOffset = offset + headerByteLength;
    const bodyEnd = bodyOffset + pageHeader.compressed_page_size;
    if (
      pageHeader.compressed_page_size < 0 ||
      pageHeader.uncompressed_page_size < 0 ||
      bodyEnd > buffer.byteLength
    ) {
      throw new Error('Parquet page extends beyond the available column-chunk buffer');
    }
    const compressedBody = buffer.subarray(bodyOffset, bodyEnd);
    verifyEncodedPageChecksum(compressedBody, pageHeader, context.verifyPageChecksums);
    const pageType = getThriftEnum(PageType, pageHeader.type);
    if (pageType === 'DICTIONARY_PAGE') {
      pages.push(await createDictionaryPage(compressedBody, pageHeader, context));
    } else if (pageType === 'DATA_PAGE') {
      pages.push(await createDataPageV1(compressedBody, pageHeader, context, dataPageOrdinal++));
    } else if (pageType === 'DATA_PAGE_V2') {
      pages.push(await createDataPageV2(compressedBody, pageHeader, context, dataPageOrdinal++));
    } else {
      throw new Error(`Unsupported Parquet page type ${pageType}`);
    }
    offset = bodyEnd;
  }
  return pages;
}

/** Creates one dictionary-page descriptor, optionally retaining its compressed bytes. */
async function createDictionaryPage(
  compressedBody: Uint8Array,
  pageHeader: PageHeader,
  context: ParquetEncodedPageContext
): Promise<ParquetEncodedPage> {
  const dictionaryHeader = pageHeader.dictionary_page_header;
  if (!dictionaryHeader) {
    throw new Error('Parquet dictionary page is missing its dictionary header');
  }
  const preserveCompression = shouldPreserveCompression(context);
  const data = preserveCompression
    ? compressedBody
    : await decompressPageBody(compressedBody, pageHeader.uncompressed_page_size, context);
  return Object.freeze({
    type: 'dictionary' as const,
    pageOrdinal: -1,
    encoding: getThriftEnum(Encoding, dictionaryHeader.encoding),
    compression: context.compression,
    compressionState: preserveCompression ? ('compressed' as const) : ('decompressed' as const),
    valueCount: dictionaryHeader.num_values,
    nonNullValueCount: dictionaryHeader.num_values,
    data,
    values: preserveCompression ? undefined : createSection(0, data.byteLength),
    compressedByteLength: pageHeader.compressed_page_size,
    uncompressedByteLength: pageHeader.uncompressed_page_size
  });
}

/** Creates one V1 data-page descriptor and normalizes its length-prefixed level streams. */
async function createDataPageV1(
  compressedBody: Uint8Array,
  pageHeader: PageHeader,
  context: ParquetEncodedPageContext,
  pageOrdinal: number
): Promise<ParquetEncodedPage> {
  const dataHeader = pageHeader.data_page_header;
  if (!dataHeader) {
    throw new Error('Parquet V1 data page is missing its data header');
  }
  const preserveCompression = shouldPreserveCompression(context);
  const data = preserveCompression
    ? compressedBody
    : await decompressPageBody(compressedBody, pageHeader.uncompressed_page_size, context);
  let repetitionLevels: ParquetEncodedPageSection | undefined;
  let definitionLevels: ParquetEncodedPageSection | undefined;
  let values: ParquetEncodedPageSection | undefined;
  if (!preserveCompression) {
    let sectionOffset = 0;
    const repetitionLevelEncoding = getThriftEnum(Encoding, dataHeader.repetition_level_encoding);
    repetitionLevels = readV1LevelSection(
      data,
      sectionOffset,
      dataHeader.num_values,
      context.column.rLevelMax,
      repetitionLevelEncoding
    );
    sectionOffset = repetitionLevels.byteOffset + repetitionLevels.byteLength;
    const definitionLevelEncoding = getThriftEnum(Encoding, dataHeader.definition_level_encoding);
    definitionLevels = readV1LevelSection(
      data,
      sectionOffset,
      dataHeader.num_values,
      context.column.dLevelMax,
      definitionLevelEncoding
    );
    sectionOffset = definitionLevels.byteOffset + definitionLevels.byteLength;
    values = createSection(sectionOffset, data.byteLength - sectionOffset);
  }
  return Object.freeze({
    type: 'data-v1' as const,
    pageOrdinal,
    encoding: getThriftEnum(Encoding, dataHeader.encoding),
    repetitionLevelEncoding: getThriftEnum(Encoding, dataHeader.repetition_level_encoding),
    definitionLevelEncoding: getThriftEnum(Encoding, dataHeader.definition_level_encoding),
    compression: context.compression,
    compressionState: preserveCompression ? ('compressed' as const) : ('decompressed' as const),
    valueCount: dataHeader.num_values,
    data,
    repetitionLevels,
    definitionLevels,
    values,
    compressedByteLength: pageHeader.compressed_page_size,
    uncompressedByteLength: pageHeader.uncompressed_page_size
  });
}

/** Creates one V2 data-page descriptor whose level sections are already length-delimited. */
async function createDataPageV2(
  compressedBody: Uint8Array,
  pageHeader: PageHeader,
  context: ParquetEncodedPageContext,
  pageOrdinal: number
): Promise<ParquetEncodedPage> {
  const dataHeader = pageHeader.data_page_header_v2;
  if (!dataHeader) {
    throw new Error('Parquet V2 data page is missing its data header');
  }
  const repetitionByteLength = dataHeader.repetition_levels_byte_length;
  const definitionByteLength = dataHeader.definition_levels_byte_length;
  const levelsByteLength = repetitionByteLength + definitionByteLength;
  if (levelsByteLength > compressedBody.byteLength) {
    throw new Error('Parquet V2 level sections extend beyond the page body');
  }
  const valuesAreCompressed =
    dataHeader.is_compressed !== false && context.compression !== 'UNCOMPRESSED';
  const preserveCompression = valuesAreCompressed && shouldPreserveCompression(context);
  let data = compressedBody;
  if (valuesAreCompressed && !preserveCompression) {
    const uncompressedValuesByteLength = pageHeader.uncompressed_page_size - levelsByteLength;
    if (uncompressedValuesByteLength < 0) {
      throw new Error('Invalid Parquet V2 uncompressed value length');
    }
    const values = await context.decompressPage(
      compressedBody.subarray(levelsByteLength),
      uncompressedValuesByteLength
    );
    data = new Uint8Array(levelsByteLength + values.byteLength);
    data.set(compressedBody.subarray(0, levelsByteLength));
    data.set(values, levelsByteLength);
  }
  return Object.freeze({
    type: 'data-v2' as const,
    pageOrdinal,
    encoding: getThriftEnum(Encoding, dataHeader.encoding),
    repetitionLevelEncoding: 'RLE',
    definitionLevelEncoding: 'RLE',
    compression: context.compression,
    compressionState: preserveCompression ? ('compressed' as const) : ('decompressed' as const),
    valueCount: dataHeader.num_values,
    nonNullValueCount: dataHeader.num_values - dataHeader.num_nulls,
    data,
    repetitionLevels: createSection(0, repetitionByteLength),
    definitionLevels: createSection(repetitionByteLength, definitionByteLength),
    values: createSection(levelsByteLength, data.byteLength - levelsByteLength),
    compressedByteLength: pageHeader.compressed_page_size,
    uncompressedByteLength: pageHeader.uncompressed_page_size
  });
}

/** Returns whether the downstream decoder requested this nontrivial codec verbatim. */
function shouldPreserveCompression(context: ParquetEncodedPageContext): boolean {
  return (
    context.compression !== 'UNCOMPRESSED' &&
    Boolean(context.preserveCompression?.has(context.compression))
  );
}

/** Inflates a complete V1 or dictionary page body when its codec is not deferred. */
async function decompressPageBody(
  compressedBody: Uint8Array,
  uncompressedByteLength: number,
  context: ParquetEncodedPageContext
): Promise<Uint8Array> {
  if (context.compression === 'UNCOMPRESSED') return compressedBody;
  return await context.decompressPage(compressedBody, uncompressedByteLength);
}

/** Locates one V1 repetition/definition level stream without decoding its level values. */
function readV1LevelSection(
  data: Uint8Array,
  offset: number,
  valueCount: number,
  maxLevel: number,
  encoding: string
): ParquetEncodedPageSection {
  if (maxLevel === 0) return createSection(offset, 0);
  if (encoding === 'RLE') {
    if (offset + 4 > data.byteLength) {
      throw new Error('Parquet V1 RLE level stream is missing its length prefix');
    }
    const byteLength = readUInt32LE(data, offset);
    const byteOffset = offset + 4;
    assertSectionBounds(data, byteOffset, byteLength);
    return createSection(byteOffset, byteLength);
  }
  if (encoding === 'BIT_PACKED') {
    // Legacy BIT_PACKED levels are padded to complete groups of eight values. This differs from
    // simply rounding the total bit count and matters whenever bit width exceeds one.
    const byteLength = Math.ceil(valueCount / 8) * getBitWidth(maxLevel);
    assertSectionBounds(data, offset, byteLength);
    return createSection(offset, byteLength);
  }
  throw new Error(`Unsupported Parquet V1 level encoding ${encoding}`);
}

/** Creates an immutable section descriptor. */
function createSection(byteOffset: number, byteLength: number): ParquetEncodedPageSection {
  return Object.freeze({byteOffset, byteLength});
}

/** Validates a page section before exposing it to a deferred decoder. */
function assertSectionBounds(data: Uint8Array, byteOffset: number, byteLength: number): void {
  if (byteOffset < 0 || byteLength < 0 || byteOffset + byteLength > data.byteLength) {
    throw new Error('Parquet page section extends beyond the page body');
  }
}

/** Verifies a page checksum against its stored, still-compressed body. */
function verifyEncodedPageChecksum(
  compressedBody: Uint8Array,
  pageHeader: PageHeader,
  verifyPageChecksums = false
): void {
  if (!verifyPageChecksums || pageHeader.crc === undefined) return;
  const expected = pageHeader.crc >>> 0;
  const actual = crc32(compressedBody);
  if (actual !== expected) {
    throw new Error(`Parquet page checksum mismatch: expected ${expected}, calculated ${actual}`);
  }
}
