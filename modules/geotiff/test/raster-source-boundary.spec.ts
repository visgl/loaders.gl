// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {
  RasterBoundingBox,
  RasterChannelDataType,
  RasterViewport
} from '@loaders.gl/loader-utils';
import {expect, test, vi} from 'vitest';
import {sampleRaster} from '@loaders.gl/loader-utils';
import {GeoTIFFRasterSource, GeoTIFFSourceLoader} from '../src/geotiff-source-loader';
import {OMETiffImageSource, OMETiffSourceLoader} from '../src/ometiff-source-loader';

/** Creates the minimal viewport shape accepted by raster sources. */
function createViewport(bounds: RasterBoundingBox, crs = 'EPSG:4326', width = 10, height = 8) {
  return {bounds, crs, width, height} as RasterViewport;
}

/** Installs deterministic GeoTIFF initialization state without opening a file. */
function installGeoTIFFState(
  source: GeoTIFFRasterSource,
  metadata: Record<string, unknown>,
  readRasters: ReturnType<typeof vi.fn> = vi.fn()
): ReturnType<typeof vi.fn> {
  (source as any)._initPromise = Promise.resolve({
    tiff: {readRasters},
    images: [],
    metadata: {
      name: 'memory.tif',
      width: 10,
      height: 10,
      bandCount: 2,
      dtype: 'uint16',
      noData: null,
      crs: 'EPSG:4326',
      boundingBox: [
        [0, 0],
        [10, 10]
      ],
      metadata: {},
      ...metadata
    }
  });
  return readRasters;
}

test('GeoTIFF source loader recognizes GeoTIFF but not OME-TIFF URLs', () => {
  expect(GeoTIFFSourceLoader.testURL('image.tif?token=1')).toBe(true);
  expect(GeoTIFFSourceLoader.testURL('image.geotiff#page')).toBe(true);
  expect(GeoTIFFSourceLoader.testURL('image.ome.tif')).toBe(false);
  expect(OMETiffSourceLoader.testURL('image.ome.tiff?token=1')).toBe(true);
  expect(OMETiffSourceLoader.testURL('image.tiff')).toBe(false);
  expect(GeoTIFFSourceLoader.createDataSource(new Blob([]), {})).toBeInstanceOf(
    GeoTIFFRasterSource
  );
  expect(OMETiffSourceLoader.createDataSource(new Blob([]), {})).toBeInstanceOf(OMETiffImageSource);
});

test('GeoTIFF raster reads clip bounds and normalize planar and interleaved output', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {
    geotiff: {interleaved: false, resampleMethod: 'bilinear'}
  });
  const planar = [new Uint16Array([1, 2, 3, 4])] as any;
  planar.width = 2;
  planar.height = 2;
  const interleaved = new Uint16Array([1, 2, 3, 4]) as any;
  interleaved.width = 2;
  interleaved.height = 1;
  const readRasters = installGeoTIFFState(source, {noData: -1});
  readRasters.mockResolvedValueOnce(planar).mockResolvedValueOnce(interleaved);

  const clipped = await source.getRaster({
    viewport: createViewport(
      [
        [-5, -5],
        [5, 5]
      ],
      'EPSG:4326',
      20,
      10
    ),
    bands: [1]
  });
  expect(clipped).toMatchObject({
    width: 2,
    height: 2,
    bandCount: 1,
    interleaved: false,
    boundingBox: [
      [0, 0],
      [5, 5]
    ]
  });
  expect(clipped.data).toBe(planar[0]);
  expect(readRasters).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      bbox: [0, 0, 5, 5],
      width: 10,
      height: 5,
      samples: [1],
      interleave: false,
      resampleMethod: 'bilinear',
      fillValue: -1
    })
  );

  const packed = await source.getRaster({
    viewport: createViewport([
      [0, 0],
      [10, 10]
    ]),
    interleaved: true,
    resampleMethod: 'nearest'
  });
  expect(packed.data).toBe(interleaved);
  expect(packed.bandCount).toBe(2);
});

