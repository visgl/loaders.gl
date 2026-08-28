// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {describe, expect, test} from 'vitest';
import type {Geoid} from '@math.gl/geoid';
import {
  createTilesetSpatialReference,
  registerGeoidModel,
  SpatialCoordinateTransformer
} from '@loaders.gl/tiles';

describe('SpatialCoordinateTransformer', () => {
  test('retains native coordinates and extra components', () => {
    const spatialReference = createTilesetSpatialReference({
      sourceCrs: 'EPSG:4326',
      coordinateFrame: 'geographic',
      axisOrder: 'xy',
      heightReference: 'ellipsoidal',
      provenance: 'metadata'
    });
    const transformer = new SpatialCoordinateTransformer(spatialReference);

    expect(transformer.transformPosition([-122, 37, 10, 99])).toEqual([-122, 37, 10, 99]);
  });

  test('uses Proj4 for horizontal transformation', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:3857',
        coordinateFrame: 'projected',
        axisOrder: 'xy',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326'}
    );
    const transformer = new SpatialCoordinateTransformer(spatialReference);
    const transformed = transformer.transformPosition([1113194.9079327357, 0, 12]);

    expect(transformed[0]).toBeCloseTo(10, 8);
    expect(transformed[1]).toBeCloseTo(0, 8);
    expect(transformed[2]).toBe(12);
  });

  test('converts orthometric and ellipsoidal heights with a registered geoid', () => {
    const constantGeoid = {getHeight: () => 30} as Geoid;
    registerGeoidModel('test-geoid', constantGeoid);
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        coordinateFrame: 'geographic',
        axisOrder: 'xy',
        heightReference: 'orthometric',
        provenance: 'metadata'
      },
      {targetHeightReference: 'ellipsoidal'}
    );
    const transformer = new SpatialCoordinateTransformer(spatialReference, {
      geoidModel: 'test-geoid'
    });

    expect(transformer.transformPosition([10, 20, 100])).toEqual([10, 20, 130]);
  });

  test('rejects geocentric height conversion instead of treating Cartesian z as height', () => {
    const constantGeoid = {getHeight: () => 30} as Geoid;
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4978',
        coordinateFrame: 'geocentric',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4326', targetHeightReference: 'orthometric'}
    );

    expect(
      () => new SpatialCoordinateTransformer(spatialReference, {geoidModel: constantGeoid})
    ).toThrow('Geocentric height conversion is not supported');
  });

  test('rejects requested conversion with unknown source metadata', () => {
    const spatialReference = createTilesetSpatialReference({}, {targetCrs: 'EPSG:4326'});

    expect(() => new SpatialCoordinateTransformer(spatialReference)).toThrow(
      'source CRS is unknown'
    );
  });

  test('rejects height conversion without a supplied geoid model', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:4326',
        heightReference: 'orthometric'
      },
      {targetHeightReference: 'ellipsoidal'}
    );

    expect(() => new SpatialCoordinateTransformer(spatialReference)).toThrow(
      'requires a registered geoid model'
    );
  });

  test('rejects height conversion when the source height reference is unknown', () => {
    const spatialReference = createTilesetSpatialReference(
      {sourceCrs: 'EPSG:4326'},
      {targetHeightReference: 'ellipsoidal'}
    );

    expect(() => new SpatialCoordinateTransformer(spatialReference)).toThrow(
      'source height reference is unknown'
    );
  });
});
