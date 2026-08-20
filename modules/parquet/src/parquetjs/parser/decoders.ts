// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
// Copyright (c) 2017 ironSource Ltd.
// Forked from https://github.com/kbajalc/parquets under MIT license

import {
  ParquetCodec,
  ParquetColumnChunk,
  ParquetReaderContext,
  ParquetPageData,
  ParquetType,
  PrimitiveType,
  SchemaDefinition
} from '../schema/declare';
import {CursorBuffer, ParquetCodecOptions, PARQUET_CODECS} from '../codecs/index';
import type {ParquetValueBuffer} from '../codecs/declare';
import {
  ConvertedType,
  Encoding,
  FieldRepetitionType,
  PageHeader,
  PageType,
  SchemaElement,
  Type
} from '../parquet-thrift/index';
import {decompress} from '../compression';
import {PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING} from '../../lib/constants';
import {decodePageHeader, getThriftEnum, getBitWidth} from '../utils/read-utils';

/** Preallocated column destination used to bypass page-local value arrays. */
type ParquetPageDecodeTarget = {
  values: ParquetValueBuffer;
  valueOffset: number;
  dictionary: readonly unknown[];
};

/**
 * Decode data pages
 * @param buffer - input data
 * @param column - parquet column
 * @param compression - compression type
 * @returns parquet data page data
 */
export async function decodeDataPages(
  buffer: Uint8Array,
  context: ParquetReaderContext
): Promise<ParquetColumnChunk> {
  const cursor: CursorBuffer = {
    buffer,
    offset: 0,
    size: buffer.length
  };

  const expectedLevelCount =
    context.numValues === undefined ? undefined : Number(context.numValues);
  if (
    expectedLevelCount !== undefined &&
    (!Number.isSafeInteger(expectedLevelCount) || expectedLevelCount < 0)
  ) {
    throw new Error(`Invalid Parquet column value count ${expectedLevelCount}`);
  }

  const outputCapacity = expectedLevelCount ?? 0;
  const data: ParquetColumnChunk = {
    rlevels: new Array<number>(outputCapacity),
    dlevels: new Array<number>(outputCapacity),
    values: createParquetColumnValueBuffer(context, outputCapacity),
    pageHeaders: [],
    count: 0
  };

  let dictionary = context.dictionary || [];
  let levelOffset = 0;
  let valueOffset = 0;

  while (
    // @ts-ignore size can be undefined
    cursor.offset < cursor.size &&
    (expectedLevelCount === undefined || levelOffset < expectedLevelCount)
  ) {
    // Looks like we have to decode these in sequence due to cursor updates?
    const page = await decodePage(cursor, context, {
      values: data.values,
      valueOffset,
      dictionary
    });

    if (page.dictionary) {
      dictionary = page.dictionary;
      // eslint-disable-next-line no-continue
      continue;
    }

    for (let index = 0; index < page.rlevels.length; index++) {
      data.rlevels[levelOffset + index] = page.rlevels[index];
      data.dlevels[levelOffset + index] = page.dlevels[index];
    }
    levelOffset += page.rlevels.length;

    if (page.directValuesWritten !== undefined) {
      valueOffset += page.directValuesWritten;
    } else {
      const valueEncoding = getThriftEnum(
        Encoding,
        page.pageHeader.data_page_header?.encoding ?? page.pageHeader.data_page_header_v2?.encoding!
      ) as ParquetCodec;
      const usesDictionary =
        dictionary.length &&
        (valueEncoding === 'PLAIN_DICTIONARY' || valueEncoding === 'RLE_DICTIONARY');
      for (let index = 0; index < page.values.length; index++) {
        const value = usesDictionary ? dictionary[Number(page.values[index])] : page.values[index];
        if (value !== undefined) {
          data.values[valueOffset++] = value;
        }
      }
    }

    data.count += page.count;
    data.pageHeaders.push(page.pageHeader);
  }

  data.rlevels.length = levelOffset;
  data.dlevels.length = levelOffset;
  data.values = trimParquetValueBuffer(data.values, valueOffset);

  return data;
}

/**
 * Decode parquet page based on page type
 * @param cursor
 * @param context
 */