test.each([
  'uint8',
  'uint16',
  'uint32',
  'int8',
  'int16',
  'int32',
  'float32',
  'float64',
  'unknown'
] as RasterChannelDataType[])('GeoTIFF empty %s rasters retain viewport shape', async dtype => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {dtype, noData: 7});
  const raster = await source.getRaster({
    viewport: createViewport(
      [
        [20, 20],
        [30, 30]
      ],
      'EPSG:4326',
      3,
      2
    ),
    bands: [0, 1]
  });

  expect(raster).toMatchObject({width: 3, height: 2, bandCount: 2, interleaved: false});
  expect(Array.isArray(raster.data)).toBe(true);
  expect(Array.from((raster.data as any[])[0])).toEqual([7, 7, 7, 7, 7, 7]);
});

test('GeoTIFF raster validates cancellation, projection, bounds, and capabilities', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {});
  expect(source.getRasterQueryCapabilities()).toBe(source.rasterQueryCapabilities);

  const controller = new AbortController();
  controller.abort();
  await expect(
    source.getRaster({
      viewport: createViewport([
        [0, 0],
        [1, 1]
      ]),
      signal: controller.signal
    })
  ).rejects.toMatchObject({name: 'AbortError'});
  await expect(
    source.getRaster({
      viewport: createViewport(
        [
          [0, 0],
          [1, 1]
        ],
        'EPSG:3857'
      )
    })
  ).rejects.toThrow('does not support reprojection');

  const unbounded = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(unbounded, {boundingBox: undefined});
  await expect(
    unbounded.getRaster({
      viewport: createViewport([
        [0, 0],
        [1, 1]
      ])
    })
  ).rejects.toThrow('requires source bounds');
});

test.each([
  [1, 8, 'uint8'],
  [1, 16, 'uint16'],
  [1, 32, 'uint32'],
  [2, 8, 'int8'],
  [2, 16, 'int16'],
  [2, 32, 'int32'],
  [3, 32, 'float32'],
  [3, 64, 'float64']
] as const)('GeoTIFF metadata maps sample format %s/%s to %s', (sampleFormat, bits, dtype) => {
  const source = new GeoTIFFRasterSource('https://example.com/path/image.tif?token=1', {
    core: {attributions: ['imagery']}
  });
  const image = {
    getBoundingBox: () => [1, 2, 11, 12],
    getGeoKeys: () => ({ProjectedCSTypeGeoKey: 32633}),
    getGDALMetadata: () => ({AREA_OR_POINT: 'Area'}),
    getGDALNoData: () => -9999,
    getWidth: () => 10,
    getHeight: () => 10,
    getSamplesPerPixel: () => 2,
    getBitsPerSample: () => [bits],
    getSampleFormat: () => [sampleFormat],
    getTileWidth: () => 4,
    getTileHeight: () => 5,
    getResolution: () => [1, 2]
  };

  expect((source as any)._getMetadata(image, [image])).toMatchObject({
    name: 'image.tif',
    attributions: ['imagery'],
    crs: 'EPSG:32633',
    boundingBox: [
      [1, 2],
      [11, 12]
    ],
    dtype,
    tileSize: {width: 4, height: 5},
    overviews: [{resolution: [1, 2]}],
    noData: -9999
  });
});

test('GeoTIFF metadata tolerates absent geospatial metadata and rejects unsupported samples', () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const image = {
    getBoundingBox: () => {
      throw new Error('missing');
    },
    getGeoKeys: () => ({GeographicTypeGeoKey: 4326}),
    getGDALMetadata: () => undefined,
    getGDALNoData: () => undefined,
    getWidth: () => 1,
    getHeight: () => 1,
    getSamplesPerPixel: () => 1,
    getBitsPerSample: () => 8,
    getSampleFormat: () => 1,
    getTileWidth: () => 1,
    getTileHeight: () => 1,
    getResolution: () => {
      throw new Error('missing');
    }
  };
  expect((source as any)._getMetadata(image, [image])).toMatchObject({
    name: undefined,
    crs: 'EPSG:4326',
    boundingBox: undefined,
    noData: null,
    overviews: [{resolution: undefined}]
  });

  expect(() => (source as any)._getMetadata({...image, getSampleFormat: () => 4}, [image])).toThrow(
    'does not support sample format 4'
  );
  expect(() =>
    (source as any)._getMetadata({...image, getBitsPerSample: () => 24}, [image])
  ).toThrow('with 24 bits');
});

