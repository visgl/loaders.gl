// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import {createTilesetSpatialReference, I3SSpatialTransformer} from '@loaders.gl/tiles';

describe('I3SSpatialTransformer', () => {
  test('returns stable geographic offsets for projected source positions', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:3857',
        coordinateFrame: 'projected',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const transformed = transformer.transformPositions(
      [1113194.9079327357, 0, 12, 1113306.227423362, 0, 12],
      [1113194.9079327357, 0, 12]
    );

    expect(transformed.coordinateSystem).toBe('lnglat-offsets');
    expect(transformed.origin[0]).toBeCloseTo(10, 8);
    expect(Array.from(transformed.positions.slice(0, 3))).toEqual([0, 0, 0]);
    expect(transformed.positions[3]).toBeCloseTo(0.001, 6);
    expect(transformer.spatialReference.status).toBe('transformed');
  });

  test('returns Float32 Cartesian offsets and a high-precision projected origin', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:3857'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const transformed = transformer.transformPositions([10, 0, 12, 10.001, 0, 12], [10, 0, 12]);

    expect(transformed.coordinateSystem).toBe('cartesian');
    expect(transformed.origin[0]).toBeCloseTo(1113194.9079327357, 6);
    expect(Array.from(transformed.positions.slice(0, 3))).toEqual([0, 0, 0]);
    expect(transformed.positions[3]).toBeCloseTo(111.31949, 4);
    expect(Array.from(transformed.modelMatrix).slice(12, 15)).toEqual(transformed.origin);
  });

  test('transforms earth-centered normals into the target projected basis', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:3857'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const normals = transformer.transformNormals([1, 0, 0], [0, 0, 0]);

    expect(normals[0]).toBeCloseTo(0, 5);
    expect(normals[1]).toBeCloseTo(0, 5);
    expect(normals[2]).toBeCloseTo(1, 5);
  });

  test('produces dateline-aware geographic bounds', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const transformed = transformer.transformBoundingVolume({mbs: [179.999, 0, 0, 500]});

    expect(transformed.region).toHaveLength(6);
    expect(transformed.region![0]).toBeGreaterThan(transformed.region![2]);
    expect(transformed.region!.every(Number.isFinite)).toBe(true);
  });
});