export async function decodePage(
  cursor: CursorBuffer,
  context: ParquetReaderContext,
  target?: ParquetPageDecodeTarget
): Promise<ParquetPageData> {
  let page;

  const {pageHeader, length} = decodePageHeader(cursor.buffer, cursor.offset);
  cursor.offset += length;

  const pageType = getThriftEnum(PageType, pageHeader.type);

  switch (pageType) {
    case 'DATA_PAGE':
      page = await decodeDataPage(cursor, pageHeader, context, target);
      break;
    case 'DATA_PAGE_V2':
      page = await decodeDataPageV2(cursor, pageHeader, context, target);
      break;
    case 'DICTIONARY_PAGE':
      page = {
        dictionary: await decodeDictionaryPage(cursor, pageHeader, context),
        pageHeader
      };
      break;
    default:
      throw new Error(`invalid page type: ${pageType}`);
  }

  return page;
}

/**
 * Decode parquet schema
 * @param schemaElements input schema elements data
 * @param offset offset to read from
 * @param len length of data
 * @returns result.offset
 *   result.next - offset at the end of function
 *   result.schema - schema read from the input data
 * @todo output offset is the same as input - possibly excess output field
 */
export function decodeSchema(
  schemaElements: SchemaElement[],
  offset: number,
  len: number
): {
  offset: number;
  next: number;
  schema: SchemaDefinition;
} {
  const schema: SchemaDefinition = {};
  let next = offset;
  for (let i = 0; i < len; i++) {
    const schemaElement = schemaElements[next];

    const repetitionType =
      next > 0 ? getThriftEnum(FieldRepetitionType, schemaElement.repetition_type!) : 'ROOT';

    let optional = false;
    let repeated = false;
    switch (repetitionType) {
      case 'REQUIRED':
        break;
      case 'OPTIONAL':
        optional = true;
        break;
      case 'REPEATED':
        repeated = true;
        break;
      default:
        throw new Error('parquet: unknown repetition type');
    }

    if (schemaElement.num_children! > 0) {
      const res = decodeSchema(schemaElements, next + 1, schemaElement.num_children!);
      next = res.next;
      schema[schemaElement.name] = {
        // type: undefined,
        optional,
        repeated,
        fields: res.schema
      };
    } else {
      const type = getThriftEnum(Type, schemaElement.type!);
      let logicalType = type;

      if (schemaElement.converted_type !== undefined && schemaElement.converted_type !== null) {
        logicalType = getThriftEnum(ConvertedType, schemaElement.converted_type);
      }

      switch (logicalType) {
        case 'DECIMAL':
          logicalType = `${logicalType}_${type}` as ParquetType;
          break;
        default:
      }

      schema[schemaElement.name] = {
        type: logicalType as ParquetType,
        typeLength: schemaElement.type_length,
        presision: schemaElement.precision,
        scale: schemaElement.scale,
        optional,
        repeated
      };
      next++;
    }
  }
  return {schema, offset, next};
}

/**
 * Decode a consecutive array of data using one of the parquet encodings
 */
function decodeValues(
  type: PrimitiveType,
  encoding: ParquetCodec,
  cursor: CursorBuffer,
  count: number,
  opts: ParquetCodecOptions
): ParquetValueBuffer {
  if (!(encoding in PARQUET_CODECS)) {
    throw new Error(`invalid encoding: ${encoding}`);
  }
  return PARQUET_CODECS[encoding].decodeValues(type, cursor, count, opts);
}

/**
 * Do decoding of parquet dataPage from column chunk
 * @param cursor
 * @param header
 * @param options
 */
async function decodeDataPage(
  cursor: CursorBuffer,
  header: PageHeader,
  context: ParquetReaderContext,
  target?: ParquetPageDecodeTarget
): Promise<ParquetPageData> {
  const cursorEnd = cursor.offset + header.compressed_page_size;
  const valueCount = header.data_page_header?.num_values;

  /* uncompress page */
  let dataCursor = cursor;

  if (context.compression !== 'UNCOMPRESSED') {
    const valuesBuf = await decompress(
      context.compression,
      cursor.buffer.slice(cursor.offset, cursorEnd),
      header.uncompressed_page_size
    );
    dataCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };
    cursor.offset = cursorEnd;
  }

  /* read repetition levels */
  const rLevelEncoding = getThriftEnum(
    Encoding,
    header.data_page_header?.repetition_level_encoding!
  ) as ParquetCodec;
  // tslint:disable-next-line:prefer-array-literal
  let rLevels = new Array(valueCount);

  if (context.column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, rLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(context.column.rLevelMax),
      disableEnvelope: false
      // column: opts.column
    }) as number[];
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  const dLevelEncoding = getThriftEnum(
    Encoding,
    header.data_page_header?.definition_level_encoding!
  ) as ParquetCodec;
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (context.column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, dLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(context.column.dLevelMax),
      disableEnvelope: false
      // column: opts.column
    }) as number[];
  } else {
    dLevels.fill(0);
  }
  let valueCountNonNull = 0;
  for (const dlvl of dLevels) {
    if (dlvl === context.column.dLevelMax) {
      valueCountNonNull++;
    }
  }

  /* read values */
  const valueEncoding = getThriftEnum(Encoding, header.data_page_header?.encoding!) as ParquetCodec;
  const decodeOptions: ParquetCodecOptions = {
    typeLength: context.column.typeLength,
    bitWidth: getValueBitWidth(context, valueEncoding),
    retainByteArrayViews: context.retainByteArrayViews,
    output: target?.values,
    outputOffset: target?.valueOffset,
    dictionary: isDictionaryEncoding(valueEncoding) ? target?.dictionary : undefined,
    int64AsBigInt: shouldDecodeInt64AsBigInt(context)
  };

  const values = decodeValues(
    context.column.primitiveType!,
    valueEncoding,
    dataCursor,
    valueCountNonNull,
    decodeOptions
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    directValuesWritten: target ? valueCountNonNull : undefined,
    count: valueCount!,
    pageHeader: header
  };
}

