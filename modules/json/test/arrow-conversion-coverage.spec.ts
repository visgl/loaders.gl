// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import type {Feature, Schema, TableBatch} from '@loaders.gl/schema';
import {
  convertGeoJSONFeaturesToArrowTable,
  convertRowTableToArrowTable,
  convertTableBatchesToArrow,
  makeNDJSONArrowBatchIterator,
  normalizeJSONArrowSchema,
  validateRowTableAgainstArrowSchema
} from '../src/lib/parsers/convert-row-table-to-arrow';

async function* yieldBatches(batches: any[]): AsyncIterable<any> {
  yield* batches;
}

test('JSON Arrow conversion infers nested, nullable, list, and temporal fields', () => {
  const table = convertRowTableToArrowTable({
    shape: 'object-row-table',
    data: [
      {
        id: 1,
        active: true,
        created: new Date('2020-01-01T00:00:00Z'),
        tags: ['a', null],
        profile: {name: 'Ada'},
        optional: null
      },
      {
        id: 2,
        active: false,
        created: new Date('2020-01-02T00:00:00Z'),
        tags: ['b'],
        profile: {name: 'Grace', score: 10},
        extra: 'later'
      }
    ]
  } as any);

  expect(table.data.numRows).toBe(2);
  expect(table.schema?.fields.map(field => field.name)).toEqual([
    'id',
    'active',
    'created',
    'tags',
    'profile',
    'optional',
    'extra'
  ]);
  expect(table.data.getChild('tags')?.get(0)?.toArray()).toEqual(['a', null]);
  expect(table.data.getChild('profile')?.get(1)).toMatchObject({name: 'Grace', score: 10});
});

test('JSON Arrow conversion infers array rows and rejects incompatible inferred shapes', () => {
  const table = convertRowTableToArrowTable({
    shape: 'array-row-table',
    data: [[1, 'one'], [2], [3, 'three', true]]
  } as any);
  expect(table.schema?.fields.map(field => [field.name, field.nullable])).toEqual([
    ['column-0', true],
    ['column-1', true],
    ['column-2', true]
  ]);
  expect(table.data.numRows).toBe(3);

  expect(() =>
    convertRowTableToArrowTable({
      shape: 'object-row-table',
      data: [{value: 1}, {value: 'one'}]
    } as any)
  ).toThrow(/incompatible Arrow field types/);
  expect(() =>
    convertRowTableToArrowTable({
      shape: 'object-row-table',
      data: [{value: []}, {value: {nested: true}}]
    } as any)
  ).toThrow(/list vs struct/);
  expect(() =>
    convertRowTableToArrowTable({shape: 'object-row-table', data: [{value: Symbol('x')}]} as any)
  ).toThrow(/Unsupported JSON value type/);
});

test('JSON Arrow conversion handles empty schemas and extra-field policies', () => {
  const emptySchema: Schema = {fields: [], metadata: {source: 'empty'}};
  const empty = convertRowTableToArrowTable({shape: 'object-row-table', data: [{}, {}]} as any, {
    schema: emptySchema
  });
  expect(empty.data.numRows).toBe(2);
  expect(empty.schema?.metadata).toEqual({source: 'empty'});

  expect(() =>
    convertRowTableToArrowTable({shape: 'array-row-table', data: [[1]]} as any, {
      schema: emptySchema
    })
  ).toThrow(/unexpected column index 0/);
  expect(() =>
    convertRowTableToArrowTable({shape: 'object-row-table', data: [{extra: true}]} as any, {
      schema: emptySchema
    })
  ).toThrow(/unexpected field extra/);
  const dropped = convertRowTableToArrowTable({shape: 'array-row-table', data: [[1, 2]]} as any, {
    schema: emptySchema,
    arrowConversion: {onExtraField: 'drop', logRecoveries: false}
  });
  expect(dropped.data.numRows).toBe(1);
});

test('JSON Arrow conversion normalizes nested schema recovery policies', () => {
  const schema: Schema = {
    fields: [
      {
        name: 'items',
        nullable: true,
        type: {type: 'list', children: [{name: 'item', type: 'float64', nullable: true}]}
      },
      {
        name: 'profile',
        nullable: true,
        type: {
          type: 'struct',
          children: [
            {name: 'name', type: 'utf8', nullable: false},
            {name: 'score', type: 'int8', nullable: true}
          ]
        }
      }
    ],
    metadata: {}
  };
  const messages: string[] = [];
  const table = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [
        {items: [1, 'bad'], profile: {name: 'Ada', score: 130.4, ignored: true}},
        {items: 'bad', profile: null}
      ]
    } as any,
    {
      schema,
      arrowConversion: {
        onTypeMismatch: 'null',
        onExtraField: 'drop',
        integerConversion: 'warn'
      },
      log: {warn: (message: string) => () => messages.push(message)}
    }
  );
  expect(table.data.numRows).toBe(2);
  expect(table.data.getChild('items')?.get(1)).toBe(null);
  expect(table.data.getChild('profile')?.get(0)?.score).toBe(127);
  expect(messages.length).toBe(4);

  expect(() =>
    validateRowTableAgainstArrowSchema(
      {shape: 'object-row-table', data: [{items: {}, profile: {name: 'Ada'}}]} as any,
      schema
    )
  ).toThrow(/expected list/);
});