test('GeoTIFF initialization caches images and rejects empty datasets', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const image = {
    getBoundingBox: () => [0, 0, 1, 1],
    getWidth: () => 1,
    getHeight: () => 1,
    getSamplesPerPixel: () => 1,
    getBitsPerSample: () => 8,
    getSampleFormat: () => 1,
    getTileWidth: () => 1,
    getTileHeight: () => 1,
    getResolution: () => [1, 1]
  };
  const tiff = {
    getImageCount: vi.fn(async () => 1),
    getImage: vi.fn(async () => image)
  };
  (source as any)._openGeoTIFF = vi.fn(async () => tiff);
  const firstPromise = (source as any)._getInitPromise();
  expect((source as any)._getInitPromise()).toBe(firstPromise);
  await expect(firstPromise).resolves.toMatchObject({images: [image]});

  const empty = new GeoTIFFRasterSource(new Blob([]), {});
  (empty as any)._openGeoTIFF = vi.fn(async () => ({getImageCount: async () => 0}));
  await expect((empty as any)._initialize()).rejects.toThrow('could not load any images');
});

test('GeoTIFF query metadata covers optional spatial fields and post-load cancellation', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  source.getMetadata = async () => ({
    width: 1,
    height: 1,
    bandCount: 1,
    dtype: 'uint8',
    noData: null,
    crs: {authority: 'EPSG', code: 4326} as any,
    metadata: {}
  });
  await expect(source.getQueryMetadata()).resolves.toMatchObject({
    spatial: undefined,
    levels: undefined,
    columns: [{name: 'band_1', nullable: false}]
  });

  const controller = new AbortController();
  source.getMetadata = async () => {
    controller.abort();
    return {
      width: 1,
      height: 1,
      bandCount: 1,
      dtype: 'uint8',
      noData: null,
      metadata: {}
    };
  };
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow('aborted');
});

/** Installs deterministic OME-TIFF initialization state without opening a file. */
function installOMETiffState(
  source: OMETiffImageSource,
  dtype: RasterChannelDataType,
  bandCount = 3
) {
  const getRaster = vi.fn(async ({selection}: any) => ({
    width: 2,
    height: 1,
    data: createTypedValues(dtype, [selection.c + 1, selection.c + 11])
  }));
  (source as any)._initPromise = Promise.resolve({
    data: [{getRaster}],
    metadata: {
      name: 'image.ome.tif',
      width: 2,
      height: 1,
      bandCount,
      dtype,
      sizeT: 2,
      sizeZ: 2,
      sizeC: bandCount,
      labels: ['t', 'z', 'c', 'y', 'x'],
      levels: [{level: 0, width: 2, height: 1}],
      channels: Array.from({length: bandCount}, (_, index) => ({index})),
      metadata: {}
    }
  });
  return getRaster;
}

/** Allocates a small typed array for an OME test dtype. */
function createTypedValues(dtype: RasterChannelDataType, values: number[]) {
  const constructors: Record<string, any> = {
    uint8: Uint8Array,
    uint16: Uint16Array,
    uint32: Uint32Array,
    int8: Int8Array,
    int16: Int16Array,
    int32: Int32Array,
    float32: Float32Array,
    float64: Float64Array
  };
  return new (constructors[dtype] || Uint8Array)(values);
}

