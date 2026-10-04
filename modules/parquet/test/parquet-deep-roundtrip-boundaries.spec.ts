// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {beforeAll, expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {BlobFile} from '@loaders.gl/loader-utils';
import type {DataType, Field, ObjectRowTable} from '@loaders.gl/schema';
import {encodeTableToParquetJs} from '../src/lib/encoders/encode-table-to-parquet-js';
import {parseParquetFileToArrowWithJs} from '../src/lib/parsers/parse-parquet-to-arrow-js';
import {ParquetSource} from '../src/parquet-source-loader';
import {EdgeInterpolationAlgorithm} from '../src/parquetjs/parquet-thrift';

const inferredValues = {
  active: true,
  count: 17,
  measurement: 1.25,
  label: 'four',
  timestamp: new Date(123456),
  payload: Uint8Array.of(1, 2, 3, 4, 5)
};
const inferredInput: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: Object.keys(inferredValues).map((name) => ({
      name,
      type: 'null' as const,
      nullable: true
    })),
    metadata: {}
  },
  data: [
    Object.fromEntries(Object.keys(inferredValues).map((name) => [name, null])),
    inferredValues,
    inferredValues
  ]
};
const logicalInput: ObjectRowTable = {
  shape: 'object-row-table',
  schema: {
    fields: [
      {name: 'date', type: 'date-day', nullable: true},
      {name: 'timeMillis', type: 'time-millisecond', nullable: true},
      {name: 'timeMicros', type: 'time-microsecond', nullable: true},
      {name: 'timeNanos', type: 'time-nanosecond', nullable: true},
      {name: 'timestampMicros', type: 'timestamp-microsecond', nullable: true},
      {name: 'timestampNanos', type: 'timestamp-nanosecond', nullable: true},
      {
        name: 'decimal32',
        type: {type: 'decimal', bitWidth: 128, precision: 9, scale: 2},
        nullable: true
      },
      {
        name: 'decimal256',
        type: {type: 'decimal', bitWidth: 256, precision: 40, scale: 0},
        nullable: true
      },
      {name: 'half', type: 'float16', nullable: true},
      {name: 'unsigned64', type: 'uint64', nullable: true}
    ],
    metadata: {suite: 'logical-slices'}
  },
  data: [
    {
      date: -1,
      timeMillis: 1234,
      timeMicros: 1234567n,
      timeNanos: 1234567890n,
      timestampMicros: -1234567n,
      timestampNanos: -1234567890n,
      decimal32: -12.34,
      decimal256: -(10n ** 35n),
      half: -1.5,
      unsigned64: 18446744073709551615n
    },
    {
      date: null,
      timeMillis: null,
      timeMicros: null,
      timeNanos: null,
      timestampMicros: null,
      timestampNanos: null,
      decimal32: null,
      decimal256: null,
      half: null,
      unsigned64: null
    },
    {
      date: 1,
      timeMillis: 2345,
      timeMicros: 2345678n,
      timeNanos: 2345678901n,
      timestampMicros: 2345678n,
      timestampNanos: 2345678901n,
      decimal32: 56.78,
      decimal256: 10n ** 35n,
      half: 2.25,
      unsigned64: 2n
    }
  ]
};

let inferredFixture: ArrayBuffer;
let logicalFixture: ArrayBuffer;
let nestedFixture: ArrayBuffer;
let spatialFixture: ArrayBuffer;
let geographyFixture: ArrayBuffer;
const fixedFixtures: ArrayBuffer[] = [];
const fixedValues = [Uint8Array.of(1, 2, 3, 4, 5), Uint8Array.of(6, 7, 8, 9, 10)];

