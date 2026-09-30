import {parse} from '@loaders.gl/core';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles/bundled';
import {makeMeshArrowTable} from '@loaders.gl/schema-utils';
import {expect, test} from 'vitest';
import type {PointCloudTilesetSource} from '@loaders.gl/tiles';
import type {PointCloudSourceTile} from '../../src/v5/point-cloud-source';
import {
  encodePointCloudSource,
  encodePointCloudSourceTile
} from '../../src/v5/point-cloud-source-encoder';

const tileHeader: PointCloudSourceTile['header'] = {
  id: 'tile-0',
  level: 0,
  pointCount: 2,
  geometricError: 0,
  boundingVolume: {
    cartographicBounds: [
      [0, 0, 0],
      [1, 1, 1]
    ],
    center: [0, 0, 0],
    radius: 1
  },
  spatialBoundingVolume: {
    cartographicBounds: [
      [2, 3, 4],
      [5, 6, 7]
    ],
    center: [3, 4, 5],
    radius: 6,
    coordinateFrame: 'cartesian'
  }
};

test('encodePointCloudSourceTile#encodes Arrow positions and retains source placement metadata', async () => {
  const modelMatrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 10, 20, 30, 1];
  const pointData = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3, 4, 5, 6]), size: 3},
    COLOR_0: {value: new Uint8Array([255, 0, 0, 0, 255, 0]), size: 3}
  });
  const sourceTile: PointCloudSourceTile = {
    header: tileHeader,
    content: {
      data: pointData,
      pointCount: 2,
      cartographicOrigin: [10, 20, 30],
      coordinateSystem: 'cartesian',
      modelMatrix,
      spatialBoundingVolume: tileHeader.spatialBoundingVolume
    }
  };

  const encoded = encodePointCloudSourceTile(sourceTile);
  expect(encoded).not.toBeNull();
  const parsedTile = await parse(encoded!.pnts, Tiles3DLoader, {worker: false});

  expect(Array.from(parsedTile.attributes.positions!)).toEqual([1, 2, 3, 4, 5, 6]);
  expect(Array.from(parsedTile.attributes.colors!.value)).toEqual([255, 0, 0, 0, 255, 0]);
  expect(encoded).toMatchObject({
    id: 'tile-0',
    header: tileHeader,
    pointCount: 2,
    coordinateSystem: 'cartesian',
    cartographicOrigin: [10, 20, 30],
    modelMatrix,
    spatialBoundingVolume: tileHeader.spatialBoundingVolume
  });
  expect(encoded!.pnts).toBeInstanceOf(ArrayBuffer);
  expect(encoded!.modelMatrix).not.toBe(modelMatrix);
});

test('encodePointCloudSourceTile#returns null for a source tile without content', () => {
  expect(encodePointCloudSourceTile({header: tileHeader, content: null})).toBeNull();
});

test('encodePointCloudSource#streams encoded non-empty source tiles', async () => {
  const pointData = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3}
  });
  const source = {
    isReady: true,
    initialize: async () => {},
    getRootTile: async () => tileHeader,
    getChildren: async () => [],
    loadTileContent: async () => ({
      data: pointData,
      pointCount: 1,
      cartographicOrigin: [0, 0, 0],
      coordinateSystem: 'cartesian' as const
    })
  } as unknown as PointCloudTilesetSource;
  const encodedTiles = [];

  for await (const tile of encodePointCloudSource(source)) {
    encodedTiles.push(tile);
  }

  expect(encodedTiles.map(tile => tile.id)).toEqual(['tile-0']);
  expect(encodedTiles[0].pointCount).toBe(1);
  expect(encodedTiles[0].pnts).toBeInstanceOf(ArrayBuffer);
});