test('JSON Arrow conversion applies primitive conversion boundaries', () => {
  const schema: Schema = {
    fields: [
      {name: 'text', type: 'utf8', nullable: false},
      {name: 'integer', type: 'uint8', nullable: false},
      {name: 'binary', type: 'binary', nullable: false},
      {name: 'when', type: 'timestamp-millisecond', nullable: false}
    ],
    metadata: {}
  };
  const table = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [{text: 42, integer: -10.6, binary: new Uint8Array([1, 2]), when: new Date(0)}]
    } as any,
    {
      schema,
      arrowConversion: {utf8Conversion: 'number-to-string', integerConversion: 'clamp-and-round'}
    }
  );
  expect(table.data.getChild('text')?.get(0)).toBe('42');
  expect(table.data.getChild('integer')?.get(0)).toBe(0);
  expect(Array.from(table.data.getChild('binary')?.get(0) || [])).toEqual([1, 2]);
  expect(() =>
    convertRowTableToArrowTable(
      {shape: 'object-row-table', data: [{text: true, integer: 1, binary: 'x', when: 1}]} as any,
      {schema}
    )
  ).toThrow(/expected string/);
});

test('JSON Arrow batch adapters freeze schemas and preserve metadata batches', async () => {
  const metadata = {batchType: 'metadata', note: 'keep'};
  const dataBatches: TableBatch[] = [
    {batchType: 'data', shape: 'object-row-table', data: [], length: 0} as any,
    {
      batchType: 'data',
      shape: 'object-row-table',
      data: [{id: 1}],
      length: 1
    } as any,
    {
      batchType: 'data',
      shape: 'object-row-table',
      data: [{id: 2}],
      length: 1
    } as any
  ];
  const ndjson = [] as any[];
  for await (const batch of makeNDJSONArrowBatchIterator(yieldBatches(dataBatches))) {
    ndjson.push(batch);
  }
  expect(ndjson.map(batch => batch.length)).toEqual([0, 1, 1]);

  const converted = [] as any[];
  for await (const batch of convertTableBatchesToArrow(
    yieldBatches([metadata, ...dataBatches.slice(1)])
  )) {
    converted.push(batch);
  }
  expect(converted[0]).toBe(metadata);
  expect(converted[1].shape).toBe('arrow-table');

  const invalidIterator = convertTableBatchesToArrow(
    yieldBatches([{batchType: 'data', shape: 'invalid', data: []}])
  );
  await expect(invalidIterator.next()).rejects.toThrow(/requires row-table data batches/);
});

test('JSON Arrow conversion covers primitive and integer policy matrices', () => {
  const integerTypes = ['int8', 'int16', 'int32', 'uint8', 'uint16', 'uint32'] as const;
  for (const integerType of integerTypes) {
    const schema: Schema = {
      fields: [{name: 'value', type: integerType, nullable: true}],
      metadata: {}
    };
    const table = convertRowTableToArrowTable(
      {shape: 'object-row-table', data: [{value: Number.POSITIVE_INFINITY}]} as any,
      {schema, arrowConversion: {integerConversion: 'clamp-and-round'}}
    );
    expect(table.data.numRows).toBe(1);
    const nullable = convertRowTableToArrowTable(
      {shape: 'object-row-table', data: [{value: 1.5}]} as any,
      {schema, arrowConversion: {integerConversion: 'null'}}
    );
    expect(nullable.data.getChild('value')?.get(0)).toBeNull();
  }

  const primitiveFields: Schema['fields'] = [
    {name: 'boolean', type: 'bool', nullable: false},
    {name: 'float', type: 'float32', nullable: false},
    {name: 'date', type: 'date-day', nullable: false},
    {name: 'time', type: 'time-millisecond', nullable: false},
    {name: 'timestamp', type: 'timestamp-millisecond', nullable: false},
    {name: 'binary', type: 'binary-view', nullable: false},
    {name: 'nothing', type: 'null', nullable: true}
  ];
  const primitiveTable = convertRowTableToArrowTable(
    {
      shape: 'object-row-table',
      data: [
        {
          boolean: true,
          float: 1.5,
          date: new Date(0),
          time: new Date(1),
          timestamp: new Date(2),
          binary: new Uint8Array([1]),
          nothing: null
        }
      ]
    } as any,
    {schema: {fields: primitiveFields, metadata: {}}}
  );
  expect(primitiveTable.data.numRows).toBe(1);
});

test('JSON Arrow conversion validates GeoArrow schemas and deduplicates recovery logs', () => {
  const feature: Feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {name: 'point'}
  };
  expect(() =>
    convertGeoJSONFeaturesToArrowTable([feature], {
      schema: {fields: [{name: 'name', type: 'utf8', nullable: true}], metadata: {}}
    })
  ).toThrow('must include geometry');
  expect(() =>
    convertGeoJSONFeaturesToArrowTable([feature], {
      schema: {
        fields: [{name: 'geometry', type: 'utf8', nullable: true}],
        metadata: {}
      }
    })
  ).toThrow('must have binary type');
  const geoarrow = convertGeoJSONFeaturesToArrowTable([feature], {
    schema: {
      fields: [
        {name: 'geometry', type: 'binary', nullable: true, metadata: {custom: 'preserved'}},
        {name: 'name', type: 'utf8', nullable: true}
      ],
      metadata: {custom: 'root'}
    }
  });
  expect(geoarrow.schema?.fields[0].metadata).toMatchObject({custom: 'preserved'});

  const messages: string[] = [];
  const recovered = convertRowTableToArrowTable(
    {shape: 'object-row-table', data: [{value: 'bad'}, {value: 'bad-again'}]} as any,
    {
      schema: {fields: [{name: 'value', type: 'float64', nullable: true}], metadata: {}},
      arrowConversion: {onTypeMismatch: 'null'},
      log: {once: (message: string) => () => messages.push(message)}
    }
  );
  expect(recovered.data.numRows).toBe(2);
  expect(messages).toHaveLength(1);

  const arrowSchema = new arrow.Schema([new arrow.Field('value', new arrow.Utf8(), true)]);
  expect(normalizeJSONArrowSchema(arrowSchema).fields[0].name).toBe('value');
});
