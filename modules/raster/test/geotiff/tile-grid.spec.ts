// loaders.gl
// SPDX-License-Identifier: MIT
import {expect, test} from 'vitest';
import {readRasterTile, sampleRaster} from '@loaders.gl/core/loader-utils';
import type {TypedArray} from '@loaders.gl/core/loader-utils';
import {GeoTIFFRasterSource, getImageTileGrid} from '../../src/geotiff/geotiff-source';
import {createTiffFixture} from './lib/tiff/tiff-fixture';
import type {TiffSourceImage} from '../../src/geotiff/lib/tiff/tiff-source-decoder';

/** Gives the tiny synthetic tiles an explicit EPSG:3857 transform. */
const TILE_GEO_TAGS = [
  {tag: 33550, type: 12, values: [2, 3, 0]},
  {tag: 33922, type: 12, values: [0, 0, 0, 100, 200, 0]},
  {tag: 34735, type: 3, values: [1, 1, 0, 2, 1024, 0, 1, 1, 3072, 0, 1, 3857]}
];

/** Creates a tiled TIFF with a base mask and an optional mask for the reduced image. */
function createMaskedOverviewSource(hasOverviewMask: boolean): GeoTIFFRasterSource {
  const images = [
    {width: 4, height: 4, tags: TILE_GEO_TAGS},
    {width: 4, height: 4, tags: [{tag: 254, type: 4, values: [4]}]},
    {width: 2, height: 2, tags: [{tag: 254, type: 4, values: [1]}]},
    ...(hasOverviewMask
      ? [
          {
            width: 2,
            height: 2,
            tags: [{tag: 254, type: 4, values: [5]}],
            values: [[255, 0, 0, 255]]
          }
        ]
      : [])
  ];
  return createTiledSource(images);
}

/** Builds a GeoTIFF source from a chain of tiled image directories. */
function createTiledSource(images: Parameters<typeof createTiffFixture>[0][]): GeoTIFFRasterSource {
  let fileOffset = 0;
  const fragments = images.map((image, index) => {
    const {data, directoryOffset, entryOffsets} = createTiffFixture(
      {tileSize: [2, 2], bits: [8], ...image},
      fileOffset
    );
    fileOffset += data.byteLength;
    if (index < images.length - 1) {
      const nextDirectoryPointer = directoryOffset + 2 + entryOffsets.size * 12;
      new DataView(data).setUint32(nextDirectoryPointer, fileOffset + directoryOffset, true);
    }
    return data;
  });
  return new GeoTIFFRasterSource(new Blob(fragments), {});
}

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

test('GeoTIFF native bridge reads the same pixels as a crop of a full native IFD', async () => {
  const fixture = await fetch('/__loaders_gl_test_fixtures__/test/data/pmtiles-authoring.tif');
  const source = new GeoTIFFRasterSource(await fixture.blob(), {});
  try {
    const {boundingBox, width, height, crs} = await source.getMetadata();
    const full = await source.getRasterForRegion({bounds: boundingBox!, crs: crs!, width, height});
    const tile = await readRasterTile(source, {tileMatrix: '0', x: 1, y: 0});
    const values = full.data as Uint8Array;
    const crop = new Uint8Array([...values.subarray(2, 4), ...values.subarray(6, 8)]);
    expect(crop).toEqual(new Uint8Array([3, 4, 7, 8]));
    expect(tile).toMatchObject({
      data: crop,
      width: 2,
      height: 2,
      overview: 0,
      transform: [90, 0, 0, 0, -85.0511287798066, 85.0511287798066]
    });
  } finally {
    source.finalize();
  }
});

test('GeoTIFF native discovery excludes an overview without a matching mask', async () => {
  const source = createMaskedOverviewSource(false);
  try {
    const metadata = await source.getMetadata();
    expect(metadata.tileGrid?.matrixIds).toEqual(['0', '2']);
    expect(metadata.nativeTileMatrixIds).toEqual(['0']);
    await expect(readRasterTile(source, {tileMatrix: '2', x: 0, y: 0})).rejects.toThrow(
      'Tile matrix "2" does not support native tile reads. Readable matrix IDs: ["0"]'
    );
    await expect(readRasterTile(source, {tileMatrix: '0', x: 0, y: 0})).resolves.toMatchObject({
      data: new Uint8Array([1, 2, 5, 6]),
      overview: 0
    });
  } finally {
    source.finalize();
  }
});

