// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {Geoid} from '@math.gl/geoid';
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

  test('uses the inverse-transpose projection Jacobian for mixed projected normals', () => {
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
    const latitudeRadians = Math.PI / 3;
    const ecefEastUpNormal = [
      Math.cos(latitudeRadians) / Math.SQRT2,
      1 / Math.SQRT2,
      Math.sin(latitudeRadians) / Math.SQRT2
    ];
    const normals = transformer.transformNormals(ecefEastUpNormal, [0, 60, 0]);

    expect(normals[0]).toBeCloseTo(1 / Math.sqrt(5), 2);
    expect(normals[1]).toBeCloseTo(0, 4);
    expect(normals[2]).toBeCloseTo(2 / Math.sqrt(5), 2);
    expect(normals[2] / normals[0]).toBeGreaterThan(1.9);
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

  test('applies requested geoid conversion to target-space bounds', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'orthometric',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', targetHeightReference: 'ellipsoidal'}
    );
    const geoid = {getHeight: () => 30} as Geoid;
    const transformer = new I3SSpatialTransformer(spatialReference, {geoidModel: geoid});
    const targetBounds = transformer.transformBoundingVolume({mbs: [10, 20, 100, 0]});
    const traversalBounds = transformer.transformBoundingVolumeToGeographic({
      mbs: [10, 20, 100, 0]
    });

    expect(targetBounds.region?.[4]).toBeCloseTo(130, 8);
    expect(targetBounds.region?.[5]).toBeCloseTo(130, 8);
    expect(traversalBounds.region[4]).toBeCloseTo(100, 8);
    expect(traversalBounds.region[5]).toBeCloseTo(100, 8);
  });

  test('normalizes source units and absolute-height offsets before reprojection', async () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        units: ['degree', 'degree', 'foot'],
        verticalUnitScale: 0.3048,
        elevationMode: 'absoluteHeight',
        elevationOffset: 10,
        elevationUnit: 'foot',
        elevationUnitScale: 0.3048,
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const transformed = await transformer.transformPositionsAsync(
      [10, 20, 100, 10, 20, 110],
      [10, 20, 100]
    );

    expect(transformed.origin[2]).toBeCloseTo(33.528, 8);
    expect(transformed.positions[5]).toBeCloseTo(3.048, 5);
  });

  test('normalizes bound center heights without scaling metric bound extents', async () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        units: ['degree', 'degree', 'foot'],
        verticalUnitScale: 0.3048,
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326'}
    );
    const transformer = new I3SSpatialTransformer(spatialReference);
    const transformed = await transformer.transformBoundsAsync({mbs: [10, 20, 100, 10]});

    expect(transformed.i3sLodMbs).toEqual([10, 20, 30.48, 10]);
    expect(
      transformed.spatialBoundingVolume.region![5] - transformed.spatialBoundingVolume.region![4]
    ).toBeGreaterThan(15);
  });

  test.each([
    ['onTheGround', 100, 0, 100],
    ['relativeToGround', 100, 5, 115]
  ] as const)('applies %s terrain placement with the documented formula', async (elevationMode, surfaceHeight, sourceHeight, expectedHeight) => {
    const terrainElevationProvider = {
      sampleElevations: async (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => surfaceHeight),
      getElevationRange: () => ({minimum: surfaceHeight, maximum: surfaceHeight})
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        verticalUnitScale: 1,
        elevationMode,
        elevationOffset: 10,
        elevationUnitScale: 1,
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider
    });
    const transformed = await transformer.transformPositionsAsync(
      [10, 20, sourceHeight],
      [10, 20, sourceHeight]
    );

    expect(transformed.origin[2]).toBeCloseTo(expectedHeight, 8);
  });

  test('uses the scene provider for relativeToScene placement', async () => {
    const sceneElevationProvider = {
      unit: 'foot',
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 100),
      getElevationRange: () => ({minimum: 100, maximum: 100})
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'relativeToScene',
        elevationOffset: 2,
        elevationUnitScale: 1,
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', sceneElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      sceneElevationProvider
    });
    const transformed = await transformer.transformPositionsAsync([10, 20, 5], [10, 20, 5]);

    expect(transformed.origin[2]).toBeCloseTo(37.48, 8);
  });

  test('converts provider and output height references with one geoid model', async () => {
    const geoid = {getHeight: () => 30} as Geoid;
    const terrainElevationProvider = {
      heightReference: 'ellipsoidal' as const,
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 100),
      getElevationRange: () => ({minimum: 100, maximum: 100})
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'orthometric',
        elevationMode: 'relativeToGround',
        elevationOffset: 0,
        elevationUnitScale: 1,
        provenance: 'metadata'
      },
      {
        targetCrs: 'EPSG:4326',
        targetHeightReference: 'ellipsoidal',
        terrainElevationProvider,
        geoidModel: geoid
      }
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider,
      geoidModel: geoid
    });
    const transformed = await transformer.transformPositionsAsync([10, 20, 5], [10, 20, 5]);

    // Provider 100m ellipsoidal -> 70m orthometric; +5m relative; -> 105m ellipsoidal.
    expect(transformed.origin[2]).toBeCloseTo(105, 8);
  });

  test('applies placement to traversal and output bounds from one provider batch', async () => {
    let rangeCallCount = 0;
    const terrainElevationProvider = {
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 50),
      getElevationRange: () => {
        rangeCallCount++;
        return {minimum: 50, maximum: 50};
      }
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'relativeToGround',
        elevationOffset: 2,
        elevationUnitScale: 1,
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider
    });
    const bounds = await transformer.transformBoundsAsync({mbs: [10, 20, 5, 0]});

    expect(rangeCallCount).toBe(1);
    expect(bounds.spatialBoundingVolume.region?.[4]).toBeCloseTo(57, 8);
    expect(bounds.spatialBoundingVolume.region?.[5]).toBeCloseTo(57, 8);
    expect(bounds.i3sLodMbs[2]).toBeCloseTo(57, 5);
  });

  test('rejects incomplete elevation-provider batches', async () => {
    const terrainElevationProvider = {
      sampleElevations: () => [],
      getElevationRange: () => ({minimum: 0, maximum: 0})
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'onTheGround',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider
    });

    await expect(transformer.transformPositionsAsync([10, 20, 5], [10, 20, 5])).rejects.toThrow(
      'returned 0 heights for 2 positions'
    );
  });

  test('includes provider-reported interior surface extrema in transformed bounds', async () => {
    let requestedBounds: unknown;
    const terrainElevationProvider = {
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 0),
      getElevationRange: (bounds: unknown) => {
        requestedBounds = bounds;
        return {minimum: -100, maximum: 1000};
      }
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'onTheGround',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider
    });
    const bounds = await transformer.transformBoundsAsync({mbs: [10, 20, 0, 100]});

    expect(requestedBounds).toMatchObject({west: expect.any(Number), east: expect.any(Number)});
    expect(bounds.spatialBoundingVolume.region?.[4]).toBeCloseTo(-100, 8);
    expect(bounds.spatialBoundingVolume.region?.[5]).toBeCloseTo(1000, 8);
  });

  test('rejects invalid provider ranges during conservative bound preparation', async () => {
    const terrainElevationProvider = {
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 0),
      getElevationRange: () => ({minimum: 10, maximum: -10})
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'onTheGround',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider}
    );
    const transformer = new I3SSpatialTransformer(spatialReference, {
      terrainElevationProvider
    });

    await expect(transformer.transformBoundsAsync({mbs: [10, 20, 0, 100]})).rejects.toThrow(
      'returned an invalid range'
    );
  });

  test('requires point and range operations on surface providers', () => {
    const incompleteProvider = {
      sampleElevations: (positions: readonly (readonly [number, number])[]) =>
        positions.map(() => 0)
    };
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        elevationMode: 'onTheGround',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', terrainElevationProvider: incompleteProvider as any}
    );

    expect(
      () =>
        new I3SSpatialTransformer(spatialReference, {
          terrainElevationProvider: incompleteProvider as any
        })
    ).toThrow('must implement sampleElevations() and getElevationRange()');
  });
});
