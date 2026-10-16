// loaders.gl
// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import {GeoTIFFRasterSource, getImageTileGrid} from '../src/geotiff-source-loader';
import {createTiffFixture} from './lib/tiff/tiff-fixture';
import type {TiffSourceImage} from '../src/lib/tiff/tiff-source-decoder';

/** Makes a metadata-only tiled image; attempting sample decoding is an error. */
function createImage(
  width = 10,
  height = 7,
  tags: Record<string, unknown> = {},
  keys: Record<string, unknown> = {}
) {
  return {
    fileDirectory: {NewSubfileType: 0, TileWidth: 4, TileLength: 3, ...tags},
    getWidth: () => width,
    getHeight: () => height,
    getTileWidth: () => 4,
    getTileHeight: () => 3,
    getGeoKeys: () => ({ProjectedCSTypeGeoKey: 3857, GTRasterTypeGeoKey: 1, ...keys}),
    getResolution: () => [2, -3],
    getOrigin: () => [100, 200],
    readRasters: () => {
      throw new Error('Samples must not be decoded');
    }
  } as unknown as TiffSourceImage;
}

test('native tiled overviews retain IFD ids, independent resolutions and padded edge tiles', () => {
  const reference = createImage();
  const mask = createImage(10, 7, {NewSubfileType: 4});
  const overview = createImage(3, 2, {NewSubfileType: 1});
  const grid = getImageTileGrid([reference, mask, overview], reference)!;
  expect(grid.matrixIds).toEqual(['0', '2']);
  expect(grid.matrices![0]).toMatchObject({
    origin: [100, 200],
    resolution: 2,
    resolutionY: 3,
    tileSize: [4, 3],
    matrixSize: [3, 3]
  });
  expect(grid.matrices![1]).toMatchObject({
    resolution: 20 / 3,
    resolutionY: 10.5,
    matrixSize: [1, 1]
  });
});

test('point registration is converted from sample centers to storage tile corners', () => {
  const image = createImage(10, 7, {}, {GTRasterTypeGeoKey: 2});
  expect(getImageTileGrid([image], image)!.matrices![0].origin).toEqual([99, 201.5]);
});

test.each([
  {TileWidth: undefined},
  {ModelTransformation: [2, 1, 0, 100, 0, -3, 0, 200]},
  {ModelTransformation: [-2, 0, 0, 100, 0, -3, 0, 200]}
])('unsupported storage or affine omits tile geometry: %j', tags => {
  const image = createImage(10, 7, tags);
  expect(getImageTileGrid([image], image)).toBeUndefined();
});

test('south-up geometry uses bottom-left origin; absent or inconsistent CRS omits geometry', () => {
  const image = createImage(10, 7, {ModelTransformation: [2, 0, 0, 100, 0, 3, 0, 200]});
  expect(getImageTileGrid([image], image)!.matrices![0].cornerOfOrigin).toBe('bottomLeft');
  const unknown = createImage(10, 7, {}, {ProjectedCSTypeGeoKey: 32767});
  expect(getImageTileGrid([unknown], unknown)).toBeUndefined();
  const different = createImage(3, 2, {NewSubfileType: 1}, {ProjectedCSTypeGeoKey: 4326});
  expect(getImageTileGrid([image, different], image)).toBeUndefined();
});

test('inherited point overviews preserve the reference pixel footprint origin', () => {
  const image = createImage(10, 7, {}, {GTRasterTypeGeoKey: 2});
  const overview = createImage(3, 2, {NewSubfileType: 1}, {GTRasterTypeGeoKey: 2});
  expect(getImageTileGrid([image, overview], image)!.matrices![1].origin).toEqual([99, 201.5]);
});

test.each([
  1, 2
])('public source metadata exposes a tiny tiled GeoTIFF with registration %i', async registration => {
  const bytes = createTiffFixture({
    width: 3,
    height: 3,
    tileSize: [2, 2],
    tags: [
      {tag: 33550, type: 12, values: [2, 3, 0]},
      {tag: 33922, type: 12, values: [0, 0, 0, 100, 200, 0]},
      {
        tag: 34735,
        type: 3,
        values: [1, 1, 0, 3, 1024, 0, 1, 1, 1025, 0, 1, registration, 3072, 0, 1, 3857]
      }
    ]
  });
  const source = new GeoTIFFRasterSource(new Blob([bytes.data]), {});
  try {
    const metadata = await source.getMetadata();
    expect(metadata.tileGrid?.matrices).toEqual([
      expect.objectContaining({
        id: '0',
        origin: registration === 2 ? [99, 201.5] : [100, 200],
        matrixSize: [2, 2],
        tileSize: [2, 2],
        resolution: 2,
        resolutionY: 3
      })
    ]);
    expect([metadata.width, metadata.height]).toEqual([3, 3]);
  } finally {
    source.finalize();
  }
});

test.each([
  0, 2
])('independent TIFF pages with flags %i are excluded without renumbering', flags => {
  const reference = createImage();
  const page = createImage(10, 7, {NewSubfileType: flags}, {ProjectedCSTypeGeoKey: 32767});
  const overview = createImage(3, 2, {NewSubfileType: 1});
  expect(getImageTileGrid([reference, page, overview], reference)!.matrixIds).toEqual(['0', '2']);
});

test('legacy reduced-image tags establish overview membership', () => {
  const reference = createImage();
  const overview = createImage(3, 2, {SubfileType: 2});
  expect(getImageTileGrid([reference, overview], reference)!.matrixIds).toEqual(['0', '1']);
});

test.each([
  {ProjectedCSTypeGeoKey: 32767},
  {ProjectedCSTypeGeoKey: undefined, GTModelTypeGeoKey: 1},
  {ProjectedCSTypeGeoKey: undefined, GTCitationGeoKey: 'unsupported local CRS'}
])('explicitly unknown overview CRS omits the grid: %j', keys => {
  const reference = createImage();
  const overview = createImage(3, 2, {NewSubfileType: 1}, keys);
  expect(getImageTileGrid([reference, overview], reference)).toBeUndefined();
});

test.each([
  null,
  {},
  {GTRasterTypeGeoKey: 1},
  {ProjectedCSTypeGeoKey: undefined}
])('absent overview CRS may inherit the reference CRS: %j', keys => {
  const reference = createImage();
  const overview = createImage(3, 2, {NewSubfileType: 1});
  overview.getGeoKeys = () => keys;
  expect(getImageTileGrid([reference, overview], reference)!.crs).toBe('EPSG:3857');
});