test('GeoTIFF native discovery includes an overview with a matching mask', async () => {
  const source = createMaskedOverviewSource(true);
  try {
    const metadata = await source.getMetadata();
    expect(metadata.tileGrid?.matrixIds).toEqual(['0', '2']);
    expect(metadata.nativeTileMatrixIds).toEqual(['0', '2']);
    await expect(readRasterTile(source, {tileMatrix: '2', x: 0, y: 0})).resolves.toMatchObject({
      data: new Uint8Array([1, 2, 3, 4]),
      overview: 2,
      validityMasks: [{data: new Uint8Array([1, 0, 0, 1]), width: 2, height: 2}]
    });
  } finally {
    source.finalize();
  }
});

test('readRasterTile lets GeoTIFF validate explicit bands for a single-band overview', async () => {
  const source = createTiledSource([
    {width: 4, height: 4, bits: [8, 8], tags: TILE_GEO_TAGS},
    {width: 2, height: 2, tags: [{tag: 254, type: 4, values: [1]}]}
  ]);
  try {
    const address = {tileMatrix: '1', x: 0, y: 0};
    const metadata = await source.getMetadata();
    expect(metadata.nativeTileMatrixIds).toEqual(['0']);
    await expect(readRasterTile(source, address)).rejects.toThrow(
      'Tile matrix "1" does not support native tile reads. Readable matrix IDs: ["0"]'
    );
    await expect(readRasterTile(source, {...address, bands: [0]})).resolves.toMatchObject({
      data: new Uint8Array([1, 2, 3, 4]),
      width: 2,
      height: 2,
      overview: 1
    });
    await expect(readRasterTile(source, {...address, bands: [1]})).rejects.toThrow(
      'GeoTIFF IFD 1 is incompatible with native tile decoding'
    );
  } finally {
    source.finalize();
  }
});

test.each([
  {tag: 324, type: 4, values: [4096, 4104, 4112, 0]},
  {tag: 325, type: 4, values: [8, 8, 8, 0]}
])('GeoTIFF marks a sparse planar block ($tag) and padded pixels invalid', async sparseTag => {
  const fixture = createTiffFixture({
    width: 3,
    height: 2,
    tileSize: [2, 2],
    bits: [16, 16],
    planar: true,
    tags: [...TILE_GEO_TAGS, sparseTag]
  });
  const source = new GeoTIFFRasterSource(new Blob([fixture.data]), {});
  try {
    const raster = (await readRasterTile(source, {tileMatrix: '0', x: 1, y: 0, bands: [1, 0]}))!;
    expect([...(raster.data as TypedArray[])]).toEqual([
      new Uint16Array(4),
      new Uint16Array([3, 0, 6, 0])
    ]);
    expect(sampleRaster(raster, [0, 1])).toMatchObject({valid: [false, true]});
    expect(sampleRaster(raster, [1, 1])).toMatchObject({valid: [false, false]});
  } finally {
    source.finalize();
  }
});

test('GeoTIFF native tiles retain mixed planar types at the padded edge', async () => {
  const fixture = createTiffFixture({
    width: 3,
    height: 2,
    tileSize: [2, 2],
    bits: [16, 32],
    formats: [2, 3],
    planar: true,
    tags: TILE_GEO_TAGS
  });
  const source = new GeoTIFFRasterSource(new Blob([fixture.data]), {});
  try {
    const address = {tileMatrix: '0', x: 1, y: 0};
    const raster = await readRasterTile(source, address);
    expect(raster).toMatchObject({dtype: 'mixed', interleaved: false});
    expect([...(raster?.data as TypedArray[])]).toEqual([
      new Int16Array([-3, 0, -6, 0]),
      new Float32Array([35.25, 0, 38.25, 0])
    ]);
    await expect(readRasterTile(source, {...address, interleaved: true})).rejects.toThrow(
      /require planar arrays/
    );
  } finally {
    source.finalize();
  }
});

test('GeoTIFF returns a fully invalid, NoData-filled tile for an absent chunky block', async () => {
  const fixture = createTiffFixture({
    width: 2,
    height: 2,
    tileSize: [2, 2],
    tags: [...TILE_GEO_TAGS, {tag: 325, type: 4, values: [0]}, {tag: 42113, type: 2, values: '999'}]
  });
  const source = new GeoTIFFRasterSource(new Blob([fixture.data]), {});
  try {
    const raster = await readRasterTile(source, {tileMatrix: '0', x: 0, y: 0});
    expect(raster).toMatchObject({
      data: new Uint16Array(4).fill(999),
      validityMasks: [{data: new Uint8Array(4), width: 2, height: 2}]
    });
  } finally {
    source.finalize();
  }
});