test.each([
  'uint8',
  'uint16',
  'uint32',
  'int8',
  'int16',
  'int32',
  'float32',
  'float64'
] as RasterChannelDataType[])('OME-TIFF interleaves %s channel data', async dtype => {
  const source = new OMETiffImageSource(new Blob([]), {});
  installOMETiffState(source, dtype);
  const raster = await source.getRaster({channels: [0, 2], interleaved: true, t: 1, z: 1});

  expect(raster).toMatchObject({width: 2, height: 1, bandCount: 2, dtype, interleaved: true});
  expect(Array.from(raster.data as any)).toEqual([1, 3, 11, 13]);
  expect(raster.metadata).toMatchObject({selection: {t: 1, z: 1}, channels: [0, 2]});
});

test('OME-TIFF applies channel defaults and validates selections and levels', async () => {
  const source = new OMETiffImageSource(new Blob([]), {
    ometiff: {defaultChannels: [1], interleaved: false}
  });
  const getRaster = installOMETiffState(source, 'uint16');
  const raster = await source.getRaster();
  expect(raster.data).toBeInstanceOf(Uint16Array);
  expect(getRaster).toHaveBeenCalledWith(expect.objectContaining({selection: {t: 0, z: 0, c: 1}}));

  const twoBandSource = new OMETiffImageSource(new Blob([]), {});
  installOMETiffState(twoBandSource, 'uint8', 2);
  await twoBandSource.getRaster();
  await expect(twoBandSource.getRaster({channels: [-1]})).rejects.toThrow('out of bounds');
  await expect(twoBandSource.getRaster({channels: [2]})).rejects.toThrow('out of bounds');
  await expect(twoBandSource.getRaster({level: 1})).rejects.toThrow('not available');

  const threeBandSource = new OMETiffImageSource(new Blob([]), {});
  const threeBandReads = installOMETiffState(threeBandSource, 'uint8', 3);
  await expect(threeBandSource.getRaster()).resolves.toMatchObject({bandCount: 3});
  expect(threeBandReads).toHaveBeenCalledTimes(3);

  const unsupported = new OMETiffImageSource(new Blob([]), {});
  installOMETiffState(unsupported, 'unknown' as RasterChannelDataType, 2);
  await expect(unsupported.getRaster({channels: [0, 1], interleaved: true})).rejects.toThrow(
    'Unsupported raster channel type'
  );
});

test('OME-TIFF query metadata covers fallback channel names, colors, and cancellation', async () => {
  const source = new OMETiffImageSource(new Blob([]), {});
  source.getMetadata = async () => ({
    width: 2,
    height: 1,
    bandCount: 1,
    dtype: 'uint8',
    sizeT: 1,
    sizeZ: 1,
    sizeC: 1,
    labels: ['y', 'x'],
    channels: [{index: 0, color: [1, 2, 3, 4]}],
    levels: [{level: 0, width: 2, height: 1}],
    metadata: {}
  });
  await expect(source.getQueryMetadata()).resolves.toMatchObject({
    capabilities: {levelOfDetail: 'unsupported'},
    columns: [{name: 'channel_1', metadata: {color: '1,2,3,4'}}]
  });

  const controller = new AbortController();
  source.getMetadata = async () => {
    controller.abort();
    return {
      width: 1,
      height: 1,
      bandCount: 1,
      dtype: 'uint8',
      sizeT: 1,
      sizeZ: 1,
      sizeC: 1,
      labels: [],
      channels: [],
      levels: [],
      metadata: {}
    };
  };
  await expect(source.getQueryMetadata({signal: controller.signal})).rejects.toThrow('aborted');
});

