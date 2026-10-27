// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {afterEach, expect, test, vi} from 'vitest';
import {Table, tableFromArrays} from 'apache-arrow';
import {fetchFile, load, loadInBatches, parse, parseInBatches} from '@loaders.gl/core';
import {WorkerFarm} from '@loaders.gl/core/worker-utils';
import {DBFLoader, SHPLoader, ShapefileLoader} from '../../src/shapefile/index';
import {
  serializeShapefileWorkerResult,
  deserializeShapefileWorkerResult
} from '../../src/shapefile/lib/shapefile-worker-transport';

import {parseDBFArrowBatches} from '../../src/shapefile/lib/parsers/parse-dbf-to-arrow';
const fixtureRoot = '@loaders.gl/geospatial/shapefile/test/data/shapefile-js';
const workerOptions = {core: {worker: true, _workerType: 'test'}} as const;

afterEach(() => WorkerFarm.getWorkerFarm().destroy());

/** Splits binary fixtures inside headers and records. */
function splitBuffer(buffer: ArrayBuffer): ArrayBuffer[] {
  return Array.from({length: Math.ceil(buffer.byteLength / 17)}, (_, index) =>
    buffer.slice(index * 17, (index + 1) * 17)
  );
}

test.each([
  'arrow-table',
  'wkb'
] as const)('SHP worker batches preserve %s output across split headers and records', async shape => {
  const buffer = await (await fetchFile(`${fixtureRoot}/points.shp`)).arrayBuffer();
  const parser = await SHPLoader.preload();
  const mainBatches = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const loader = {
    ...SHPLoader,
    preload: async () => ({
      ...parser,
      parseInBatches: mainBatches,
      deserializeWorkerBatch: deserialize
    })
  };
  const expected: any = await parse(buffer.slice(0), SHPLoader, {
    core: {worker: false},
    shp: {shape}
  });
  const batches = await parseInBatches(splitBuffer(buffer), loader, {
    ...workerOptions,
    shp: {shape, batchSize: 1}
  });
  const geometries: any[] = [];
  for await (const batch of batches) {
    if (shape === 'arrow-table') {
      expect(batch.data).toBeInstanceOf(Table);
      geometries.push(...batch.data.getChild('geometry'));
    } else if (Array.isArray(batch)) geometries.push(...batch);
    else expect(batch).toEqual(expected.header);
  }
  expect(geometries).toEqual(
    shape === 'wkb' ? expected.geometries : Array.from(expected.data.getChild('geometry'))
  );
  expect(mainBatches).not.toHaveBeenCalled();
  for (const [payload] of deserialize.mock.calls)
    expect((payload as any).data?.transport || (payload as any).transport).toMatch(
      /arrow-js|shp-wkb|shapefile-header/
    );
  const atomic: any = await parse(buffer.slice(0), SHPLoader, {...workerOptions, shp: {shape}});
  if (shape === 'wkb') expect(atomic).toEqual(expected);
  else expect(atomic.data.numRows).toBe(expected.data.numRows);
});

test.each([
  'arrow-table',
  'rows',
  'table',
  'object-row-table'
] as const)('DBF worker decodes columns before caller %s conversion', async shape => {
  const buffer = await (await fetchFile(`${fixtureRoot}/date-property.dbf`)).arrayBuffer();
  const parser = await DBFLoader.preload();
  const deserialize = vi.fn(parser.deserializeWorkerResult);
  const mainBatches = vi.fn(parser.parseInBatches);
  const loader = {
    ...DBFLoader,
    preload: async () => ({
      ...parser,
      parseInBatches: mainBatches,
      deserializeWorkerResult: deserialize
    })
  };
  const expected: any = await parse(buffer.slice(0), DBFLoader, {
    core: {worker: false},
    dbf: {shape}
  });
  const atomic: any = await parse(buffer.slice(0), loader, {...workerOptions, dbf: {shape}});
  if (shape === 'arrow-table')
    expect(atomic.data.toArray().map((row: any) => row.toJSON())).toEqual(
      expected.data.toArray().map((row: any) => row.toJSON())
    );
  else expect(atomic).toEqual(expected);
  expect(deserialize.mock.calls[0][0]).toMatchObject({
    shape: 'arrow-table',
    data: {transport: 'arrow-js'}
  });
  const rows: any[] = [];
  let headers = 0;
  for await (const batch of await parseInBatches(splitBuffer(buffer), loader, {
    ...workerOptions,
    dbf: {shape, batchSize: 1}
  })) {
    if (shape === 'arrow-table') rows.push(...batch.data.toArray().map((row: any) => row.toJSON()));
    else if (Array.isArray(batch)) rows.push(...batch);
    else {
      expect(batch.nRecords).toBeGreaterThan(0);
      headers++;
    }
  }
  const expectedRows =
    shape === 'arrow-table'
      ? expected.data.toArray().map((row: any) => row.toJSON())
      : shape === 'rows'
        ? expected
        : shape === 'table'
          ? expected.rows
          : expected.data;
  expect(rows).toEqual(expectedRows);
  expect(headers).toBe(shape === 'arrow-table' ? 0 : 1);
  expect(mainBatches).not.toHaveBeenCalled();
});