beforeAll(async () => {
  inferredFixture = await encodeTableToParquetJs(inferredInput, inferredInput, {
    parquet: {dictionary: false, pageSize: 2}
  });
  logicalFixture = await encodeTableToParquetJs(logicalInput, logicalInput, {
    parquet: {dictionary: false}
  });
  const nestedInput: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'properties',
          nullable: true,
          type: {
            type: 'struct',
            children: [
              {name: 'label', type: 'utf8', nullable: true},
              {
                name: 'values',
                nullable: true,
                type: {type: 'list', children: [{name: 'element', type: 'float16', nullable: true}]}
              },
              {
                name: 'attributes',
                nullable: true,
                type: {
                  type: 'map',
                  keysSorted: false,
                  children: [
                    {name: 'key', type: 'null', nullable: false},
                    {name: 'value', type: 'null', nullable: true}
                  ]
                }
              }
            ]
          }
        }
      ],
      metadata: {}
    },
    data: [
      {
        properties: {
          label: 'first',
          values: [1.5, null, -2.25],
          attributes: [
            ['first', 1],
            ['second', null]
          ]
        }
      },
      {properties: {label: null, values: [], attributes: [{key: 'third', value: 3}]}},
      {properties: null}
    ]
  };
  nestedFixture = await encodeTableToParquetJs(nestedInput, nestedInput, {
    parquet: {dictionary: false}
  });
  const spatialInput: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          nullable: false,
          metadata: {'ARROW:extension:name': 'geoarrow.wkb'}
        }
      ],
      metadata: {}
    },
    data: [{geometry: createPointZM(1, 2, 3, 4)}, {geometry: createPointZM(-1, -2, -3, -4)}]
  };
  spatialFixture = await encodeTableToParquetJs(spatialInput, spatialInput, {
    parquet: {dictionary: false, pageSize: 1}
  });
  const geographyInput: ObjectRowTable = {
    ...spatialInput,
    schema: {
      fields: [{name: 'geometry', type: 'binary', nullable: false}],
      metadata: {
        geo: JSON.stringify({
          version: '2.0.0',
          primary_column: 'geometry',
          columns: {
            geometry: {encoding: 'WKB', geometry_types: ['Point ZM'], crs: null, edges: 'spherical'}
          }
        })
      }
    }
  };
  geographyFixture = await encodeTableToParquetJs(geographyInput, geographyInput, {});
  const fixedInput: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {
      fields: [
        {name: 'required', type: {type: 'fixed-size-binary', byteWidth: 5}, nullable: false},
        {name: 'optional', type: {type: 'fixed-size-binary', byteWidth: 5}, nullable: true}
      ],
      metadata: {}
    },
    data: [
      {required: fixedValues[0], optional: fixedValues[0]},
      {required: fixedValues[1], optional: null},
      {required: fixedValues[0], optional: fixedValues[1]}
    ]
  };
  for (const dictionary of [false, true])
    fixedFixtures.push(
      await encodeTableToParquetJs(fixedInput, fixedInput, {
        parquet: {dictionary, pageSize: dictionary ? 1 : 3}
      })
    );
});

test('inferred nullable primitives roundtrip through direct Arrow buffers after an initial null', async () => {
  const table = await parseParquetFileToArrowWithJs(new BlobFile(inferredFixture));
  expect(table.data.numRows).toBe(3);
  expect(table.data.schema.fields.map((field) => field.type.constructor)).toEqual([
    arrow.Bool,
    arrow.Int32,
    arrow.Float64,
    arrow.Utf8,
    arrow.TimestampMillisecond,
    arrow.Binary
  ]);
  expect(Array.from(table.data.getChild('active')!)).toEqual([null, true, true]);
  expect(Array.from(table.data.getChild('count')!)).toEqual([null, 17, 17]);
  expect(Array.from(table.data.getChild('measurement')!)).toEqual([null, 1.25, 1.25]);
  expect(Array.from(table.data.getChild('label')!)).toEqual([null, 'four', 'four']);
  expect(Array.from(table.data.getChild('timestamp')!)).toEqual([null, 123456, 123456]);
  expect(Array.from(table.data.getChild('payload')!)).toEqual([
    null,
    inferredValues.payload,
    inferredValues.payload
  ]);
  const slice = await parseParquetFileToArrowWithJs(new BlobFile(inferredFixture), {
    parquet: {offset: 1, limit: 1}
  });
  expect(Array.from(slice.data.getChild('label')!)).toEqual(['four']);
  expect(slice.data.getChild('payload')!.get(0)).toEqual(inferredValues.payload);
});

