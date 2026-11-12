// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, beforeAll, expect, expectTypeOf, test, vi} from 'vitest';
import {RecordBatch, Table, tableFromArrays, tableToIPC} from 'apache-arrow';
import {encode, load, loadInBatches, parse, parseInBatches, parseSync} from '@loaders.gl/core';
import {destroyWorkerTasks} from '@loaders.gl/core/worker-utils';
import {ArrowLoader} from '../src/arrow/arrow-loader-types';
import {ArrowLoaderWithParser} from '../src/arrow/arrow-loader';
import {GeoArrowLoader} from '../src/arrow/geoarrow-loader-types';
import {CSVLoader} from '../src/csv/csv-loader-types';
import {CSVLoaderWithParser} from '../src/csv/csv-loader';
import {JSONTableLoader} from '../src/json/json-table-loader-types';
import {NDJSONLoader} from '../src/json/ndjson-loader-types';
import {GeoJSONLoader} from '../src/json/geojson-loader-types';
import {NDGeoJSONLoader} from '../src/json/ndgeojson-loader-types';
import {ParquetLoader} from '../src/parquet/parquet-loader-types';
import {ParquetJSLoader} from '../src/parquet/parquet-js-loader-types';
import {GeoParquetLoader} from '../src/parquet/geoparquet-loader-types';
import {AvroLoader} from '../src/avro/avro-loader-types';
import {ORCLoader} from '../src/orc/orc-loader-types';
import {encodeAvro} from '../src/avro/lib/encoders/encode-avro';
import {encodeORC} from '../src/orc/lib/encoders/encode-orc';
import {ParquetJSWriter} from '../src/parquet/parquet-js-writer';

const encoder = new TextEncoder();
const original = tableFromArrays({id: new Int32Array([1, 2]), label: ['first', 'second']});
const ipc = tableToIPC(new Table([original.slice(0, 1).batches[0], original.slice(1).batches[0]]));
let parquet: ArrayBuffer;
let avro: ArrayBuffer;
beforeAll(async () => {
  avro = await encodeAvro({shape: 'arrow-table', data: original});
  parquet = await encode(
    {
      shape: 'object-row-table',
      data: [
        {id: 1, label: 'first'},
        {id: 2, label: 'second'}
      ],
      schema: {
        fields: [
          {name: 'id', type: 'int32'},
          {name: 'label', type: 'utf8'}
        ]
      }
    },
    ParquetJSWriter,
    {
      core: {worker: false},
      parquet: {compression: 'UNCOMPRESSED'}
    }
  );
});
afterEach(() => destroyWorkerTasks());

const cases = [
  {name: 'Arrow', loader: ArrowLoader, input: () => ipc.slice()},
  {name: 'GeoArrow', loader: GeoArrowLoader, input: () => ipc.slice()},
  {
    name: 'Avro',
    loader: AvroLoader,
    input: () => avro.slice(0)
  },
  {
    name: 'ORC',
    loader: ORCLoader,
    input: () => encodeORC({shape: 'arrow-table', data: original})
  },
  {
    name: 'CSV',
    loader: CSVLoader,
    input: () => encoder.encode('id,label\n1,first\n2,second\n')
  },
  {
    name: 'JSONTable',
    loader: JSONTableLoader,
    input: () => encoder.encode('[{"id":1,"label":"first"},{"id":2,"label":"second"}]')
  },
  {
    name: 'NDJSON',
    loader: NDJSONLoader,
    input: () => encoder.encode('{"id":1,"label":"first"}\n{"id":2,"label":"second"}\n')
  },
  {name: 'Parquet', loader: ParquetLoader, input: () => parquet.slice(0)},
  {name: 'ParquetJS', loader: ParquetJSLoader, input: () => parquet.slice(0)},
  {name: 'GeoParquet', loader: GeoParquetLoader, input: () => parquet.slice(0)}
];

test.each(cases)('$name returns native Tables and all RecordBatches', async ({loader, input}) => {
  const options = {core: {worker: false}};
  const table = (await parse(input(), loader, options)) as Table;
  expect(table).toBeInstanceOf(Table);
  expect(table).not.toHaveProperty('shape');
  expect(table.getChild('label')!.toArray()).toEqual(['first', 'second']);
  const values: string[] = [];
  for await (const batch of await parseInBatches([input()], loader, {
    core: {worker: false}
  })) {
    expect(batch).toBeInstanceOf(RecordBatch);
    expect(batch).not.toHaveProperty('shape');
    values.push(...batch.getChild('label')!.toArray());
  }
  expect(values).toEqual(['first', 'second']);

  const wrappedOptions = {core: {worker: false, shape: 'arrow-table' as const}};
  expect(await parse(input(), loader, wrappedOptions)).toMatchObject({shape: 'arrow-table'});
  let wrappedRows = 0;
  for await (const batch of await parseInBatches([input()], loader, wrappedOptions)) {
    expect(batch).toMatchObject({shape: 'arrow-table', batchType: 'data'});
    wrappedRows += batch.length;
  }
  expect(wrappedRows).toBe(2);
});