test('GeoTIFF region reads reject budgets before decoding and forward cancellation', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const readRasters = installGeoTIFFState(source, {});
  const parameters = {
    bounds: [
      [0, 0],
      [10, 10]
    ] as RasterBoundingBox,
    crs: 'EPSG:4326',
    width: 2,
    height: 2
  };
  await expect(source.getRasterForRegion({...parameters, maxDecodedBytes: 1})).rejects.toThrow(
    'budget'
  );
  await expect(source.getRasterForRegion({...parameters, width: 0})).rejects.toThrow('budget');
  await expect(
    source.getRasterForRegion({
      ...parameters,
      bounds: [
        [170, -10],
        [-170, 10]
      ]
    })
  ).rejects.toThrow('non-wrapped');
  expect(readRasters).not.toHaveBeenCalled();
  const controller = new AbortController();
  const result = [new Uint16Array(4), new Uint16Array(4)] as any;
  result.width = 2;
  result.height = 2;
  readRasters.mockResolvedValue(result);
  const raster = await source.getRasterForRegion({...parameters, signal: controller.signal});
  expect(readRasters).toHaveBeenCalledWith(
    expect.objectContaining({signal: expect.any(AbortSignal)})
  );
  expect(raster.bands?.map(band => band.index)).toEqual([0, 1]);
  readRasters.mockImplementation(() => {
    controller.abort();
    return result;
  });
  await expect(
    source.getRasterForRegion({...parameters, signal: controller.signal})
  ).rejects.toMatchObject({name: 'AbortError'});
});

test('GeoTIFF regions choose an existing overview from both resolution axes and retain grid placement', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {
    bandCount: 1,
    overviews: [
      {index: 0, width: 10, height: 10, resolution: [1, -1]},
      {index: 1, width: 2, height: 2, resolution: [5, -5]}
    ]
  });
  const state = await (source as any)._initPromise;
  const readOverview = vi.fn(async () =>
    Object.assign([new Uint16Array([0, 2, 4, 6])], {width: 2, height: 2})
  );
  state.images = [
    {
      fileDirectory: {},
      getWidth: () => 10,
      getHeight: () => 10,
      getOrigin: () => [0, 10],
      getResolution: () => [1, -1],
      readRasters: vi.fn()
    },
    {
      fileDirectory: {NewSubfileType: 1},
      getWidth: () => 2,
      getHeight: () => 2,
      getOrigin: () => [0, 10],
      getResolution: () => [5, -5],
      readRasters: readOverview
    }
  ];
  const raster = await source.getRasterForRegion({
    bounds: [
      [0, 0],
      [10, 10]
    ],
    crs: 'EPSG:4326',
    width: 2,
    height: 2
  });
  expect(readOverview).toHaveBeenCalledWith(expect.objectContaining({window: [0, 0, 2, 2]}));
  expect(raster).toMatchObject({
    overview: 1,
    transform: [5, 0, 0, 0, -5, 10],
    nativeResolution: [5, 5],
    overzoom: false
  });
  expect(state.images[0].readRasters).not.toHaveBeenCalled();
});

test('GeoTIFF mixed region results retain planar array types and reject interleaving', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const result = Object.assign([new Int16Array([-2]), new Float64Array([1e100])], {
    width: 1,
    height: 1
  });
  const readRasters = installGeoTIFFState(source, {
    dtype: 'int16',
    bands: [
      {index: 0, dtype: 'int16'},
      {index: 1, dtype: 'float64'}
    ]
  });
  readRasters.mockResolvedValue(result);
  const parameters = {
    bounds: [
      [0, 0],
      [10, 10]
    ] as RasterBoundingBox,
    crs: 'EPSG:4326',
    width: 1,
    height: 1
  };
  const raster = await source.getRasterForRegion(parameters);
  expect(raster.dtype).toBe('mixed');
  expect((raster.data as any[])[0]).toBeInstanceOf(Int16Array);
  expect((raster.data as any[])[1][0]).toBe(1e100);
  await expect(source.getRasterForRegion({...parameters, interleaved: true})).rejects.toThrow(
    'planar'
  );
  await expect(source.getRaster({viewport: createViewport(parameters.bounds)})).rejects.toThrow(
    'single-band'
  );
});