/**
 * Do decoding of parquet dataPage in version 2 from column chunk
 * @param cursor
 * @param header
 * @param opts
 * @returns
 */
async function decodeDataPageV2(
  cursor: CursorBuffer,
  header: PageHeader,
  context: ParquetReaderContext,
  target?: ParquetPageDecodeTarget
): Promise<ParquetPageData> {
  const dataPageHeader = header.data_page_header_v2;
  if (!dataPageHeader) {
    throw new Error('Missing Parquet data page v2 header');
  }
  const cursorEnd = cursor.offset + header.compressed_page_size;
  const levelsOffset = cursor.offset;
  const valueCount = dataPageHeader.num_values;
  const valueCountNonNull = valueCount - dataPageHeader.num_nulls;
  const valueEncoding = getThriftEnum(Encoding, dataPageHeader.encoding) as ParquetCodec;
  if (
    header.compressed_page_size < 0 ||
    cursorEnd > (cursor.size ?? cursor.buffer.length) ||
    valueCountNonNull < 0
  ) {
    throw new Error('Invalid Parquet data page v2 header');
  }

  /* read repetition levels */
  // tslint:disable-next-line:prefer-array-literal
  let rLevels = new Array(valueCount);
  if (context.column.rLevelMax > 0) {
    const repetitionLevelCursor = createPageSliceCursor(
      cursor,
      levelsOffset,
      dataPageHeader.repetition_levels_byte_length
    );
    rLevels = decodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      repetitionLevelCursor,
      valueCount,
      {
        bitWidth: getBitWidth(context.column.rLevelMax),
        disableEnvelope: true
      }
    ) as number[];
  } else {
    rLevels.fill(0);
  }
  const definitionLevelsOffset = levelsOffset + dataPageHeader.repetition_levels_byte_length;

  /* read definition levels */
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (context.column.dLevelMax > 0) {
    const definitionLevelCursor = createPageSliceCursor(
      cursor,
      definitionLevelsOffset,
      dataPageHeader.definition_levels_byte_length
    );
    dLevels = decodeValues(
      PARQUET_RDLVL_TYPE,
      PARQUET_RDLVL_ENCODING,
      definitionLevelCursor,
      valueCount,
      {
        bitWidth: getBitWidth(context.column.dLevelMax),
        disableEnvelope: true
      }
    ) as number[];
  } else {
    dLevels.fill(0);
  }

  /* read values */
  const valuesOffset = definitionLevelsOffset + dataPageHeader.definition_levels_byte_length;
  const valuesCompressedByteLength = cursorEnd - valuesOffset;
  const valuesUncompressedByteLength =
    header.uncompressed_page_size -
    dataPageHeader.repetition_levels_byte_length -
    dataPageHeader.definition_levels_byte_length;
  if (valuesCompressedByteLength < 0 || valuesUncompressedByteLength < 0) {
    throw new Error('Invalid Parquet data page v2 level lengths');
  }
  let valuesBuffer = cursor.buffer.subarray(valuesOffset, cursorEnd);

  if (dataPageHeader.is_compressed !== false && context.compression !== 'UNCOMPRESSED') {
    valuesBuffer = await decompress(
      context.compression,
      valuesBuffer,
      valuesUncompressedByteLength
    );
  }
  const valuesBufCursor = {buffer: valuesBuffer, offset: 0, size: valuesBuffer.length};
  cursor.offset = cursorEnd;

  const decodeOptions = {
    typeLength: context.column.typeLength,
    bitWidth: getValueBitWidth(context, valueEncoding),
    retainByteArrayViews: context.retainByteArrayViews,
    output: target?.values,
    outputOffset: target?.valueOffset,
    dictionary: isDictionaryEncoding(valueEncoding) ? target?.dictionary : undefined,
    int64AsBigInt: shouldDecodeInt64AsBigInt(context)
  };

  const values = decodeValues(
    context.column.primitiveType!,
    valueEncoding,
    valuesBufCursor,
    valueCountNonNull,
    decodeOptions
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    directValuesWritten: target ? valueCountNonNull : undefined,
    count: valueCount,
    pageHeader: header
  };
}

