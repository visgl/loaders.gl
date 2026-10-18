// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test, vi} from 'vitest';
import {PMTiles, type Source} from 'pmtiles';
import type {NumericRasterData, RasterRegionParameters} from '@loaders.gl/loader-utils';
import {encodeRasterPMTiles} from '../../src/pmtiles/raster';

const SELECTED = [{z: 0, x: 0, y: 0}];

/** Synthetic region source with explicit georeferencing and two by two byte imagery. */
function createSource(bandCount = 1, crs = 'EPSG:3857') {
  const source = {
    getMetadata: vi.fn(async () => ({
      width: 2,
      height: 2,
      bandCount,
      dtype: 'uint8' as const,
      crs
    })),
    getRasterForRegion: vi.fn(
      async (parameters: RasterRegionParameters): Promise<NumericRasterData> => {
        const count = parameters.bands!.length;
        return {
          data: Array.from(
            {length: count},
            (_, index) => new Uint8Array([10, 20, 30, 40].map(value => value + index * 50))
          ),
          width: 2,
          height: 2,
          bandCount: count,
          dtype: 'uint8',
          interleaved: false,
          crs,
          transform: [
            (parameters.bounds[1][0] - parameters.bounds[0][0]) / 2,
            0,
            parameters.bounds[0][0],
            0,
            -(parameters.bounds[1][1] - parameters.bounds[0][1]) / 2,
            parameters.bounds[1][1]
          ],
          pixelRegistration: 'area'
        };
      }
    )
  };
  return source;
}

/** Opens the produced bytes with the independent PMTiles reference reader. */
function openArchive(data: ArrayBuffer) {
  const source: Source = {
    getKey: () => 'raster-export',
    getBytes: async (offset, length) => ({data: data.slice(offset, offset + length)})
  };
  return new PMTiles(source);
}

/** Uses the browser's PNG decoder to inspect rendered pixels, independent of the writer. */
async function decodePNG(data: ArrayBuffer): Promise<number[]> {
  const bitmap = await createImageBitmap(new Blob([data], {type: 'image/png'}));
  try {
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d')!;
    context.drawImage(bitmap, 0, 0);
    return Array.from(context.getImageData(0, 0, bitmap.width, bitmap.height).data);
  } finally {
    bitmap.close();
  }
}

test.each([
  1, 3
])('raster export writes %i-band PNG tiles and correct archive metadata', async bandCount => {
  const source = createSource(bandCount);
  const input = await source.getRasterForRegion({
    bounds: [
      [0, 0],
      [2, 2]
    ],
    crs: 'EPSG:3857',
    width: 2,
    height: 2,
    bands: Array.from({length: bandCount}, (_, index) => index)
  });
  const bytes = await encodeRasterPMTiles(source, {
    tiles: SELECTED,
    tileSize: 2,
    pmtiles: {
      internalCompression: 'gzip',
      metadata: {
        name: 'image',
        vector_layers: [{}],
        bounds: [],
        tiles: [],
        minzoom: 99,
        maxzoom: 99,
        center: [],
        tilestats: {}
      }
    }
  });
  const archive = openArchive(bytes);
  expect(await archive.getHeader()).toMatchObject({
    tileType: 2,
    tileCompression: 1,
    internalCompression: 2,
    numAddressedTiles: 1,
    minZoom: 0,
    maxZoom: 0
  });
  expect(await archive.getMetadata()).toEqual({name: 'image'});
  const tile = await archive.getZxy(0, 0, 0);
  expect(await decodePNG(tile!.data)).toEqual([
    10,
    bandCount === 1 ? 10 : 60,
    bandCount === 1 ? 10 : 110,
    255,
    20,
    bandCount === 1 ? 20 : 70,
    bandCount === 1 ? 20 : 120,
    255,
    30,
    bandCount === 1 ? 30 : 80,
    bandCount === 1 ? 30 : 130,
    255,
    40,
    bandCount === 1 ? 40 : 90,
    bandCount === 1 ? 40 : 140,
    255
  ]);
  expect(input.data[0]).toEqual(new Uint8Array([10, 20, 30, 40]));
  expect(source.getRasterForRegion).toHaveBeenLastCalledWith(
    expect.objectContaining({width: 2, height: 2, resampleMethod: 'nearest', interleaved: false})
  );
});