test('GeoTIFF shared initialization cancels only after the last subscriber and recovers', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const signals: AbortSignal[] = [];
  (source as any)._initialize = (signal: AbortSignal) => {
    signals.push(signal);
    return new Promise((_resolve, reject) =>
      signal.addEventListener('abort', () => reject(signal.reason), {once: true})
    );
  };
  const first = new AbortController();
  const second = new AbortController();
  const firstMetadata = source.getMetadata({signal: first.signal});
  const secondMetadata = source.getMetadata({signal: second.signal});
  first.abort(new DOMException('first consumer canceled', 'AbortError'));
  await expect(firstMetadata).rejects.toMatchObject({name: 'AbortError'});
  expect(signals[0].aborted).toBe(false);
  second.abort(new DOMException('second consumer canceled', 'AbortError'));
  await expect(secondMetadata).rejects.toMatchObject({name: 'AbortError'});
  expect(signals[0].aborted).toBe(true);
  const recovery = source.getMetadata();
  expect(signals).toHaveLength(2);
  source.finalize();
  await expect(recovery).rejects.toMatchObject({name: 'AbortError'});
});

test('GeoTIFF resampling preserves invalid neighbors and point sample registration', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {
    bandCount: 1,
    dtype: 'float32',
    noData: -1,
    pixelRegistration: 'point'
  });
  const state = await (source as any)._initPromise;
  const readRasters = vi.fn(async () =>
    Object.assign([new Float32Array([-1, 10, 20, 30])], {width: 2, height: 2})
  );
  state.images = [
    {
      fileDirectory: {},
      getWidth: () => 2,
      getHeight: () => 2,
      getOrigin: () => [0, 10],
      getResolution: () => [5, -5],
      readRasters
    }
  ];
  const parameters = {
    bounds: [
      [0, 0],
      [10, 10]
    ] as RasterBoundingBox,
    crs: 'EPSG:4326',
    width: 1,
    height: 1
  };
  const bilinear = await source.getRasterForRegion({...parameters, resampleMethod: 'bilinear'});
  expect(sampleRaster(bilinear, [0, 0]).valid).toEqual([false]);
  expect(bilinear.pixelRegistration).toBe('area');
  expect(bilinear.transform).toEqual([10, 0, -2.5, 0, -10, 12.5]);
  const nearest = await source.getRasterForRegion(parameters);
  expect(sampleRaster(nearest, [0, 0]).values).toEqual([30]);
  expect(nearest.validityMasks?.[0]).toMatchObject({
    band: 0,
    width: 1,
    height: 1,
    pixelStride: 1,
    rowStride: 1
  });
  await expect(source.getRasterForRegion({...parameters, maxDecodedBytes: 10})).rejects.toThrow(
    'Native decode'
  );
  expect(readRasters).toHaveBeenCalledTimes(2);
});

test('GeoTIFF internal mask stays aligned and excludes masked overviews', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {bandCount: 1, dtype: 'float32', noData: null});
  const state = await (source as any)._initPromise;
  const image = {
    fileDirectory: {},
    getWidth: () => 2,
    getHeight: () => 1,
    getOrigin: () => [0, 10],
    getResolution: () => [5, -10],
    readRasters: vi.fn(async () => Object.assign([new Float32Array([8, 9])], {width: 2, height: 1}))
  };
  const mask = {
    ...image,
    fileDirectory: {NewSubfileType: 5},
    readRasters: vi.fn(async () => Object.assign(new Uint8Array([1, 0]), {width: 2, height: 1}))
  };
  state.images = [image, mask];
  const parameters = {
    bounds: [
      [0, 0],
      [10, 10]
    ] as RasterBoundingBox,
    crs: 'EPSG:4326',
    width: 2,
    height: 1
  };
  const raster = await source.getRasterForRegion(parameters);
  expect(raster.overview).toBe(0);
  expect(raster.data).toEqual(new Float32Array([8, 9]));
  expect(sampleRaster(raster, [0, 0]).valid).toEqual([true]);
  expect(sampleRaster(raster, [1, 0]).valid).toEqual([false]);
  const resized = await source.getRasterForRegion({
    ...parameters,
    width: 1,
    resampleMethod: 'bilinear'
  });
  expect(sampleRaster(resized, [0, 0]).valid).toEqual([false]);
});