test.each([
  0, 1
])('nullable logical Arrow buffers preserve exact physical values at offset %i', async (offset) => {
  const table = await parseParquetFileToArrowWithJs(new BlobFile(logicalFixture), {
    parquet: {offset, batchSize: 3}
  });
  const expectedRows = logicalInput.data.slice(offset);
  for (const name of [
    'timeMillis',
    'timeMicros',
    'timeNanos',
    'timestampMicros',
    'timestampNanos',
    'unsigned64'
  ]) {
    const vector = table.data.getChild(name)!;
    const physicalValues = vector.data[0].values;
    for (let index = 0; index < expectedRows.length; index++) {
      if (expectedRows[index][name] === null) expect(vector.isValid(index)).toBe(false);
      else expect(physicalValues[index]).toBe(expectedRows[index][name]);
    }
  }
  expect(Array.from(table.data.getChild('date')!)).toEqual(
    expectedRows.map((row) => (row.date === null ? null : Number(row.date) * 86400000))
  );
  expect(Array.from(table.data.getChild('half')!)).toEqual(expectedRows.map((row) => row.half));
  for (const [name, bitWidth, expectedValues] of [
    ['decimal32', 128, [-1234n, null, 5678n]],
    ['decimal256', 256, [-(10n ** 35n), null, 10n ** 35n]]
  ] as const) {
    const vector = table.data.getChild(name)!;
    expect(vector.type).toMatchObject({bitWidth});
    for (const [index, expectedValue] of expectedValues.slice(offset).entries()) {
      if (expectedValue === null) expect(vector.isValid(index)).toBe(false);
      else expect(readDecimal(vector, index, bitWidth)).toBe(expectedValue);
    }
  }
});

test('nested collection normalization retains struct nulls, nullable list elements and both map input forms', async () => {
  const table = await parseParquetFileToArrowWithJs(new BlobFile(nestedFixture));
  const vector = table.data.getChild('properties')!;
  const first = vector.get(0);
  const second = vector.get(1);
  expect(first.label).toBe('first');
  expect(Array.from(first.values)).toEqual([1.5, null, -2.25]);
  expect(first.attributes.toJSON()).toEqual({first: 1, second: null});
  expect(second.label).toBeNull();
  expect(Array.from(second.values)).toEqual([]);
  expect(second.attributes.toJSON()).toEqual({third: 3});
  expect(vector.get(2)).toBeNull();
});

test('Arrow schemas retain normal public assignment semantics after record batch construction', async () => {
  const table = await parseParquetFileToArrowWithJs(new BlobFile(inferredFixture));
  const schema = table.data.schema;
  const unchanged = schema.assign(schema);
  expect(unchanged).not.toBe(schema);
  expect(unchanged.fields.map((field) => field.name)).toEqual(
    schema.fields.map((field) => field.name)
  );
  const appended = schema.assign(new arrow.Field('extra', new arrow.Int32(), true));
  expect(appended.fields.at(-1)?.name).toBe('extra');
  expect(schema.fields).toHaveLength(6);
});

test('native geometry merges XYZM extrema and roundtrips the original WKB bytes', async () => {
  const source = new ParquetSource(new Blob([spatialFixture]), {core: {worker: false}});
  try {
    const metadata = await source.getMetadata({formatSpecificMetadata: true});
    expect(metadata.rowGroups[0].columns[0].geospatialStatistics).toEqual({
      bbox: {xmin: -1, xmax: 1, ymin: -2, ymax: 2, zmin: -3, zmax: 3, mmin: -4, mmax: 4},
      geometryTypes: [3001]
    });
    const schema = await source.getSchema();
    expect(schema.fields[0]).toMatchObject({name: 'geometry', type: 'binary'});
    expect(
      metadata.formatSpecificMetadata!.schema.find((field) => field.name === 'geometry')!
        .logicalType!.GEOMETRY
    ).toBeDefined();
    const query = await source.getQueryMetadata();
    expect(query.columns[0]).toMatchObject({name: 'geometry', role: 'geometry'});
    const output = await parseParquetFileToArrowWithJs(new BlobFile(spatialFixture));
    expect(Array.from(output.data.getChild('geometry')!)).toEqual([
      createPointZM(1, 2, 3, 4),
      createPointZM(-1, -2, -3, -4)
    ]);
    const pages = [];
    for await (const batch of source.readPages({
      columns: ['geometry'],
      bbox: [0, 0, 2, 3],
      geometryColumn: 'geometry'
    }))
      pages.push(batch);
    expect(pages).toHaveLength(1);
    expect(pages[0].filterColumns).toEqual(['geometry']);
    expect(pages[0].residualFilter).toEqual({
      predicate: undefined,
      bbox: [0, 0, 2, 3],
      geometryColumn: 'geometry'
    });
  } finally {
    await source.close();
  }
});

