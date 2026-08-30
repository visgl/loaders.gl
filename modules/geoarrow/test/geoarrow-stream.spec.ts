// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import {convertGeoArrowBatches, convertGeoArrowVectorCellToGeoJSON} from '@loaders.gl/geoarrow';
import type {ArrowTableBatch, Geometry} from '@loaders.gl/schema';

test('convertGeoArrowBatches freezes an unknown WKB stream to one union schema', async () => {
  const batches = [
    createWKBBatch({type: 'Point', coordinates: [1, 2]}),
    createWKBBatch({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [4, 0],
          [4, 4],
          [0, 0]
        ]
      ]
    })
  ];
  const convertedBatches: ArrowTableBatch[] = [];

  for await (const batch of convertGeoArrowBatches(batches, 'native')) {
    convertedBatches.push(batch);
  }

  expect(convertedBatches).toHaveLength(2);
  const firstVector = convertedBatches[0].data.getChild('geometry')!;
  const secondVector = convertedBatches[1].data.getChild('geometry')!;
  expect(firstVector.type.toString()).toBe(secondVector.type.toString());
  expect((firstVector.type as arrow.DenseUnion).typeIds).toEqual(
    (secondVector.type as arrow.DenseUnion).typeIds
  );
  expect(convertGeoArrowVectorCellToGeoJSON(firstVector, 0, 'geoarrow.geometry')).toEqual({
    type: 'Point',
    coordinates: [1, 2]
  });
  expect(convertGeoArrowVectorCellToGeoJSON(secondVector, 0, 'geoarrow.geometry')).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 0]
      ]
    ]
  });
  const geometryMetadata = JSON.parse(
    convertedBatches[0].schema?.fields.find(field => field.name === 'geometry')?.metadata?.[
      'ARROW:extension:metadata'
    ] || '{}'
  );
  expect(geometryMetadata.geometry_types).toHaveLength(28);
});

test('convertGeoArrowBatches aborts before consuming the next batch', async () => {
  const abortController = new AbortController();
  const batches = [createWKBBatch({type: 'Point', coordinates: [1, 2]})];
  abortController.abort();
  const iterator = convertGeoArrowBatches(batches, 'native', {signal: abortController.signal});

  await expect(iterator.next()).rejects.toMatchObject({name: 'AbortError'});
});

function createWKBBatch(geometry: Geometry): ArrowTableBatch {
  const bytes = new Uint8Array(convertGeometryToWKB(geometry));
  const vector = arrow.vectorFromArray([bytes], new arrow.Binary());
  const geometryField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([
      ['ARROW:extension:name', 'geoarrow.wkb'],
      ['ARROW:extension:metadata', '{}']
    ])
  );
  const schema = new arrow.Schema([geometryField]);
  const data = new arrow.Table(
    schema,
    new arrow.RecordBatch(
      schema,
      new arrow.Data(new arrow.Struct(schema.fields), 0, 1, 0, undefined, [vector.data[0]])
    )
  );
  return {shape: 'arrow-table', batchType: 'data', length: 1, data};
}
