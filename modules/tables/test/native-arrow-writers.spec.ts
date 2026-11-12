// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {Int32, tableFromArrays, tableFromIPC, vectorFromArray} from 'apache-arrow';
import {encode, encodeInBatches, encodeSync, parse} from '@loaders.gl/core';
import {
  ArrowWriter,
  AvroWriter,
  CSVWriter,
  GeoJSONLoader,
  GeoJSONWriter,
  JSONWriter,
  ORCWriter,
  ParquetJSLoader,
  ParquetJSWriter,
  ParquetWriter
} from '@loaders.gl/tables';
import {GeoArrowWriter} from '../src/arrow/geoarrow-writer';

const table = tableFromArrays({id: new Int32Array([1, 2]), label: ['one', null]});

test.each([ArrowWriter, GeoArrowWriter])('$name encodes native Arrow IPC', async writer => {
  for (const bytes of [await encode(table, writer), encodeSync(table, writer)]) {
    const result = tableFromIPC(bytes);
    expect(result.schema.fields.map(field => field.name)).toEqual(['id', 'label']);
    expect(result.getChild('label')?.toArray()).toEqual(['one', null]);
  }
});

test.each([
  AvroWriter,
  ORCWriter,
  ParquetWriter,
  ParquetJSWriter,
  CSVWriter,
  JSONWriter
])('$id accepts native Arrow tables', async writer => {
  const wrapped = {shape: 'arrow-table' as const, data: table};
  const result = await encode(table, writer);
  expect(result.byteLength).toBeGreaterThan(0);
  await expect(encode(wrapped as never, writer)).rejects.toThrow();
});

test('ParquetJSWriter preserves nulls in native numeric columns', async () => {
  const input = tableFromArrays({value: vectorFromArray([1, null], new Int32())});
  const bytes = await encode(input, ParquetJSWriter);
  const result = await parse(bytes, ParquetJSLoader, {core: {worker: false}});
  expect(result.getChild('value')?.get(0)).toBe(1);
  expect(result.getChild('value')?.get(1)).toBeNull();
});

test('GeoJSON writes a native GeoArrow table and multiple native batches', async () => {
  const features = [1, 2].map(id => ({
    type: 'Feature',
    properties: {id},
    geometry: {type: 'Point', coordinates: [id, 3]}
  }));
  const source = await parse(JSON.stringify({type: 'FeatureCollection', features}), GeoJSONLoader, {
    core: {worker: false}
  });
  const decoder = new TextDecoder();
  const encoded = await encode(source, GeoJSONWriter);
  expect(JSON.parse(decoder.decode(encoded)).features).toEqual(features);

  const singleton = source.slice(0, 1).batches[0];
  let singletonText = '';
  for await (const chunk of encodeInBatches(singleton, GeoJSONWriter)) {
    singletonText += decoder.decode(chunk);
  }
  expect(JSON.parse(singletonText).features).toEqual(features.slice(0, 1));

  let text = '';
  for await (const chunk of encodeInBatches(
    [source.slice(0, 1).batches[0], source.slice(1).batches[0]],
    GeoJSONWriter
  )) {
    text += decoder.decode(chunk);
  }
  expect(JSON.parse(text).features).toEqual(features);
});
