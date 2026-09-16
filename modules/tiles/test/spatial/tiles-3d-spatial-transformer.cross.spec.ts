// loaders.gl
// SPDX-License-Identifier: MIT

import {describe, expect, test} from 'vitest';
import {createTilesetSpatialReference, Tiles3DSpatialTransformer} from '@loaders.gl/tiles';

describe('Tiles3DSpatialTransformer', () => {
  test('transforms packed positions and conservative boxes', () => {
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
    const transformer = new Tiles3DSpatialTransformer(spatialReference);
    const positions = transformer.transformPositions([0, 0, 10, 1113194.9079, 0, 10]);
    expect(positions[0]).toBeCloseTo(0, 8);
    expect(positions[3]).toBeCloseTo(10, 6);

    const volume = transformer.transformBoundingVolume({
      box: [0, 0, 10, 111319.5, 0, 0, 0, 111319.5, 0, 0, 0, 10]
    });
    expect(volume.box).toHaveLength(12);
    expect(volume.box?.[0]).toBeCloseTo(0, 8);
    expect(volume.box?.[1]).toBeCloseTo(0, 8);
  });

  test('rejects malformed packed attributes', () => {
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
    const transformer = new Tiles3DSpatialTransformer(spatialReference);
    expect(() => transformer.transformPositions([0, 1])).toThrow(/multiple of three/);
    expect(() => transformer.transformNormals([0, 0, 1], [0, 0])).toThrow(/matching/);
  });

  test('reprojects geographic regions through the target frame', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:3857',
        coordinateFrame: 'projected',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4978'}
    );
    const transformer = new Tiles3DSpatialTransformer(spatialReference);
    const volume = transformer.transformBoundingVolume({
      region: [(-1 * Math.PI) / 180, (-1 * Math.PI) / 180, Math.PI / 180, Math.PI / 180, 0, 100]
    });

    expect(volume.box).toHaveLength(12);
    expect(volume.box?.[0]).toBeGreaterThan(6_300_000);
    expect(volume.box?.[1]).toBeCloseTo(0, -2);
    expect(volume.box?.[2]).toBeCloseTo(0, -2);
    expect(volume.box?.[7]).toBeGreaterThan(1_000);
  });

  test('samples both sides of antimeridian regions', () => {
    const spatialReference = createTilesetSpatialReference(
      {
        sourceCrs: 'EPSG:3857',
        coordinateFrame: 'projected',
        axisOrder: 'xyz',
        heightReference: 'ellipsoidal',
        provenance: 'metadata'
      },
      {targetCrs: 'EPSG:4978'}
    );
    const transformer = new Tiles3DSpatialTransformer(spatialReference);
    const volume = transformer.transformBoundingVolume({
      region: [
        (179 * Math.PI) / 180,
        (-1 * Math.PI) / 180,
        (-179 * Math.PI) / 180,
        Math.PI / 180,
        0,
        0
      ]
    });

    expect(volume.box).toHaveLength(12);
    expect(volume.box?.[0]).toBeLessThan(-6_000_000);
    expect(volume.box?.[7]).toBeGreaterThan(1_000);
  });
});