test.each([
  'arrow-table',
  'geojson-table',
  'v3'
] as const)('Shapefile worker joins sidecars and converts %s on caller', async shape => {
  const url = `${fixtureRoot}/mixed-properties.shp`;
  const expected: any = await load(url, ShapefileLoader, {
    core: {worker: false},
    shapefile: {shape}
  });
  const parser = await ShapefileLoader.preload();
  const mainBatches = vi.fn(parser.parseInBatches);
  const deserialize = vi.fn(parser.deserializeWorkerBatch);
  const loader = {
    ...ShapefileLoader,
    preload: async () => ({
      ...parser,
      parseInBatches: mainBatches,
      deserializeWorkerBatch: deserialize
    })
  };
  const actual: any = await load(url, loader, {...workerOptions, shapefile: {shape}});
  if (shape === 'arrow-table')
    expect(actual.data.toArray().map((row: any) => row.toJSON())).toEqual(
      expected.data.toArray().map((row: any) => row.toJSON())
    );
  else expect(actual).toEqual(expected);
  const rows: any[] = [];
  for await (const batch of await loadInBatches(url, loader, {
    ...workerOptions,
    shapefile: {shape, batchSize: 1}
  })) {
    rows.push(
      ...(shape === 'arrow-table'
        ? batch.data.toArray().map((row: any) => row.toJSON())
        : batch.data)
    );
  }
  expect(rows).toEqual(
    shape === 'arrow-table'
      ? expected.data.toArray().map((row: any) => row.toJSON())
      : shape === 'v3'
        ? expected.data
        : expected.features
  );
  expect(mainBatches).not.toHaveBeenCalled();
  for (const [payload] of deserialize.mock.calls)
    expect(payload).toMatchObject({shape: 'arrow-table', data: {transport: 'arrow-js'}});
});

test('Shapefile transport rejects raw rows and owns binary geometry buffers', () => {
  expect(() => serializeShapefileWorkerResult([{name: 'raw row'}])).toThrow('Arrow columns or WKB');
  expect(() => deserializeShapefileWorkerResult({data: []})).toThrow('Arrow columns or WKB');
  const geometry = new Uint8Array([1, 2, 3]);
  const payload: any = serializeShapefileWorkerResult({
    header: {magic: 9994},
    geometries: [geometry, null]
  });
  const transferred = structuredClone(payload, {transfer: [payload.geometries[0].buffer]});
  expect(deserializeShapefileWorkerResult(transferred)).toEqual({
    header: {magic: 9994},
    geometries: [geometry, null]
  });
  expect(geometry.byteLength).toBe(3);
});

test('Shapefile transport preserves Arrow schema, empty geometries, and header events', () => {
  const data = tableFromArrays({value: [1, 2]});
  const table: any = deserializeShapefileWorkerResult(
    serializeShapefileWorkerResult({shape: 'arrow-table', data})
  );
  expect(table.data).toBeInstanceOf(Table);
  expect(table.data.getChild('value').toArray()).toEqual(data.getChild('value')!.toArray());
  expect(deserializeShapefileWorkerResult(serializeShapefileWorkerResult([]))).toEqual([]);
  for (const header of [{magic: 9994}, {nRecords: 0}])
    expect(deserializeShapefileWorkerResult(serializeShapefileWorkerResult(header))).toEqual(
      header
    );
});

test('custom Shapefile fetch callbacks keep sidecar parsing on caller', async () => {
  const buffer = await (await fetchFile(`${fixtureRoot}/points.shp`)).arrayBuffer();
  const parser = await ShapefileLoader.preload();
  const mainParse = vi.fn(parser.parse);
  const customFetch = vi.fn(async () => new Response(null, {status: 404}));
  const loader = {...ShapefileLoader, preload: async () => ({...parser, parse: mainParse})};
  const result: any = await parse(buffer, loader, {
    ...workerOptions,
    core: {...workerOptions.core, fetch: customFetch}
  });
  expect(result.data.numRows).toBeGreaterThan(0);
  expect(mainParse).toHaveBeenCalledOnce();
});

test('DBF Arrow parser waits for split field descriptors before emitting its header', async () => {
  const buffer = await (await fetchFile(`${fixtureRoot}/date-property.dbf`)).arrayBuffer();
  const events: any[] = [];
  for await (const event of parseDBFArrowBatches(splitBuffer(buffer), {dbf: {batchSize: 1}}, true))
    events.push(event);
  expect(events[0].nRecords).toBeGreaterThan(0);
  const rows = events
    .slice(1)
    .flatMap(batch => batch.data.toArray().map((row: any) => row.toJSON()));
  const expected: any = await parse(buffer, DBFLoader, {
    core: {worker: false},
    dbf: {shape: 'rows'}
  });
  expect(rows).toEqual(expected);
});
