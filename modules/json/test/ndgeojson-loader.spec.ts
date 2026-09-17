// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {parse, parseInBatches, parseSync} from '@loaders.gl/core';
import {NDGeoJSONLoader, type NDGeoJSONLoaderOptions} from '@loaders.gl/json';
import {NDGeoJSONLoaderWithParser} from '@loaders.gl/json/ndgeojson-loader';
import type {
  ArrowTable,
  ArrowTableBatch,
  Feature,
  Geometry,
  ObjectRowTable
} from '@loaders.gl/schema';

const features: Feature<Geometry | null>[] = [
  {
    type: 'Feature',
    id: 'one',
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: {name: 'Zürich', height: 12}
  },
  {type: 'Feature', id: 'two', geometry: null, properties: {name: 'Basel', height: null}}
];
const text = features.map(feature => JSON.stringify(feature)).join('\r\n');

test('NDGeoJSON defaults to Arrow through metadata and parser entrypoints', async () => {
  expect(NDGeoJSONLoader.id).toBe('ndgeojson');
  expect(NDGeoJSONLoader).not.toHaveProperty('parse');
  expect(await NDGeoJSONLoader.preload()).toBe(NDGeoJSONLoaderWithParser);
  const table = (await parse(text, NDGeoJSONLoader)) as ArrowTable;
  expect(table.shape).toBe('arrow-table');
  expect(table.data.numRows).toBe(2);
  expect(table.data.getChild('name')!.toArray()).toEqual(['Zürich', 'Basel']);
  expect(table.data.getChild('id')!.get(0)).toBe('one');
  expect(table.data.getChild('height')!.get(1)).toBeNull();
  expect(table.data.getChild('geometry')!.get(0)).toBeInstanceOf(Uint8Array);
  expect(table.data.getChild('geometry')!.get(1)).toBeNull();
  expect(
    table.data.schema.fields
      .find(field => field.name === 'geometry')!
      .metadata.get('ARROW:extension:name')
  ).toBe('geoarrow.wkb');
  expect((parseSync(text, NDGeoJSONLoaderWithParser) as ArrowTable).data.numRows).toBe(2);
  const buffer = new TextEncoder().encode(text).buffer;
  expect(((await NDGeoJSONLoaderWithParser.parse(buffer)) as ArrowTable).data.numRows).toBe(2);
});

test('NDGeoJSON preserves explicit object rows, blank lines, and record separators', async () => {
  const options: NDGeoJSONLoaderOptions = {geojson: {shape: 'object-row-table'}};
  const sequence = `\n\x1e${JSON.stringify(features[0])}\n\n\x1e${JSON.stringify(features[1])}\n`;
  expect(((await parse(sequence, NDGeoJSONLoader, options)) as ObjectRowTable).data).toEqual(
    features
  );
  expect((parseSync('', NDGeoJSONLoaderWithParser) as ArrowTable).data.numRows).toBe(0);
  const batches = await parseInBatches([sequence], NDGeoJSONLoader, {...options, batchSize: 1});
  const rows = [];
  for await (const batch of batches) rows.push(...(batch as ObjectRowTable).data);
  expect(rows).toEqual(features);
});

test('NDGeoJSON streams UTF-8 chunks into bounded Arrow batches', async () => {
  const bytes = new TextEncoder().encode(`${text}\n${JSON.stringify(features[0])}`);
  const chunks = Array.from(bytes, byte => Uint8Array.of(byte));
  const batches = [];
  for await (const batch of await parseInBatches(chunks, NDGeoJSONLoader, {core: {batchSize: 2}})) {
    batches.push(batch as ArrowTableBatch);
  }
  expect(batches.map(batch => batch.length)).toEqual([2, 1]);
  expect(batches.map(batch => batch.batchCount)).toEqual([0, 1]);
  expect(batches[1].data.schema.fields).toEqual(batches[0].data.schema.fields);
  expect(batches[0].data.getChild('name')!.get(0)).toBe('Zürich');
});