test('GeoTIFF metadata preserves declared band statistics and rejects malformed dimensions', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  const image = {
    fileDirectory: {},
    getWidth: () => 2,
    getHeight: () => 1,
    getSamplesPerPixel: () => 1,
    getBitsPerSample: () => [32],
    getSampleFormat: () => [3],
    getTileWidth: () => 2,
    getTileHeight: () => 1,
    getGDALMetadata: (band?: number) =>
      band === 0
        ? {SCALE: '2', OFFSET: '1', STATISTICS_MINIMUM: '-4', STATISTICS_MAXIMUM: '5'}
        : {},
    getGeoKeys: () => ({
      ProjectedCSTypeGeoKey: 32767,
      GeographicTypeGeoKey: 4326,
      GTModelTypeGeoKey: 1
    })
  };
  const metadata = (source as any)._getMetadata(image, [image]);
  expect(metadata.crs).toBeUndefined();
  expect(metadata.transform).toBeUndefined();
  expect(metadata.bands[0]).toMatchObject({scale: 2, offset: 1});
  expect(() =>
    (source as any)._getMetadata({...image, getGDALMetadata: () => ({SCALE: ' '})}, [image])
  ).toThrow('scale');
  expect(
    (source as any)._getMetadata(
      {
        ...image,
        getGDALMetadata: () => ({
          SCALE: '0',
          OFFSET: '0',
          STATISTICS_MINIMUM: '',
          STATISTICS_MAXIMUM: '5'
        })
      },
      [image]
    ).bands[0]
  ).toMatchObject({scale: 0, offset: 0, declaredStatistics: {min: undefined, max: 5}});
  expect(
    (source as any)._getMetadata({...image, fileDirectory: {PhotometricInterpretation: 3}}, [image])
      .bands[0].categorical
  ).toBe(true);
  expect(metadata.bands[0].declaredStatistics).toEqual({
    band: 0,
    domain: 'unknown',
    scope: 'source',
    method: 'declared',
    min: -4,
    max: 5
  });
  expect(
    (source as any)._getMetadata(
      {
        ...image,
        getGDALMetadata: () => ({STATISTICS_MINIMUM: 'Infinity', STATISTICS_MAXIMUM: 'NaN'})
      },
      [image]
    ).bands[0].declaredStatistics
  ).toBeUndefined();
  expect(metadata.metadata.bandMetadata[0]).toMatchObject({STATISTICS_MINIMUM: '-4'});
  expect(() => (source as any)._getMetadata({...image, getWidth: () => Infinity}, [image])).toThrow(
    'dimensions'
  );
  const remote = new GeoTIFFRasterSource('https://example.com/asset', {
    geotiff: {rangeCacheProps: {maxBytes: -1}}
  });
  await expect(remote.getMetadata()).rejects.toThrow('cache');
  remote.finalize();
});