test.each([
  2, 4
])('raster %i-band imagery preserves alpha, nodata and validity masks', async count => {
  const source = createSource(count);
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => {
    const raster = await read(parameters);
    (raster.data as Uint8Array[])[count - 1] = new Uint8Array([255, 0, 255, 255]);
    raster.noData = 30;
    raster.validityMasks = [{data: new Uint8Array([1, 1, 1, 0]), width: 2, height: 2}];
    return raster;
  });
  const bytes = await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2});
  const pixels = await decodePNG((await openArchive(bytes).getZxy(0, 0, 0))!.data);
  expect(pixels[3]).toBe(255);
  expect(pixels.slice(4)).toEqual(new Array(12).fill(0));
});

test('longitude/latitude input is sampled at Mercator latitude centers, not linear latitude rows', async () => {
  const source = createSource(1, 'EPSG:4326');
  source.getRasterForRegion.mockImplementation(async parameters => ({
    data: new Uint8Array(Array.from({length: 64}, (_, index) => Math.floor(index / 8) + 1)),
    width: 8,
    height: 8,
    bandCount: 1,
    dtype: 'uint8',
    crs: 'EPSG:4326',
    transform: [
      45,
      0,
      -180,
      0,
      -(parameters.bounds[1][1] - parameters.bounds[0][1]) / 8,
      parameters.bounds[1][1]
    ]
  }));
  const archive = openArchive(await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 8}));
  const pixels = await decodePNG((await archive.getZxy(0, 0, 0))!.data);
  expect(Array.from({length: 8}, (_, row) => pixels[row * 8 * 4])).toEqual([
    1, 1, 2, 3, 6, 7, 8, 8
  ]);
});

test('CRS84 and clipped affine regions preserve transparent pixels outside coverage', async () => {
  const source = createSource(1, 'OGC:CRS84');
  source.getRasterForRegion.mockImplementation(async () => ({
    data: new Uint8Array([90]),
    width: 1,
    height: 1,
    bandCount: 1,
    dtype: 'uint8',
    crs: 'OGC:CRS84',
    transform: [180, 0, -180, 0, -85.0511287798066, 85.0511287798066]
  }));
  const pixels = await decodePNG(
    (await openArchive(await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})).getZxy(
      0,
      0,
      0
    ))!.data
  );
  expect(pixels).toEqual([90, 90, 90, 255, ...new Array(12).fill(0)]);
});

test('single-pixel interleaved raster and point registration are supported', async () => {
  const source = createSource(3);
  source.getRasterForRegion.mockImplementation(async () => ({
    data: new Uint8Array([5, 6, 7]),
    width: 1,
    height: 1,
    bandCount: 3,
    dtype: 'uint8',
    interleaved: true,
    crs: 'EPSG:3857',
    pixelRegistration: 'point',
    transform: [1, 0, 0, 0, 1, 0]
  }));
  const bytes = await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 1});
  expect(await decodePNG((await openArchive(bytes).getZxy(0, 0, 0))!.data)).toEqual([5, 6, 7, 255]);
});

test('selected bands and dimensions are forwarded without source ownership or inferred styling', async () => {
  const source = createSource(6);
  const bytes = await encodeRasterPMTiles(source, {
    tiles: [{z: 1, x: 1, y: 1}],
    tileSize: 2,
    bands: [5, 2, 0],
    selection: {time: 3},
    pmtiles: {bounds: [0, -80, 180, 0]}
  });
  expect(source.getRasterForRegion).toHaveBeenCalledWith(
    expect.objectContaining({bands: [5, 2, 0], selection: {time: 3}})
  );
  expect(await openArchive(bytes).getHeader()).toMatchObject({
    minLon: 0,
    minLat: -80,
    maxLon: 180,
    maxLat: 0
  });
});

test('empty tiles are omitted and count toward requested limits', async () => {
  const source = createSource();
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => {
    const raster = await read(parameters);
    if (parameters.bounds[0][0] >= 0)
      raster.validityMasks = [{data: new Uint8Array(4), width: 2, height: 2}];
    return raster;
  });
  const tiles = [
    {z: 1, x: 0, y: 0},
    {z: 1, x: 1, y: 0}
  ];
  const archive = openArchive(await encodeRasterPMTiles(source, {tiles, tileSize: 2}));
  expect((await archive.getHeader()).numAddressedTiles).toBe(1);
  expect(await archive.getZxy(1, 1, 0)).toBeUndefined();
  await expect(
    encodeRasterPMTiles(source, {tiles, tileSize: 2, pmtiles: {maxTiles: 1}})
  ).rejects.toThrow('requested tile limit');
  await expect(encodeRasterPMTiles(source, {tiles: [tiles[1]], tileSize: 2})).rejects.toThrow(
    'at least one tile'
  );
});

