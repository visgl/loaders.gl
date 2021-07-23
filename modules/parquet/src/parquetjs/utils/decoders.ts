// Forked from https://github.com/kbajalc/parquets under MIT license (Copyright (c) 2017 ironSource Ltd.)
import {
  ParquetCodec,
  ParquetCompression,
  ParquetData,
  ParquetField,
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
  column: ParquetField,
  compression: ParquetCompression
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
    count: 0
  };

  // @ts-ignore size can be undefined
  while (cursor.offset < cursor.size) {
    // const pageHeader = new parquet_thrift.PageHeader();
    // cursor.offset += parquet_util.decodeThrift(pageHeader, cursor.buffer);

    const {pageHeader, length} = decodePageHeader(cursor.buffer);
    cursor.offset += length;

    const pageType = getThriftEnum(PageType, pageHeader.type);

    let pageData: ParquetData | null = null;
    switch (pageType) {
      case 'DATA_PAGE':
        pageData = decodeDataPage(cursor, pageHeader, column, compression);
        break;
      case 'DATA_PAGE_V2':
        pageData = decodeDataPageV2(cursor, pageHeader, column, compression);
        break;
      default:
        throw new Error(`invalid page type: ${pageType}`);
    }

    Array.prototype.push.apply(data.rlevels, pageData.rlevels);
    Array.prototype.push.apply(data.dlevels, pageData.dlevels);
    Array.prototype.push.apply(data.values, pageData.values);
    data.count += pageData.count;
  }

  return data;
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

function decodeDataPage(
  cursor: CursorBuffer,
  header: PageHeader,
  column: ParquetField,
  compression: ParquetCompression
): ParquetData {
  const cursorEnd = cursor.offset + header.compressed_page_size;
  const valueCount = header.data_page_header?.num_values;

  // const info = {
  //   path: opts.column.path.join('.'),
  //   valueEncoding,
  //   dLevelEncoding,
  //   rLevelEncoding,
  //   cursorOffset: cursor.offset,
  //   cursorEnd,
  //   cusrorSize: cursor.size,
  //   header,
  //   opts,
  //   buffer: cursor.buffer.toJSON(),
  //   values: null as any[],
  //   valBuf: null as any
  // };
  // Fs.writeFileSync(`dump/${info.path}.ts.json`, JSON.stringify(info, null, 2));

  /* uncompress page */
  let dataCursor = cursor;
  if (compression !== 'UNCOMPRESSED') {
    const valuesBuf = decompress(
      compression,
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
  if (column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, rLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(column.rLevelMax),
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
  if (column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, dLevelEncoding, dataCursor, valueCount!, {
      bitWidth: getBitWidth(column.dLevelMax),
      disableEnvelope: false
      // column: opts.column
    });
  } else {
    dLevels.fill(0);
  }
  let valueCountNonNull = 0;
  for (const dlvl of dLevels) {
    if (dlvl === column.dLevelMax) {
      valueCountNonNull++;
    }
  }

  /* read values */
  const valueEncoding = getThriftEnum(Encoding, header.data_page_header?.encoding!) as ParquetCodec;
  const values = decodeValues(column.primitiveType!, valueEncoding, dataCursor, valueCountNonNull, {
    typeLength: column.typeLength,
    bitWidth: column.typeLength
  });

  // info.valBuf = uncursor.buffer.toJSON();
  // info.values = values;
  // Fs.writeFileSync(`dump/${info.path}.ts.json`, JSON.stringify(info, null, 2));

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount!
  };
}

function decodeDataPageV2(
  cursor: CursorBuffer,
  header: PageHeader,
  column: ParquetField,
  compression: ParquetCompression
): ParquetData {
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
  if (column.rLevelMax > 0) {
    rLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: getBitWidth(column.rLevelMax),
      disableEnvelope: true
    });
  } else {
    rLevels.fill(0);
  }

  /* read definition levels */
  // tslint:disable-next-line:prefer-array-literal
  let dLevels = new Array(valueCount);
  if (column.dLevelMax > 0) {
    dLevels = decodeValues(PARQUET_RDLVL_TYPE, PARQUET_RDLVL_ENCODING, cursor, valueCount!, {
      bitWidth: getBitWidth(column.dLevelMax),
      disableEnvelope: true
    });
  } else {
    dLevels.fill(0);
  }

  /* read values */
  let valuesBufCursor = cursor;

  if (header.data_page_header_v2?.is_compressed) {
    const valuesBuf = decompress(
      compression,
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

  const values = decodeValues(
    column.primitiveType!,
    valueEncoding,
    valuesBufCursor,
    valueCountNonNull,
    {
      typeLength: column.typeLength,
      bitWidth: column.typeLength
    }
  );

  return {
    dlevels: dLevels,
    rlevels: rLevels,
    values,
    count: valueCount!
  };
}
