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

test.each([
  {constantRGBA: undefined, expected: [12, 34, 56, 255]},
  {constantRGBA: [98, 76, 54, 255], expected: [98, 76, 54, 255]}
])('encodePointCloudSourceTile#uses constant color $expected', async ({constantRGBA, expected}) => {
  const pointData = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3}
  });
  const encoded = encodePointCloudSourceTile(
    {
      header: tileHeader,
      content: {
        data: pointData,
        pointCount: 1,
        cartographicOrigin: [0, 0, 0],
        coordinateSystem: 'cartesian',
        constantRGBA: [12, 34, 56, 255]
      }
    },
    {constantRGBA}
  );
  const parsedTile = await parse(encoded!.pnts, Tiles3DLoader, {worker: false});

  expect(parsedTile.constantRGBA).toEqual(expected);
});

test('encodePointCloudSourceTile#retains small offsets in large coordinates with an RTC center', async () => {
  const rtcCenter: [number, number, number] = [6378137, 500000, 1000];
  const positions = new Float64Array([6378137.125, 500000.25, 1000.5]);
  const encoded = encodePointCloudSourceTile(
    {
      header: {...tileHeader, pointCount: 1},
      content: {
        data: makeMeshArrowTable({POSITION: {value: positions, size: 3}}),
        pointCount: 1,
        cartographicOrigin: [0, 0, 0],
        coordinateSystem: 'cartesian'
      }
    },
    {rtcCenter}
  );
  const parsedTile = await parse(encoded!.pnts, Tiles3DLoader, {worker: false});

  expect(Array.from(parsedTile.attributes.positions!)).toEqual([0.125, 0.25, 0.5]);
  expect(parsedTile.rtcCenter).toEqual(rtcCenter);
  expect(
    parsedTile.rtcCenter!.map((value, index) => value + parsedTile.attributes.positions![index])
  ).toEqual(Array.from(positions));
  expect(encoded!.cartographicOrigin).toEqual([0, 0, 0]);
});

test('encodePointCloudSource#selects batch metadata for non-empty tiles', async () => {
  const pointData = makeMeshArrowTable({
    POSITION: {value: new Float32Array([1, 2, 3]), size: 3},
    BATCH_ID: {value: new Uint16Array([0]), size: 1}
  });
  const source = {
    isReady: true,
    initialize: async () => {},
    getRootTile: async () => tileHeader,
    getChildren: async (header: PointCloudSourceTile['header']) =>
      header.id === tileHeader.id ? [{...tileHeader, id: 'empty-tile', level: 1}] : [],
    loadTileContent: async (header: PointCloudSourceTile['header']) =>
      header.id === tileHeader.id
        ? {
            data: pointData,
            pointCount: 1,
            cartographicOrigin: [0, 0, 0],
            coordinateSystem: 'cartesian' as const
          }
        : null
  } as unknown as PointCloudTilesetSource;
  const encodedTiles = [];
  const selectedTileIds: string[] = [];

  for await (const tile of encodePointCloudSource(source, {
    getTileEncodingOptions: sourceTile => {
      selectedTileIds.push(sourceTile.header.id);
      return {batchTableJson: {sourceTileId: [sourceTile.header.id]}};
    }
  })) {
    encodedTiles.push(tile);
  }

  expect(encodedTiles.map(tile => tile.id)).toEqual(['tile-0']);
  expect(encodedTiles[0].pointCount).toBe(1);
  expect(encodedTiles[0].pnts).toBeInstanceOf(ArrayBuffer);
  expect(selectedTileIds).toEqual(['tile-0']);
  const parsedTile = await parse(encodedTiles[0].pnts, Tiles3DLoader, {worker: false});
  expect(parsedTile.batchTableJson).toEqual({sourceTileId: ['tile-0']});
  expect(Array.from(parsedTile.batchIds!)).toEqual([0]);
});