test.each([
  {tileSize: 0},
  {tileSize: 1025},
  {maxSourcePixels: 1},
  {maxDecodedBytes: 15},
  {bands: []},
  {bands: [0, 0]},
  {bands: [1]},
  {pmtiles: {maxTiles: 0}},
  {tiles: [{z: 27, x: 0, y: 0}]},
  {tiles: [{z: 1, x: -1, y: 0}]},
  {tiles: [{z: 0, x: 0, y: 1}]},
  {tiles: [...SELECTED, ...SELECTED]},
  {tiles: []},
  {pmtiles: {maxOutputBytes: 128}}
])('invalid raster export options fail explicitly: %j', async options => {
  await expect(
    encodeRasterPMTiles(createSource(), {tiles: SELECTED, tileSize: 2, ...options})
  ).rejects.toThrow();
});

test('unknown source CRS, invalid band counts and unselected multiband imagery fail', async () => {
  for (const source of [createSource(1, 'EPSG:32610'), createSource(0), createSource(5)])
    await expect(encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})).rejects.toThrow();
});

test.each([
  {dtype: 'uint16'},
  {width: 0},
  {height: 10000000},
  {bandCount: 2},
  {data: new Uint16Array(4)},
  {data: []},
  {data: new Uint8Array(3)},
  {bands: [{index: 0, dtype: 'uint8', scale: 2}]},
  {bands: []},
  {crs: 'EPSG:4326'},
  {transform: undefined},
  {transform: [0, 0, 0, 0, 0, 0]},
  {validityMasks: [{data: new Uint8Array(1), width: 2, height: 2}]},
  {validityMasks: [{data: new Uint8Array(4), width: 2, height: 2, band: 2}]}
])('unsupported or malformed returned raster fails: %j', async change => {
  const source = createSource();
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(
    async parameters => ({...(await read(parameters)), ...change}) as NumericRasterData
  );
  await expect(encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})).rejects.toThrow();
});

test('returned buffers plus RGBA allocation obey the decoded byte budget', async () => {
  await expect(
    encodeRasterPMTiles(createSource(), {tiles: SELECTED, tileSize: 2, maxDecodedBytes: 16})
  ).rejects.toThrow('decoded-byte budget');
});

test('pre-abort avoids metadata, and pending region abort closes the selection iterator', async () => {
  const source = createSource();
  const controller = new AbortController();
  controller.abort();
  await expect(
    encodeRasterPMTiles(source, {tiles: SELECTED, pmtiles: {signal: controller.signal}})
  ).rejects.toThrow();
  expect(source.getMetadata).not.toHaveBeenCalled();
  const pending = new AbortController();
  let closed = false;
  async function* addresses() {
    try {
      yield SELECTED[0];
    } finally {
      closed = true;
    }
  }
  source.getRasterForRegion.mockImplementation(() => {
    pending.abort();
    return new Promise(() => {});
  });
  await expect(
    encodeRasterPMTiles(source, {
      tiles: addresses(),
      tileSize: 2,
      pmtiles: {signal: pending.signal}
    })
  ).rejects.toThrow();
  expect(closed).toBe(true);
});

test('failure closes asynchronous selections and source errors are preserved', async () => {
  let closed = false;
  async function* addresses() {
    try {
      yield SELECTED[0];
      yield SELECTED[0];
    } finally {
      closed = true;
    }
  }
  await expect(
    encodeRasterPMTiles(createSource(), {tiles: addresses(), tileSize: 2})
  ).rejects.toThrow('Duplicate');
  expect(closed).toBe(true);
  const source = createSource();
  source.getRasterForRegion.mockRejectedValue(new Error('region failed'));
  await expect(encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})).rejects.toThrow(
    'region failed'
  );
});

