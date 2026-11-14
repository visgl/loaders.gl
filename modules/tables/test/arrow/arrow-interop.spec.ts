// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {dehydrateArrowTable, hydrateArrowTable} from '@math.gl/arrow';
import {writeWKB} from '@math.gl/arrow/wkb';
import {ArrowConverter, convertArrow} from '../../src/arrow/arrow-converter/arrow-converter';
import {GeoArrowWriter} from '../../src/arrow/geoarrow-writer';
import {VECTOR_TYPES} from '../../src/arrow/lib/types';
import {ArrowLoader} from '../../src/arrow/arrow-loader-types';
import {GeoArrowLoader} from '../../src/arrow/geoarrow-loader-types';
import {parseArrowInBatches, parseArrowSync} from '../../src/arrow/lib/parsers/parse-arrow';
import {
  parseGeoArrowInBatches,
  parseGeoArrowSync
} from '../../src/arrow/lib/parsers/parse-geoarrow';
import {triangulateWKBGeometryColumn} from '../../src/arrow/triangulate-wkb-geometry-column';
import {
  serializeArrowWorkerResult,
  deserializeArrowWorkerResult
} from '@loaders.gl/core/arrow-worker-transport';

// These cases exercise the loaders.gl adapters. Generic Arrow algorithms are tested upstream.
test.each([
  'object-row-table',
  'array-row-table',
  'columnar-table'
] as const)('Arrow converter materializes %s and restores an upstream table', shape => {
  const table = arrow.tableFromArrays({value: new Int32Array([7, 9])});
  const converted = ArrowConverter.convert(table, shape);
  expect(converted.shape).toBe(shape);
  const restored = ArrowConverter.convert(converted, 'arrow') as arrow.Table;
  expect(Array.from(restored.getChild('value')!)).toEqual([7, 9]);
  expect(convertArrow(table, 'arrow')).toBe(table);
});

test('Arrow converter detects wrappers and rejects unsupported conversion routes', () => {
  const table = arrow.tableFromArrays({value: [7]});
  expect(ArrowConverter.detectInputShape(table)).toBe('arrow');
  expect(ArrowConverter.detectInputShape(null)).toBe(null);
  expect(ArrowConverter.detectInputShape({shape: 'arrow-table', data: table})).toBe(null);
  expect(ArrowConverter.canConvert('arrow', 'arrow-table')).toBe(false);
  expect(ArrowConverter.canConvert('arrow-table', 'arrow')).toBe(true);
  expect(ArrowConverter.canConvert('arrow', 'arrow')).toBe(false);
  expect(ArrowConverter.canConvert('array-row-table', 'object-row-table')).toBe(false);
  expect(() => ArrowConverter.convert(table, 'invalid' as never)).toThrow(
    'Unsupported Arrow conversion'
  );
  expect(() =>
    convertArrow({shape: 'arrow-table', data: table}, 'object-row-table' as never)
  ).toThrow('Unsupported Arrow conversion');
});

test.each([
  'none',
  'sliced',
  'all'
] as const)('loader result hooks honor %s buffer ownership', copy => {
  const source = arrow.tableFromArrays({value: new Int32Array([7, 9, 11])}).slice(1, 2);
  const input = {shape: 'arrow-table', data: source, category: 'test'};
  const payload = serializeArrowWorkerResult(input, {
    core: {workerTransferBufferCopy: copy}
  }) as any;
  expect(payload.category).toBe('test');
  expect(Array.from(hydrateArrowTable(payload.data).getChild('value')!)).toEqual([9]);
  const restored = deserializeArrowWorkerResult(structuredClone(payload));
  expect(restored.shape).toBe('arrow-table');
  expect(Array.from(restored.data.getChild('value'))).toEqual([9]);
  expect(Array.from(source.getChild('value')!)).toEqual([9]);
});

test('loader result hooks preserve non-Arrow values and accept legacy copy options', () => {
  for (const value of [null, 0, {shape: 'mesh'}, {shape: 'arrow-table', data: {}}]) {
    expect(serializeArrowWorkerResult(value)).toBe(value);
    expect(deserializeArrowWorkerResult(value)).toBe(value);
  }
  const table = arrow.tableFromArrays({value: [7]});
  const payload = serializeArrowWorkerResult(
    {shape: 'arrow-table', data: table},
    {workerTransferBufferCopy: 'all'}
  );
  expect(deserializeArrowWorkerResult(payload).data.numRows).toBe(1);
  expect(
    deserializeArrowWorkerResult(serializeArrowWorkerResult({shape: 'arrow-table', data: table}))
      .data.numRows
  ).toBe(1);
});

