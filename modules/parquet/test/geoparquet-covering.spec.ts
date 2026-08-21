// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrayType, Schema} from '@loaders.gl/schema';
import {describe, expect, test} from 'vitest';

import {
  combineParquetPredicates,
  createGeoParquetBoundingBoxPredicate
} from '../src/lib/geo/geoparquet-covering';
import {
  canParquetRowGroupMatch,
  filterParquetRowIndices,
  getParquetPredicateColumns
} from '../src/lib/parquet-predicate';
import type {ParquetSourceMetadata} from '../src/parquet-source-types';

const COVERING = {
  bbox: {
    xmin: ['bbox', 'xmin'],
    ymin: ['bbox', 'ymin'],
    xmax: ['bbox', 'xmax'],
    ymax: ['bbox', 'ymax']
  }
};

describe('GeoParquet bbox covering', () => {
  test('creates a hidden nested predicate and filters exact bbox intersections', () => {
    const metadata = createMetadata(COVERING);
    const spatialPredicate = createGeoParquetBoundingBoxPredicate(
      metadata,
      [-71.1, 42.3, -71, 42.4]
    );

    expect(spatialPredicate).toBeDefined();
    expect(getParquetPredicateColumns(spatialPredicate!)).toEqual(['bbox']);
    const columns = {
      bbox: [
        {xmin: -71.05, ymin: 42.35, xmax: -71.04, ymax: 42.36},
        {xmin: -72, ymin: 42.35, xmax: -71.5, ymax: 42.36},
        null,
        {xmin: -71.2, ymin: 42.2, xmax: -71.05, ymax: 42.35}
      ]
    } as unknown as Record<string, ArrayType>;
    expect(filterParquetRowIndices(spatialPredicate, columns, 4)).toEqual([0, 3]);
  });

  test('combines spatial and application predicates for nested statistics pruning', () => {
    const metadata = createMetadata(COVERING);
    const predicate = combineParquetPredicates(
      {op: '>=', args: [{property: 'confidence'}, 0.8]},
      createGeoParquetBoundingBoxPredicate(metadata, [-71.1, 42.3, -71, 42.4])
    );

    expect(predicate).toMatchObject({op: 'and'});
    expect(canParquetRowGroupMatch(predicate!, metadata.rowGroups[0])).toBe(true);
    expect(
      canParquetRowGroupMatch(predicate!, {
        ...metadata.rowGroups[0],
        columns: metadata.rowGroups[0].columns.map(column =>
          column.path.join('.') === 'bbox.xmin'
            ? {...column, statistics: {min: -70, max: -69}}
            : column
        )
      })
    ).toBe(false);
  });

  test('uses the horizontal dimensions of a six-dimensional query bbox', () => {
    const spatialPredicate = createGeoParquetBoundingBoxPredicate(
      createMetadata(COVERING),
      [-71.1, 42.3, -50, -71, 42.4, 50]
    );

    expect(spatialPredicate).toBeDefined();
    expect(combineParquetPredicates(undefined, spatialPredicate)).toBe(spatialPredicate);
    expect(combineParquetPredicates(spatialPredicate, undefined)).toBe(spatialPredicate);
  });

  test('conservatively ignores malformed, missing, and antimeridian coverings', () => {
    expect(
      createGeoParquetBoundingBoxPredicate(
        createMetadata({
          bbox: {...COVERING.bbox, xmax: ['other_bbox', 'xmax']}
        }),
        [-71.1, 42.3, -71, 42.4]
      )
    ).toBeUndefined();
    expect(
      createGeoParquetBoundingBoxPredicate(createMetadata(undefined), [-71.1, 42.3, -71, 42.4])
    ).toBeUndefined();
    expect(
      createGeoParquetBoundingBoxPredicate(createMetadata(COVERING), [170, -10, -170, 10])
    ).toBeUndefined();
    expect(
      createGeoParquetBoundingBoxPredicate(createMetadata(COVERING), [-71.1, 42.4, -71, 42.3])
    ).toBeUndefined();
  });
});

/** Creates the minimal normalized metadata needed by covering and statistics tests. */
function createMetadata(covering: unknown): ParquetSourceMetadata {
  const schema: Schema = {
    fields: [
      {
        name: 'bbox',
        type: {
          type: 'struct',
          children: ['xmin', 'ymin', 'xmax', 'ymax'].map(name => ({
            name,
            type: 'float64',
            nullable: false
          }))
        }
      },
      {name: 'confidence', type: 'float64'}
    ],
    metadata: {
      geo: JSON.stringify({
        version: '1.1.0',
        primary_column: 'geometry',
        columns: {
          geometry: {encoding: 'WKB', geometry_types: [], covering}
        }
      })
    }
  };
  const paths = [
    ['bbox', 'xmin'],
    ['bbox', 'ymin'],
    ['bbox', 'xmax'],
    ['bbox', 'ymax'],
    ['confidence']
  ];
  return {
    schema,
    name: 'covering',
    fileByteLength: 1,
    version: 2,
    formatVersion: 2,
    rowCount: 4,
    rowGroupCount: 1,
    keyValueMetadata: {},
    rowGroups: [
      {
        index: 0,
        rowOffset: 0,
        rowCount: 4,
        uncompressedByteLength: 1,
        uncompressedSize: 1,
        compressedByteLength: 1,
        compressedSize: 1,
        columns: paths.map(path => ({
          path,
          compression: 'UNCOMPRESSED',
          encodings: ['PLAIN'],
          valueCount: 4,
          fileOffset: 0,
          compressedByteLength: 1,
          compressedSize: 1,
          uncompressedByteLength: 1,
          uncompressedSize: 1,
          dataPageOffset: 0,
          statistics:
            path.join('.') === 'bbox.xmin'
              ? {min: -72, max: -70.5}
              : path.join('.') === 'bbox.xmax'
                ? {min: -71.8, max: -69.5}
                : path.join('.') === 'bbox.ymin'
                  ? {min: 42, max: 43}
                  : path.join('.') === 'bbox.ymax'
                    ? {min: 42.1, max: 43.1}
                    : {min: 0.5, max: 1}
        }))
      }
    ]
  };
}