/** Returns whether an encoding stores RLE dictionary indices instead of physical values. */
function isDictionaryEncoding(encoding: ParquetCodec): boolean {
  return encoding === 'PLAIN_DICTIONARY' || encoding === 'RLE_DICTIONARY';
}

/** Preserves exact physical signed INT64 values in every output shape. */
function shouldDecodeInt64AsBigInt(context: ParquetReaderContext): boolean {
  return Boolean(
    context.column.primitiveType === 'INT64' &&
      (!context.column.originalType || context.column.originalType === 'INT_64')
  );
}

/** Allocates the narrowest lossless column buffer supported by the current JavaScript decoder. */
function createParquetColumnValueBuffer(
  context: ParquetReaderContext,
  capacity: number
): ParquetValueBuffer {
  if (!context.useTypedValueBuffers || capacity === 0) {
    return new Array<unknown>(capacity);
  }
  switch (context.column.primitiveType) {
    case 'BOOLEAN':
      return new Uint8Array(capacity);
    case 'INT32':
      return new Int32Array(capacity);
    case 'INT64':
      return !context.column.originalType || context.column.originalType === 'INT_64'
        ? new BigInt64Array(capacity)
        : new Float64Array(capacity);
    case 'INT96':
    case 'DOUBLE':
      return new Float64Array(capacity);
    case 'FLOAT':
      return new Float32Array(capacity);
    default:
      return new Array<unknown>(capacity);
  }
}

/** Restricts an overallocated typed column buffer to its decoded non-null values. */
function trimParquetValueBuffer(values: ParquetValueBuffer, length: number): ParquetValueBuffer {
  if (Array.isArray(values)) {
    values.length = length;
    return values;
  }
  return values.subarray(0, length) as ParquetValueBuffer;
}

/** Returns the physical value bit width required by encodings such as RLE BOOLEAN. */
function getValueBitWidth(
  context: ParquetReaderContext,
  encoding: ParquetCodec
): number | undefined {
  if (encoding === 'RLE' && context.column.primitiveType === 'BOOLEAN') {
    return 1;
  }
  return context.column.typeLength;
}

/** Creates a bounded cursor over one uncompressed data page v2 level section. */
function createPageSliceCursor(
  cursor: CursorBuffer,
  offset: number,
  byteLength: number
): CursorBuffer {
  const end = offset + byteLength;
  if (byteLength < 0 || end > (cursor.size ?? cursor.buffer.length)) {
    throw new Error('Invalid Parquet data page v2 level lengths');
  }
  const buffer = cursor.buffer.subarray(offset, end);
  return {buffer, offset: 0, size: buffer.length};
}

/**
 * Do decoding of dictionary page which helps to iterate over all indexes and get dataPage values.
 * @param cursor
 * @param pageHeader
 * @param context
 */
async function decodeDictionaryPage(
  cursor: CursorBuffer,
  pageHeader: PageHeader,
  context: ParquetReaderContext
): Promise<(string | ArrayBuffer)[]> {
  const cursorEnd = cursor.offset + pageHeader.compressed_page_size;

  let dictCursor: CursorBuffer = {
    offset: 0,
    buffer: cursor.buffer.slice(cursor.offset, cursorEnd),
    size: cursorEnd - cursor.offset
  };

  cursor.offset = cursorEnd;

  if (context.compression !== 'UNCOMPRESSED') {
    const valuesBuf = await decompress(
      context.compression,
      dictCursor.buffer.subarray(dictCursor.offset),
      pageHeader.uncompressed_page_size
    );

    dictCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };

    cursor.offset = cursorEnd;
  }

  const numValues = pageHeader?.dictionary_page_header?.num_values || 0;

  const decodedDictionaryValues = decodeValues(
    context.column.primitiveType!,
    context.column.encoding!,
    dictCursor,
    numValues,
    // TODO - this looks wrong?
    {...context, int64AsBigInt: shouldDecodeInt64AsBigInt(context)} as ParquetCodecOptions
  );

  return decodedDictionaryValues as (string | ArrayBuffer)[];
}