test('native GeoParquet geography retains unknown CRS and spherical edges without writing unsafe vertex bounds', async () => {
  const source = new ParquetSource(new Blob([geographyFixture]), {core: {worker: false}});
  try {
    const metadata = await source.getMetadata({formatSpecificMetadata: true});
    expect(metadata.rowGroups[0].columns[0].geospatialStatistics).toEqual({
      bbox: undefined,
      geometryTypes: [3001]
    });
    expect(
      metadata.formatSpecificMetadata!.schema.find((field) => field.name === 'geometry')!
        .logicalType!.GEOGRAPHY
    ).toMatchObject({crs: 'srid:0', algorithm: EdgeInterpolationAlgorithm.SPHERICAL});
  } finally {
    await source.close();
  }
});

test.each([
  0, 1
])('fixed-width Binary preserves bytes and null alignment with dictionary fixture %i', async (fixtureIndex) => {
  const table = await parseParquetFileToArrowWithJs(new BlobFile(fixedFixtures[fixtureIndex]));
  expect(Array.from(table.data.getChild('required')!)).toEqual([
    fixedValues[0],
    fixedValues[1],
    fixedValues[0]
  ]);
  expect(Array.from(table.data.getChild('optional')!)).toEqual([
    fixedValues[0],
    null,
    fixedValues[1]
  ]);
  const slice = await parseParquetFileToArrowWithJs(new BlobFile(fixedFixtures[fixtureIndex]), {
    parquet: {offset: 1, limit: 2}
  });
  expect(Array.from(slice.data.getChild('optional')!)).toEqual([null, fixedValues[1]]);
});

test.each([
  ['bloomFilter', {bloomFilter: {missing: true}}, 'Unknown Bloom-filter column'],
  ['pageIndex', {pageIndex: {missing: true}}, 'Unknown page-index column']
] as const)('writer validates %s overrides before producing data pages', async (_name, parquet, message) => {
  await expect(encodeTableToParquetJs(inferredInput, inferredInput, {parquet})).rejects.toThrow(
    message
  );
});

test.each([
  ['null', 'Unable to infer'],
  ['duration-second', 'Unsupported field'],
  [{type: 'list', children: []}, 'has no value child'],
  [
    {
      type: 'map',
      keysSorted: false,
      children: [
        {name: 'key', type: 'utf8', nullable: true},
        {name: 'value', type: 'int32'}
      ]
    },
    'Map keys must be non-nullable'
  ],
  [{type: 'decimal', bitWidth: 256, precision: 100, scale: 0}, 'exceeds 32 bytes'],
  [
    {type: 'fixed-size-list', listSize: 1, children: [{name: 'element', type: 'int32'}]},
    'Unsupported field'
  ]
] as const)('writer rejects schema boundary %# without silently selecting a different physical type', async (type, message) => {
  const field: Field = {name: 'value', type: type as DataType, nullable: true};
  const input: ObjectRowTable = {
    shape: 'object-row-table',
    schema: {fields: [field], metadata: {}},
    data: [{value: null}]
  };
  await expect(encodeTableToParquetJs(input, input, {})).rejects.toThrow(message);
});

/** Creates a standards-conforming little-endian ISO WKB Point ZM in 37 bytes. */
function createPointZM(
  longitude: number,
  latitude: number,
  altitude: number,
  measure: number
): Uint8Array {
  const bytes = new Uint8Array(37);
  const view = new DataView(bytes.buffer);
  bytes[0] = 1;
  view.setUint32(1, 3001, true);
  for (const [index, value] of [longitude, latitude, altitude, measure].entries())
    view.setFloat64(5 + index * 8, value, true);
  return bytes;
}

/** Reads one Arrow decimal's little-endian words as an exact signed unscaled integer. */
function readDecimal(vector: arrow.Vector, rowIndex: number, bitWidth: 128 | 256): bigint {
  const words = vector.data[0].values as Uint32Array;
  const wordCount = bitWidth / 32;
  let value = 0n;
  for (let wordIndex = wordCount - 1; wordIndex >= 0; wordIndex--)
    value = (value << 32n) | BigInt(words[rowIndex * wordCount + wordIndex]);
  return BigInt.asIntN(bitWidth, value);
}
