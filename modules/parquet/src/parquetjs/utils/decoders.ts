// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {
  ParquetCodec,
  ParquetData,
  ParquetOptions,
  ParquetPageData,
  ParquetType,
  PrimitiveType,
  SchemaDefinition
} from '../schema/declare';
import {CursorBuffer, ParquetCodecOptions, PARQUET_CODECS} from '../codecs';
import {
  ConvertedType,
  Encoding,
  FieldRepetitionType,
  PageHeader,
  PageType,
  SchemaElement,
  Type
} from '../parquet-thrift';
import {decompress} from '../compression';
import {PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING} from '../../constants';
import {decodePageHeader, getThriftEnum, getBitWidth} from './read-utils';
// import Fs = require('fs');

/**
 * Decode data pages
 * @param buffer - input data
 * @param column - parquet column
 * @param compression - compression type
 * @returns parquet data page data
 */
export async function decodeDataPages(
  buffer: Buffer,
  options: ParquetOptions
): Promise<ParquetData> {
  const cursor: CursorBuffer = {
    buffer,
    offset: 0,
    size: buffer.length
  };

  const data: ParquetData = {
    rlevels: [],
    dlevels: [],
    values: [],
    pageHeaders: [],
    count: 0
  };

  let dictionary = options.dictionary || [];

  while (
    // @ts-ignore size can be undefined
    cursor.offset < cursor.size &&
    (!options.numValues || data.dlevels.length < Number(options.numValues))
  ) {
    const page = decodePage(cursor, options);

    if (page.dictionary) {
      dictionary = page.dictionary;
      // eslint-disable-next-line no-continue
      continue;
    }

    if (dictionary.length) {
      // eslint-disable-next-line no-loop-func
      page.values = page.values.map((value) => dictionary[value]);
    }

    for (let index = 0; index < page.rlevels.length; index++) {
      data.rlevels.push(page.rlevels[index]);
      data.dlevels.push(page.dlevels[index]);
      const value = page.values[index];

      if (value !== undefined) {
        data.values.push(value);
      }
    }

    data.count += page.count;
    data.pageHeaders.push(page.pageHeader);
  }

  return data;
}

/**
 * Decode parquet page based on page type
 * @param cursor
 * @param options
 */
export function decodePage(cursor: CursorBuffer, options: ParquetOptions): ParquetPageData {
  let page;
  const {pageHeader, length} = decodePageHeader(cursor.buffer);
  cursor.offset += length;

  const pageType = getThriftEnum(PageType, pageHeader.type);

  switch (pageType) {
    case 'DATA_PAGE':
      page = decodeDataPage(cursor, pageHeader, options);
      break;
    case 'DATA_PAGE_V2':
      page = decodeDataPageV2(cursor, pageHeader, options);
      break;
    case 'DICTIONARY_PAGE':
    case 'RLE_DICTIONARY':
      page = {
        dictionary: decodeDictionaryPage(cursor, pageHeader, options),
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
      let logicalType = getThriftEnum(Type, schemaElement.type!);

      if (schemaElement.converted_type) {
        logicalType = getThriftEnum(ConvertedType, schemaElement.converted_type);
      }

      schema[schemaElement.name] = {
        type: logicalType as ParquetType,
        typeLength: schemaElement.type_length,
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
): any[] {
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
function decodeDataPage(
  cursor: CursorBuffer,
  header: PageHeader,
  options: ParquetOptions
): ParquetPageData {
  const cursorEnd = cursor.offset + header.compressed_page_size;
  const valueCount = header.data_page_header?.num_values;

  /* uncompress page */
  let dataCursor = cursor;

  if (options.compression !== 'UNCOMPRESSED') {
    const valuesBuf = decompress(
      options.compression,
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

  if (options.column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, rLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(options.column.rLevelMax),
      disableEnvelope: false
      // column: opts.column
    });
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
  if (options.column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, dLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(options.column.dLevelMax),
      disableEnvelope: false
      // column: opts.column
    });
  } else {
    dLevels.fill(0);
  }
  let valueCountNonNull = 0;
  for (const dlvl of dLevels) {
    if (dlvl === options.column.dLevelMax) {
      valueCountNonNull++;
    }
  }

  /* read values */
  const valueEncoding = getThriftEnum(Encoding, header.data_page_header?.encoding!) as ParquetCodec;
  const decodeOptions = {
    typeLength: options.column.typeLength,
    bitWidth: options.column.typeLength
  };

  const values = decodeValues(
    options.column.primitiveType!,
    valueEncoding,
    dataCursor,
    valueCountNonNull,
    decodeOptions
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
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
function decodeDataPageV2(cursor: CursorBuffer, header: PageHeader, opts: any): ParquetPageData {
  const cursorEnd = cursor.offset + header.compressed_page_size;

  const valueCount = header.data_page_header_v2?.num_values;
  // @ts-ignore
  const valueCountNonNull = valueCount - header.data_page_header_v2?.num_nulls;
  const valueEncoding = getThriftEnum(
    Encoding,
    header.data_page_header_v2?.encoding!
  ) as ParquetCodec;

  /* read repetition levels */
  // tslint:disable-next-line:prefer-array-literal
  let rLevels = new Array(valueCount);
  if (opts.column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: getBitWidth(opts.column.rLevelMax),
      disableEnvelope: true
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (opts.column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: getBitWidth(opts.column.dLevelMax),
      disableEnvelope: true
    });
  } else {
    dLevels.fill(0);
  }

  /* read values */
  let valuesBufCursor = cursor;

  if (header.data_page_header_v2?.is_compressed) {
    const valuesBuf = decompress(
      opts.compression,
      cursor.buffer.slice(cursor.offset, cursorEnd),
      header.uncompressed_page_size
    );

    valuesBufCursor = {
      buffer: valuesBuf,
      offset: 0,
      size: valuesBuf.length
    };

    cursor.offset = cursorEnd;
  }

  const decodeOptions = {
    typeLength: opts.column.typeLength,
    bitWidth: opts.column.typeLength
  };

  const values = decodeValues(
    opts.column.primitiveType!,
    valueEncoding,
    valuesBufCursor,
    valueCountNonNull,
    decodeOptions
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount!,
    pageHeader: header
  };
}

/**
 * Do decoding of dictionary page which helps to iterate over all indexes and get dataPage values.
 * @param cursor
 * @param pageHeader
 * @param options
 */
function decodeDictionaryPage(
  cursor: CursorBuffer,
  pageHeader: PageHeader,
  options: ParquetOptions
): string[] {
  const cursorEnd = cursor.offset + pageHeader.compressed_page_size;

  let dictCursor = {
    offset: 0,
    buffer: cursor.buffer.slice(cursor.offset, cursorEnd),
    size: cursorEnd - cursor.offset
  };

  cursor.offset = cursorEnd;

  if (options.compression !== 'UNCOMPRESSED') {
    const valuesBuf = decompress(
      options.compression,
      cursor.buffer.slice(cursor.offset, cursorEnd),
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

  return decodeValues(
    options.column.primitiveType!,
    options.column.encoding!,
    dictCursor,
    numValues,
    options as ParquetCodecOptions
  ).map((d) => d.toString());
}