test.each(
  cases.filter(({name}) => ['Arrow', 'CSV', 'JSONTable', 'NDJSON', 'Parquet'].includes(name))
)('$name hydrates native output after worker transport', async ({loader: metadata, input}) => {
  const implementation = await metadata.preload();
  const mainParse = vi.fn(() => {
    throw new Error('Unexpected main-thread parse');
  });
  const mainBatches = vi.fn(() => {
    throw new Error('Unexpected main-thread batches');
  });
  const loader = {
    ...metadata,
    preload: async () => ({
      ...implementation,
      parse: mainParse,
      parseText: mainParse,
      parseTextSync: mainParse,
      parseInBatches: mainBatches
    })
  };
  const options = {core: {worker: true}} as const;
  const table = await parse(input(), loader, options);
  expect(table).toBeInstanceOf(Table);
  expect(table.getChild('label')!.get(1)).toBe('second');
  const labels: string[] = [];
  for await (const batch of await parseInBatches([input()], loader, options)) {
    expect(batch).toBeInstanceOf(RecordBatch);
    labels.push(...batch.getChild('label')!.toArray());
  }
  expect(labels).toEqual(['first', 'second']);
  expect(mainParse).not.toHaveBeenCalled();
  expect(mainBatches).not.toHaveBeenCalled();
});

test.each([GeoJSONLoader, NDGeoJSONLoader])('$id retains GeoArrow field metadata', async loader => {
  const feature = {
    type: 'Feature',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {id: 1}
  };
  const input = JSON.stringify(
    loader.id === 'geojson' ? {type: 'FeatureCollection', features: [feature]} : feature
  );
  const table = await load(new Blob([input]), loader, {
    core: {worker: false},
    geojson: {shape: 'arrow'}
  });
  expect(table).toBeInstanceOf(Table);
  expect(
    table.schema.fields
      .find(field => field.name === 'geometry')!
      .metadata.get('ARROW:extension:name')
  ).toBe('geoarrow.wkb');
  for await (const batch of await loadInBatches(new Blob([input]), loader, {
    core: {worker: false}
  })) {
    expect(batch).toBeInstanceOf(RecordBatch);
    expect(batch.numRows).toBe(1);
  }
});

test('sync and load APIs infer native output and preserve scoped overrides', async () => {
  const table = parseSync(ipc, ArrowLoaderWithParser, {arrow: {shape: 'arrow'}});
  expectTypeOf(table).toEqualTypeOf<Table>();
  expect(table).toBeInstanceOf(Table);
  expect(table.batches).toHaveLength(2);
  const csv = parseSync('id\n1\n', CSVLoaderWithParser, {csv: {shape: 'arrow'}});
  expectTypeOf(csv).toEqualTypeOf<Table>();
  expect(csv.numRows).toBe(1);
  const loaded = await load(new Blob([ipc]), ArrowLoader, {core: {worker: false}});
  expectTypeOf(loaded).toEqualTypeOf<Table>();
  expect(loaded.numRows).toBe(2);
  const wrapped = await parse(ipc, ArrowLoader, {
    core: {worker: false, shape: 'arrow'},
    arrow: {shape: 'arrow-table'}
  });
  expect(wrapped.shape).toBe('arrow-table');
  expect(await parse(ipc, ArrowLoader, {core: {worker: false}})).toBeInstanceOf(Table);
  const batches = await loadInBatches(new Blob([ipc]), ArrowLoader, {
    core: {worker: false}
  });
  expectTypeOf(batches).toEqualTypeOf<AsyncIterable<RecordBatch>>();
});

test('native streaming requires wrapped mode for loader metadata', async () => {
  await expect(parseInBatches([ipc], ArrowLoader, {core: {metadata: true}})).rejects.toThrow(
    'core.metadata'
  );

  const output = await parseInBatches([ipc], ArrowLoader, {
    core: {shape: 'arrow-table', metadata: true, worker: false}
  });
  const events = [];
  for await (const event of output) events.push(event);
  const [metadata, ...batches] = events;
  expect(metadata).toMatchObject({batchType: 'metadata'});
  expect(batches).toHaveLength(2);
  expect(batches[0]).toMatchObject({shape: 'arrow-table', batchType: 'data'});
});