test('metadata preload resolves the parser-bearing Arrow and GeoArrow loaders', async () => {
  const arrowLoader = await ArrowLoader.preload();
  const geoArrowLoader = await GeoArrowLoader.preload();
  expect(arrowLoader.parseSync).toBeTypeOf('function');
  expect(geoArrowLoader.parseSync).toBeTypeOf('function');
  const bytes = arrow.tableToIPC(arrow.tableFromArrays({value: [7]}));
  expect(arrowLoader.parseSync(bytes.buffer, {arrow: {shape: 'object-row-table'}}).data).toEqual([
    {value: 7}
  ]);
  expect(geoArrowLoader.parseSync(bytes.buffer, {arrow: {shape: 'arrow'}})).toBeInstanceOf(
    arrow.Table
  );
});

test('Arrow parser entry points return native Arrow for the arrow shape', async () => {
  const loader = await ArrowLoader.preload();
  const bytes = arrow.tableToIPC(arrow.tableFromArrays({value: [7]}));
  const options = {arrow: {shape: 'arrow' as const}};
  expect(loader.parseSync(bytes.buffer, options)).toBeInstanceOf(arrow.Table);
  const batches = [];
  for await (const batch of loader.parseInBatches([bytes], options)) batches.push(batch);
  expect(batches).toHaveLength(1);
  expect(batches[0]).toBeInstanceOf(arrow.RecordBatch);
});

test('GeoArrow writer encodes numeric and date columns through sync and async entry points', async () => {
  const columns = [
    {name: 'value', array: new Float64Array([7, 9]), type: VECTOR_TYPES.FLOAT},
    {name: 'created', array: [new Date(0), new Date(1000)], type: VECTOR_TYPES.DATE},
    {name: 'fallback', array: new Int32Array([1, 2]), type: -1}
  ];
  for (const bytes of [
    GeoArrowWriter.encodeSync(columns as never),
    await GeoArrowWriter.encode(columns as never)
  ]) {
    const table = arrow.tableFromIPC(bytes);
    expect(Array.from(table.getChild('value')!)).toEqual([7, 9]);
    expect(Array.from(table.getChild('fallback')!)).toEqual([1, 2]);
    expect(table.getChild('created')!.length).toBe(2);
  }
});

test('Arrow batch adapters preserve rows across Arrow and GeoArrow entry points', async () => {
  const bytes = arrow.tableToIPC(arrow.tableFromArrays({value: new Int32Array([7, 9])}));
  const batches = [];
  for await (const batch of parseArrowInBatches([bytes], {
    arrow: {shape: 'arrow-table'}
  }))
    batches.push(batch);
  expect(batches.map(batch => batch.length)).toEqual([2]);
  expect(Array.from(batches[0].data.getChild('value')!)).toEqual([7, 9]);
  const geoBatches = [];
  for await (const batch of parseGeoArrowInBatches([bytes])) geoBatches.push(batch);
  expect(geoBatches[0].length).toBe(2);
  expect(parseArrowSync(bytes.buffer).shape).toBe('arrow-table');
  expect(parseGeoArrowSync(bytes.buffer).shape).toBe('arrow-table');
  expect(() => parseArrowSync(new Uint8Array(8).fill(127).buffer)).toThrow();
});

test('WKB triangulation retains null rows and multipolygon source vertices', () => {
  const ring = [
    [0, 0],
    [2, 0],
    [0, 2],
    [0, 0]
  ];
  const geometry = {type: 'MultiPolygon' as const, coordinates: [[ring]]};
  const column = arrow.vectorFromArray(
    [null, new Uint8Array(writeWKB(geometry))],
    new arrow.Binary()
  );
  const result = triangulateWKBGeometryColumn(column);
  expect(result.vertexIndices.get(0)).toBe(null);
  expect(result.vertices.get(0)).toBe(null);
  expect(Array.from(result.vertexIndices.get(1)!)).toHaveLength(3);
  expect(Array.from(result.vertices.get(1)!, position => Array.from(position))).toEqual(ring);
  expect(
    hydrateArrowTable(dehydrateArrowTable(new arrow.Table({vertices: result.vertices}))).numRows
  ).toBe(2);
});

test('Arrow geometry adapters materialize GeoJSON only when requested', () => {
  const bytes = new Uint8Array(writeWKB({type: 'Point', coordinates: [7, 9]}));
  const vector = arrow.vectorFromArray([bytes], new arrow.Binary());
  const field = new arrow.Field(
    'geometry',
    vector.type,
    true,
    new Map([['ARROW:extension:name', 'geoarrow.wkb']])
  );
  const schema = new arrow.Schema([field]);
  const table = new arrow.Table(
    schema,
    new arrow.RecordBatch(
      schema,
      new arrow.Data(new arrow.Struct([field]), 0, 1, 0, undefined, [vector.data[0]])
    )
  );
  const payload = arrow.tableToIPC(table);
  const result = parseGeoArrowSync(payload.buffer, {shape: 'geojson-table'});
  expect(result.shape).toBe('geojson-table');
  expect(result.features[0].geometry).toEqual({type: 'Point', coordinates: [7, 9]});
  expect(ArrowConverter.convert(table, 'geojson-table').shape).toBe('geojson-table');
});