test('NDGeoJSON uses a stable geometry union for optimized streams', async () => {
  const mixed = [
    features[0],
    {
      ...features[0],
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    }
  ];
  const chunks = [
    new TextEncoder().encode(mixed.map(feature => JSON.stringify(feature)).join('\n'))
  ];
  const batches = [];
  for await (const batch of NDGeoJSONLoaderWithParser.parseInBatches(chunks, {
    batchSize: 1,
    geoarrow: {encodingPreference: 'optimized'}
  }))
    batches.push(batch as ArrowTableBatch);
  expect(batches).toHaveLength(2);
  for (const batch of batches) {
    expect(
      batch.data.schema.fields
        .find(field => field.name === 'geometry')!
        .metadata.get('ARROW:extension:name')
    ).toBe('geoarrow.geometry');
  }
});

test('NDGeoJSON rejects invalid records, batch sizes, and incompatible later schemas', async () => {
  expect(() => parseSync('{}', NDGeoJSONLoaderWithParser)).toThrow(/Feature on line 1/);
  expect(() => parseSync('\n{', NDGeoJSONLoaderWithParser)).toThrow(/JSON on line 2/);
  await expect(async () => {
    for await (const batch of NDGeoJSONLoaderWithParser.parseInBatches([], {batchSize: 0}))
      void batch;
  }).rejects.toThrow(/positive integer/);
  const drift = [features[0], {...features[0], properties: {name: 3, height: 12}}];
  await expect(async () => {
    for await (const batch of NDGeoJSONLoaderWithParser.parseInBatches(
      [new TextEncoder().encode(drift.map(feature => JSON.stringify(feature)).join('\n'))],
      {batchSize: 1}
    ))
      void batch;
  }).rejects.toThrow();
});

test('NDGeoJSON default batch size and ID collision handling do not lose data', async () => {
  const batches = [];
  for await (const batch of await parseInBatches([text], NDGeoJSONLoader))
    batches.push(batch as ArrowTableBatch);
  expect(batches).toHaveLength(1);
  expect(batches[0].data.numRows).toBe(2);
  const collision = JSON.stringify({...features[0], properties: {id: 'property-id'}});
  expect(() => parseSync(collision, NDGeoJSONLoaderWithParser)).toThrow(/conflicts/);
  const rows = parseSync(collision, NDGeoJSONLoaderWithParser, {
    geojson: {shape: 'object-row-table'}
  }) as ObjectRowTable;
  expect(rows.data[0]).toMatchObject({id: 'one', properties: {id: 'property-id'}});
  const noId = JSON.stringify({type: 'Feature', geometry: null, properties: {name: 'empty'}});
  expect((parseSync(noId, NDGeoJSONLoaderWithParser) as ArrowTable).data.numRows).toBe(1);
});

test.each([0, 'null-properties'])('NDGeoJSON preserves ID %s with null properties', async id => {
  const feature: Feature = {
    type: 'Feature',
    id,
    geometry: {type: 'Point', coordinates: [1, 2]},
    properties: null
  };
  const input = JSON.stringify(feature);
  const table = (await parse(input, NDGeoJSONLoader)) as ArrowTable;
  expect(table.data.numRows).toBe(1);
  expect(table.data.getChild('id')!.get(0)).toBe(id);
  expect(table.data.getChild('geometry')!.get(0)).toBeInstanceOf(Uint8Array);

  const batches = [];
  for await (const batch of await parseInBatches([`${input}\n${input}`], NDGeoJSONLoader, {
    core: {batchSize: 1}
  })) {
    batches.push(batch as ArrowTableBatch);
  }
  expect(batches.map(batch => batch.data.numRows)).toEqual([1, 1]);
  expect(batches.map(batch => batch.data.getChild('id')!.get(0))).toEqual([id, id]);
  const rows = (await parse(input, NDGeoJSONLoader, {
    geojson: {shape: 'object-row-table'}
  })) as ObjectRowTable;
  expect(rows.data).toEqual([feature]);
});
