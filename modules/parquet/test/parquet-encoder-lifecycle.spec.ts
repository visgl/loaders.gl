// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import {expect, test, vi} from 'vitest';
import {ParquetEncoder, ParquetEnvelopeWriter} from '../src/parquetjs/encoder/parquet-encoder';
import {ParquetSchema} from '../src/parquetjs/schema/schema';
import type {ParquetLogicalType, SchemaDefinition} from '../src/parquetjs/schema/declare';
import {decodeFileMetadata} from '../src/parquetjs/utils/read-utils';

const schema = new ParquetSchema({value: {type: 'INT32'}});

/** Creates a minimal envelope writer whose lifecycle calls can be inspected. */
function createEnvelopeWriter() {
  return {
    writeHeader: vi.fn(async () => {}),
    writeRowGroup: vi.fn(async () => {}),
    writeFooter: vi.fn(async () => {}),
    close: vi.fn(async () => {}),
    setPageSize: vi.fn()
  };
}

test('ParquetEncoder flushes row groups, metadata, callbacks, and rejects reuse', async () => {
  const envelopeWriter = createEnvelopeWriter();
  const encoder = new ParquetEncoder(schema, envelopeWriter as any, {rowGroupSize: 2});
  await encoder.writeHeader();
  encoder.setMetadata('number', 42 as unknown as string);
  encoder.setRowGroupSize(2);
  encoder.setPageSize(17);

  await encoder.appendRow({value: 1});
  await encoder.appendRow({value: 2});
  expect(envelopeWriter.writeRowGroup).toHaveBeenCalledTimes(1);
  expect(encoder.rowBuffer.rowCount).toBe(0);

  await encoder.appendRow({value: 3});
  const callback = vi.fn();
  await encoder.close(callback);
  expect(envelopeWriter.writeRowGroup).toHaveBeenCalledTimes(2);
  expect(envelopeWriter.writeFooter).toHaveBeenCalledWith({number: '42'});
  expect(envelopeWriter.setPageSize).toHaveBeenCalledWith(17);
  expect(envelopeWriter.close).toHaveBeenCalledOnce();
  expect(callback).toHaveBeenCalledOnce();
  await expect(encoder.appendRow({value: 4})).rejects.toThrow('writer was closed');
  await expect(encoder.close()).rejects.toThrow('writer was closed');
});

test('ParquetEncoder closes its output when writing the header fails', async () => {
  const envelopeWriter = createEnvelopeWriter();
  envelopeWriter.writeHeader.mockRejectedValueOnce(new Error('header failed'));
  const encoder = Object.create(ParquetEncoder.prototype) as ParquetEncoder<unknown>;
  encoder.envelopeWriter = envelopeWriter as any;

  await expect(encoder.writeHeader()).rejects.toThrow('header failed');
  expect(envelopeWriter.close).toHaveBeenCalledOnce();
});

test('ParquetEnvelopeWriter supports empty, plain, and encrypted envelope boundaries', async () => {
  const chunks: Uint8Array[] = [];
  const close = vi.fn(async () => {});
  const writer = new ParquetEnvelopeWriter(
    schema,
    async chunk => {
      chunks.push(chunk);
    },
    close,
    5,
    {}
  );
  writer.setPageSize(23);
  await writer.writeHeader();
  await writer.writeFooter(null as unknown as Record<string, string>);
  await writer.close();

  expect(chunks.length).toBe(2);
  expect(writer.offset).toBeGreaterThan(5);
  expect(writer.pageSize).toBe(23);
  expect(close).toHaveBeenCalledOnce();
});