test('GeoTIFF budgets include every decoded tile and unselected channels', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {bandCount: 2, dtype: 'float32'});
  const state = await (source as any)._initPromise;
  const readRasters = vi.fn();
  state.images = [
    {
      fileDirectory: {},
      getWidth: () => 2,
      getHeight: () => 1,
      getOrigin: () => [0, 10],
      getResolution: () => [5, -10],
      getTileWidth: () => 1,
      getTileHeight: () => 1,
      readRasters
    }
  ];
  await expect(
    source.getRasterForRegion({
      bounds: [
        [0, 0],
        [10, 10]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1,
      bands: [0],
      maxDecodedBytes: 35
    })
  ).rejects.toThrow('Native decode');
  expect(readRasters).not.toHaveBeenCalled();
  state.images[0].fileDirectory.PlanarConfiguration = 2;
  readRasters.mockResolvedValue(Object.assign([new Float32Array([3, 4])], {width: 2, height: 1}));
  const raster = await source.getRasterForRegion({
    bounds: [
      [0, 0],
      [10, 10]
    ],
    crs: 'EPSG:4326',
    width: 2,
    height: 1,
    bands: [0],
    maxDecodedBytes: 35
  });
  expect(raster.data).toEqual(new Float32Array([3, 4]));
  const packed = await source.getRasterForRegion({
    bounds: [
      [0, 0],
      [10, 10]
    ],
    crs: 'EPSG:4326',
    width: 2,
    height: 1,
    bands: [0],
    interleaved: true,
    maxDecodedBytes: 35
  });
  expect(packed.data).toBeInstanceOf(Float32Array);
  expect(Array.from(packed.data as Float32Array)).toEqual([3, 4]);
  expect(packed.dtype).toBe('float32');
  expect(readRasters).toHaveBeenLastCalledWith(
    expect.objectContaining({interleave: false, samples: [0]})
  );
  readRasters.mockResolvedValueOnce(
    Object.assign([new Float32Array([NaN, 0])], {width: 2, height: 1})
  );
  const invalid = await source.getRasterForRegion({
    bounds: [
      [0, 0],
      [10, 10]
    ],
    crs: 'EPSG:4326',
    width: 2,
    height: 1,
    bands: [0],
    interleaved: true
  });
  expect(Array.from(invalid.data as Float32Array)).toEqual([NaN, 0]);
  expect(sampleRaster(invalid, [0, 0]).valid).toEqual([false]);
  expect(sampleRaster(invalid, [1, 0]).values).toEqual([0]);
  readRasters.mockResolvedValueOnce(
    Object.assign([new Float64Array([3, 4])], {width: 2, height: 1})
  );
  await expect(
    source.getRasterForRegion({
      bounds: [
        [0, 0],
        [10, 10]
      ],
      crs: 'EPSG:4326',
      width: 2,
      height: 1,
      bands: [0]
    })
  ).rejects.toThrow('representation');
});

test('rotated GeoTIFF pixel vectors control overview selection and native resolution', async () => {
  const source = new GeoTIFFRasterSource(new Blob([]), {});
  installGeoTIFFState(source, {bandCount: 1, dtype: 'float32'});
  const state = await (source as any)._initPromise;
  /** Creates a rotated image with independently observable native decode calls. */
  const createImage = (size: number, scale: number) => ({
    fileDirectory: {
      NewSubfileType: scale === 1 ? 0 : 1,
      ModelTransformation: [0, -scale, 0, 10, scale, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    },
    getWidth: () => size,
    getHeight: () => size,
    getSamplesPerPixel: () => 1,
    getBitsPerSample: () => 32,
    getSampleFormat: () => 3,
    getTileWidth: () => size,
    getTileHeight: () => size,
    getGeoKeys: () => ({GeographicTypeGeoKey: 4326, GTRasterTypeGeoKey: 1}),
    getBoundingBox: () => [0, 0, 10, 10],
    getResolution: () => [0, 0],
    readRasters: vi.fn(async () =>
      Object.assign([new Float32Array(size * size).fill(scale)], {width: size, height: size})
    )
  });
  state.images = [createImage(10, 1), createImage(2, 5)];
  state.metadata = (source as any)._getMetadata(state.images[0], state.images);
  const parameters = {bounds: state.metadata.boundingBox, crs: state.metadata.crs};
  const detailed = await source.getRasterForRegion({...parameters, width: 10, height: 10});
  expect(detailed.overview).toBe(0);
  expect(detailed.nativeResolution).toEqual([1, 1]);
  expect(detailed.transform).toEqual([0, -1, 10, 1, 0, 0]);
  const coarse = await source.getRasterForRegion({...parameters, width: 2, height: 2});
  expect(coarse.overview).toBe(1);
  expect(coarse.nativeResolution).toEqual([5, 5]);
  expect(sampleRaster(coarse, [1, 1]).values).toEqual([5]);
  expect(state.images[0].readRasters).toHaveBeenCalledTimes(1);
  expect(state.images[1].readRasters).toHaveBeenCalledTimes(1);
  source.finalize();
});