test('real GeoTIFF Blob source exports an independently decoded geographic image', async () => {
  const {GeoTIFFRasterSource} = await import('@loaders.gl/raster/geotiff/index');
  const {createTiffFixture} = await import('../../../raster/test/geotiff/lib/tiff/tiff-fixture');
  const latitude = 85.0511287798066;
  const bytes = createTiffFixture({
    width: 2,
    height: 2,
    bits: [8],
    values: [[10, 20, 30, 40]],
    tags: [
      {tag: 33550, type: 12, values: [180, latitude, 0]},
      {tag: 33922, type: 12, values: [0, 0, 0, -180, latitude, 0]},
      {tag: 34735, type: 3, values: [1, 1, 0, 3, 1024, 0, 1, 2, 1025, 0, 1, 1, 2048, 0, 1, 4326]}
    ]
  });
  const source = new GeoTIFFRasterSource(new Blob([bytes.data]), {});
  try {
    const archive = openArchive(await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2}));
    expect(await decodePNG((await archive.getZxy(0, 0, 0))!.data)).toEqual([
      10, 10, 10, 255, 20, 20, 20, 255, 30, 30, 30, 255, 40, 40, 40, 255
    ]);
    // Caller retains the live source after export.
    expect((await source.getMetadata()).bandCount).toBe(1);
  } finally {
    source.finalize();
  }
});

test('default tile dimensions and valid band metadata preserve an identity byte profile', async () => {
  const source = createSource();
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => ({
    ...(await read(parameters)),
    bands: [{index: 0, dtype: 'uint8', scale: 1, offset: 0}],
    validityMasks: [
      {
        data: new Uint8Array([0, 1, 0, 1, 0, 1, 0, 1]),
        width: 2,
        height: 2,
        offset: 1,
        pixelStride: 2,
        rowStride: 4,
        band: 0
      }
    ]
  }));
  const tile = await openArchive(await encodeRasterPMTiles(source, {tiles: SELECTED})).getZxy(
    0,
    0,
    0
  );
  const {getBinaryImageMetadata} = await import('@loaders.gl/images');
  expect(getBinaryImageMetadata(tile!.data)).toMatchObject({
    width: 256,
    height: 256,
    mimeType: 'image/png'
  });
});

test('rendering yields between row groups so mid-render abort can stop export', async () => {
  const source = createSource();
  const controller = new AbortController();
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => {
    const raster = await read(parameters);
    setTimeout(() => controller.abort(), 0);
    return raster;
  });
  await expect(
    encodeRasterPMTiles(source, {tiles: SELECTED, pmtiles: {signal: controller.signal}})
  ).rejects.toThrow();
});

test('rotated source affine is sampled in map coordinates rather than row storage order', async () => {
  const source = createSource();
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => {
    const halfWorld = Math.PI * 6378137;
    return {
      ...(await read(parameters)),
      transform: [0, -halfWorld, halfWorld, halfWorld, 0, -halfWorld]
    };
  });
  const tile = await openArchive(
    await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})
  ).getZxy(0, 0, 0);
  expect(await decodePNG(tile!.data)).toEqual([
    40, 40, 40, 255, 20, 20, 20, 255, 30, 30, 30, 255, 10, 10, 10, 255
  ]);
});

test.each([false, true])('clamped byte rasters are accepted with planar=%s', async planar => {
  const source = createSource(planar ? 1 : 4);
  const read = source.getRasterForRegion.getMockImplementation()!;
  source.getRasterForRegion.mockImplementation(async parameters => {
    const raster = await read(parameters);
    const bytes = new Uint8ClampedArray(
      planar
        ? [10, 20, 30, 40]
        : [10, 60, 110, 255, 20, 70, 120, 255, 30, 80, 130, 255, 40, 90, 140, 255]
    );
    return {...raster, data: planar ? [bytes] : bytes, interleaved: !planar};
  });
  const tile = await openArchive(
    await encodeRasterPMTiles(source, {tiles: SELECTED, tileSize: 2})
  ).getZxy(0, 0, 0);
  expect(await decodePNG(tile!.data)).toEqual(
    planar
      ? [10, 10, 10, 255, 20, 20, 20, 255, 30, 30, 30, 255, 40, 40, 40, 255]
      : [10, 60, 110, 255, 20, 70, 120, 255, 30, 80, 130, 255, 40, 90, 140, 255]
  );
});
