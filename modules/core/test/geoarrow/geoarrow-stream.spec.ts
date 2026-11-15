// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {convertGeometryToWKB} from '@loaders.gl/core/arrow-geometry/geometry-codecs';
import {
  convertGeoArrowBatches,
  convertGeoArrowVectorCellToGeoJSON
} from '@loaders.gl/core/geoarrow';
import type {Geometry} from '@loaders.gl/core/schema';

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
  const convertedBatches: arrow.RecordBatch[] = [];

  for await (const batch of convertGeoArrowBatches(batches, 'native')) {
    convertedBatches.push(batch);
  }

  expect(convertedBatches).toHaveLength(2);
  expect(convertedBatches[0].metadata.get('fixture')).toBe('local');
  expect(convertedBatches[0].metadata).not.toBe(batches[0].metadata);
  const firstVector = convertedBatches[0].getChild('geometry')!;
  const secondVector = convertedBatches[1].getChild('geometry')!;
  expect(firstVector.type.toString()).toBe(secondVector.type.toString());
  expect((firstVector.type as arrow.DenseUnion).typeIds).toEqual(
    (secondVector.type as arrow.DenseUnion).typeIds
  );
  expect(
    Array.from((firstVector.type as arrow.DenseUnion).typeIds).sort(
      (first, second) => first - second
    )
  ).toEqual([
    1, 2, 3, 4, 5, 6, 7, 11, 12, 13, 14, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 31, 32, 33, 34, 35,
    36, 37
  ]);
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
    convertedBatches[0].schema?.fields
      .find(field => field.name === 'geometry')
      ?.metadata.get('ARROW:extension:metadata') || '{}'
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

function createWKBBatch(geometry: Geometry): arrow.RecordBatch {
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
  return new arrow.RecordBatch(
    schema,
    new arrow.Data(new arrow.Struct(schema.fields), 0, 1, 0, undefined, [vector.data[0]]),
    new Map([['fixture', 'local']])
  );
}