test('ParquetEnvelopeWriter serializes inferred and explicit modern logical types', async () => {
  const schemaDefinition: SchemaDefinition = {
    utf8: {type: 'UTF8'},
    enumValue: {type: 'ENUM'},
    decimal: {type: 'DECIMAL_INT64', precision: 18, scale: 3},
    date: {type: 'DATE'},
    timeMillis: {type: 'TIME_MILLIS'},
    timeMicros: {type: 'TIME_MICROS'},
    timeNanos: {type: 'TIME_NANOS'},
    timestampMillis: {type: 'TIMESTAMP_MILLIS'},
    timestampMicros: {type: 'TIMESTAMP_MICROS'},
    timestampNanos: {type: 'TIMESTAMP_NANOS'},
    unsigned: {type: 'UINT_16'},
    signed: {type: 'INT_64'},
    json: {type: 'JSON'},
    bson: {type: 'BSON'},
    uuid: {type: 'UUID'},
    float16: {type: 'FLOAT16'},
    unknown: {type: 'UNKNOWN'},
    variant: {type: 'VARIANT'},
    geometry: {type: 'GEOMETRY'},
    geography: {type: 'GEOGRAPHY'},
    unannotated: {type: 'INTERVAL'},
    map: {
      logicalType: {type: 'MAP'},
      fields: {key: {type: 'UTF8'}, value: {type: 'INT32', optional: true}}
    },
    list: {
      logicalType: {type: 'LIST'},
      fields: {element: {type: 'INT32', repeated: true}}
    },
    explicitString: {type: 'BYTE_ARRAY', logicalType: {type: 'STRING'}},
    explicitDecimal: {
      type: 'FIXED_LEN_BYTE_ARRAY',
      typeLength: 8,
      logicalType: {type: 'DECIMAL', precision: 12, scale: 2}
    },
    explicitTime: {
      type: 'INT64',
      logicalType: {type: 'TIME', unit: 'NANOS', isAdjustedToUTC: false}
    },
    explicitTimestamp: {
      type: 'INT64',
      logicalType: {type: 'TIMESTAMP', unit: 'MICROS', isAdjustedToUTC: false}
    },
    explicitInteger: {
      type: 'INT32',
      logicalType: {type: 'INTEGER', bitWidth: 8, isSigned: false}
    },
    explicitGeography: {
      type: 'BYTE_ARRAY',
      logicalType: {type: 'GEOGRAPHY', crs: 'OGC:CRS84', algorithm: 'KARNEY'}
    }
  };
  const chunks: Uint8Array[] = [];
  const writer = new ParquetEnvelopeWriter(
    new ParquetSchema(schemaDefinition),
    async chunk => chunks.push(chunk),
    async () => {},
    0,
    {}
  );

  await writer.writeHeader();
  await writer.writeFooter({suite: 'logical-types'});

  expect(chunks).toHaveLength(2);
  const footer = chunks[1].subarray(0, -8);
  const {metadata} = decodeFileMetadata(footer);
  const schemaElements = new Map(metadata.schema.map(element => [element.name, element]));
  const logicalTypeNames = Object.fromEntries(
    metadata.schema.slice(1).map(element => [
      element.name,
      element.logicalType
        ? Object.keys(element.logicalType).find(
            key => element.logicalType?.[key as keyof typeof element.logicalType] !== undefined
          )
        : undefined
    ])
  );
  expect(logicalTypeNames).toMatchObject({
    utf8: 'STRING',
    enumValue: 'ENUM',
    decimal: 'DECIMAL',
    date: 'DATE',
    timeMillis: 'TIME',
    timeMicros: 'TIME',
    timeNanos: 'TIME',
    timestampMillis: 'TIMESTAMP',
    timestampMicros: 'TIMESTAMP',
    timestampNanos: 'TIMESTAMP',
    unsigned: 'INTEGER',
    signed: 'INTEGER',
    json: 'JSON',
    bson: 'BSON',
    uuid: 'UUID',
    float16: 'FLOAT16',
    unknown: 'UNKNOWN',
    variant: 'VARIANT',
    geometry: 'GEOMETRY',
    geography: 'GEOGRAPHY',
    map: 'MAP',
    list: 'LIST',
    explicitString: 'STRING',
    explicitDecimal: 'DECIMAL',
    explicitTime: 'TIME',
    explicitTimestamp: 'TIMESTAMP',
    explicitInteger: 'INTEGER',
    explicitGeography: 'GEOGRAPHY'
  });
  expect(logicalTypeNames.unannotated).toBeUndefined();
  expect(schemaElements.get('decimal')?.logicalType?.DECIMAL).toMatchObject({
    precision: 18,
    scale: 3
  });
  expect(schemaElements.get('timeMillis')?.logicalType?.TIME).toMatchObject({
    isAdjustedToUTC: true,
    unit: {MILLIS: {}}
  });
  expect(schemaElements.get('explicitTime')?.logicalType?.TIME).toMatchObject({
    isAdjustedToUTC: false,
    unit: {NANOS: {}}
  });
  expect(schemaElements.get('explicitTimestamp')?.logicalType?.TIMESTAMP).toMatchObject({
    isAdjustedToUTC: false,
    unit: {MICROS: {}}
  });
  expect(schemaElements.get('explicitInteger')?.logicalType?.INTEGER).toMatchObject({
    bitWidth: 8,
    isSigned: false
  });
  expect(schemaElements.get('explicitGeography')?.logicalType?.GEOGRAPHY).toMatchObject({
    crs: 'OGC:CRS84'
  });
});

test.each([
  [{type: 'DECIMAL', precision: 4}, 'DECIMAL requires precision and scale'],
  [{type: 'INTEGER', bitWidth: 8}, 'INTEGER requires bitWidth and isSigned'],
  [{type: 'TIME'}, 'TIME and TIMESTAMP require a unit'],
  [{type: 'TIMESTAMP', unit: 'INVALID'}, 'TIME and TIMESTAMP require a unit'],
  [{type: 'INVALID'}, 'Unsupported Parquet logical type INVALID']
] as const)('ParquetEnvelopeWriter rejects invalid logical type %#', async (logicalType, message) => {
  const invalidSchema = new ParquetSchema({
    value: {type: 'INT32', logicalType: logicalType as unknown as ParquetLogicalType}
  });
  const writer = new ParquetEnvelopeWriter(
    invalidSchema,
    async () => {},
    async () => {},
    0,
    {}
  );

  await expect(writer.writeFooter({})).rejects.toThrow(message);
});
