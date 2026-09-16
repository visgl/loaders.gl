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
});
