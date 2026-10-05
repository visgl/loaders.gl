// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import type {GeoTIFF as GeoTIFFDataset, GeoTIFFImage} from 'geotiff';
import {fromBlob, GeoTIFF} from 'geotiff';

import type {
  SourceLoader,
  DataSourceOptions,
  TypedArray,
  RasterRegionSource,
  RasterRegionParameters,
  RasterSourceMetadata,
  GetRasterParameters,
  RasterData,
  NumericRasterData,
  RasterMixedData,
  RasterChannelDataType,
  RasterBoundingBox,
  RasterAffineTransform,
  RasterBandMetadata,
  RangeRequestSchedulerProps,
  RangeRequestTransportResult,
  RasterQueryCapabilities,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanQueryMetadataProvider
} from '@loaders.gl/loader-utils';
import type {CRSIdentifier} from '@math.gl/crs';
import {
  DataSource,
  getRasterViewportBoundingBox,
  RangeRequestScheduler,
  RangeRequestCache,
  waitForPromiseWithSignal,
  waitForPromiseWithSignals,
  sampleRaster,
  validateRasterRegion,
  createScanQueryMetadata
} from '@loaders.gl/loader-utils';
import {GeoTIFFFormat} from './geotiff-format';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/**
 * Options for creating a GeoTIFF raster source.
 */
export type GeoTIFFSourceLoaderOptions = DataSourceOptions & {
  geotiff?: {
    /** Optional request headers forwarded to remote GeoTIFF fetches. */
    headers?: Record<string, string>;
    /** Settled byte-cache limits; defaults to 128 entries and 8 MiB. Zero disables retention. */
    rangeCacheProps?: {
      /** Maximum retained byte ranges. */
      maxEntries?: number;
      /** Maximum retained encoded bytes. */
      maxBytes?: number;
    };
    /** Default interleave mode for raster reads. */
    interleaved?: boolean;
    /** Default resampling mode for viewport reads. */
    resampleMethod?: 'nearest' | 'bilinear';
    /** Maximum decoded output pixels, default 16 million. */
    maxPixels?: number;
    /** Maximum decoded output bytes, default 256 MiB. */
    maxDecodedBytes?: number;
    /** Optional shared scheduler used for byte-range requests against remote GeoTIFFs. */
    rangeScheduler?: RangeRequestScheduler;
    /** Optional scheduler configuration used when creating a per-source byte-range scheduler. */
    rangeSchedulerProps?: RangeRequestSchedulerProps;
  };
};

/** Common raster-query capabilities of GeoTIFF and COG sources. */
export const GEOTIFF_RASTER_QUERY_CAPABILITIES: RasterQueryCapabilities = Object.freeze({
  bounds: 'pushdown',
  level: 'pushdown',
  variables: 'pushdown',
  slices: 'unsupported',
  streaming: false,
  cancellation: true
});

/**
 * Source factory for viewport-driven GeoTIFF datasets.
 */
export const GeoTIFFSourceLoader = {
  dataType: null as unknown as GeoTIFFRasterSource,
  batchType: null as never,
  ...GeoTIFFFormat,
  name: 'GeoTIFFSourceLoader',
  version: VERSION,
  type: 'geotiff',
  fromUrl: true,
  fromBlob: true,

  options: {
    geotiff: {
      headers: undefined!,
      interleaved: false,
      resampleMethod: 'nearest'
    }
  },

  defaultOptions: {
    geotiff: {
      headers: undefined!,
      interleaved: false,
      resampleMethod: 'nearest'
    }
  },

  testURL: (url: string): boolean => {
    if (/\.ome\.tiff?(?:$|[?#])/i.test(url)) {
      return false;
    }
    return /\.(?:geotiff?|tiff?)(?:$|[?#])/i.test(url);
  },
  createDataSource: (
    data: string | Blob,
    options: GeoTIFFSourceLoaderOptions
  ): GeoTIFFRasterSource => new GeoTIFFRasterSource(data, options)
} as const satisfies SourceLoader<GeoTIFFRasterSource>;

type GeoTIFFInit = {
  tiff: GeoTIFFDataset;
  images: GeoTIFFImage[];
  metadata: RasterSourceMetadata;
};

type GeoTIFFReadRasterResult = {width: number; height: number} & (
  | RasterData['data']
  | TypedArray[]
);

/**
 * Viewport-driven raster source backed by a GeoTIFF dataset.
 */
export class GeoTIFFRasterSource
  extends DataSource<string | Blob, GeoTIFFSourceLoaderOptions>
  implements RasterRegionSource, ScanQueryMetadataProvider
{
  /** Capabilities advertised by this viewport-driven raster source. */
  readonly rasterQueryCapabilities = GEOTIFF_RASTER_QUERY_CAPABILITIES;
  /** Explicit numeric region support without a viewport dependency. */
  readonly supportsRegion = true;
  private _initPromise: Promise<GeoTIFFInit> | null = null;
  /** Shared metadata transport controller, with leases for concurrent callers. */
  private _initialization: {
    /** Transport shared by active initialization subscribers. */
    controller: AbortController;
    /** Number of active initialization subscribers. */
    subscribers: number;
    /** Whether directory discovery has completed or failed. */
    settled: boolean;
  } | null = null;
  private _rangeScheduler: RangeRequestScheduler | null = null;
  /** Bounded source-owned encoded byte cache with subscriber-aware cancellation. */
  private _rangeCache: RangeRequestCache | null = null;
  /** Cancellation shared by work owned by this source, including borrowed scheduler subscriptions. */
  private readonly _finalizationController = new AbortController();

  /** Creates a viewport-driven raster source backed by a GeoTIFF URL or Blob. */
  constructor(data: string | Blob, options: GeoTIFFSourceLoaderOptions) {
    super(data, options, GeoTIFFSourceLoader.defaultOptions);

    if (options.geotiff?.rangeSchedulerProps) {
      this.options.geotiff ||= {};
      this.options.geotiff.rangeSchedulerProps = options.geotiff.rangeSchedulerProps;
    }

    if (options.geotiff?.rangeScheduler) {
      this.options.geotiff ||= {};
      this.options.geotiff.rangeScheduler = options.geotiff.rangeScheduler;
    }
  }

  /**
   * Returns normalized GeoTIFF metadata without loading raster samples.
   */
  async getMetadata(
    options: {/** Caller cancellation for metadata discovery. */ signal?: AbortSignal} = {}
  ): Promise<RasterSourceMetadata> {
    return waitForPromiseWithSignals(
      async signal => {
        const {metadata} = await this._getInitPromise(signal);
        signal.throwIfAborted();
        return metadata;
      },
      [options.signal, this._finalizationController.signal]
    );
  }

  /** Cancels transport owned by this source while preserving an injected shared scheduler. */
  finalize(): void {
    this._finalizationController.abort();
    this._initialization?.controller.abort();
    this._rangeScheduler?.finalize();
    this._rangeCache?.clear();
    this._rangeCache = null;
    const initializationPromise = this._initPromise;
    this._initPromise = null;
    this._initialization = null;
    void initializationPromise?.then(({tiff}) => tiff.close()).catch(() => {});
  }

  /** Returns raster-query capabilities without opening raster samples. */
  getRasterQueryCapabilities(): RasterQueryCapabilities {
    return this.rasterQueryCapabilities;
  }

  /** Discovers raster bands, bounds, and overview levels for the shared scan query panel. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    options.signal?.throwIfAborted();
    const metadata = await this.getMetadata(options);
    options.signal?.throwIfAborted();
    const fields = Array.from({length: metadata.bandCount}, (_, index) => ({
      name: `band_${index + 1}`,
      type: metadata.bands?.[index]?.dtype ?? metadata.dtype,
      nullable: metadata.noData !== null,
      metadata: {}
    }));
    return createScanQueryMetadata({
      sourceType: 'geotiff',
      queryType: 'raster',
      execution: {status: 'supported', method: 'getRaster'},
      name: metadata.name,
      schema: {fields, metadata: {}},
      capabilities: {
        bounds: this.rasterQueryCapabilities.bounds,
        levelOfDetail: this.rasterQueryCapabilities.level
      },
      spatial: metadata.boundingBox
        ? {
            bounds: {minimum: metadata.boundingBox[0], maximum: metadata.boundingBox[1]},
            coordinateReferenceSystems:
              typeof metadata.crs === 'string' ? [metadata.crs] : undefined
          }
        : undefined,
      levels: metadata.overviews?.map(overview => ({
        index: overview.index,
        width: overview.width,
        height: overview.height,
        scale: [metadata.width / overview.width, metadata.height / overview.height] as [
          number,
          number
        ]
      }))
    });
  }

  /**
   * Loads typed raster samples for the requested viewport.
   *
   * v1 requires the request CRS to match the source CRS and returns native-projection samples.
   */
  async getRaster(parameters: GetRasterParameters): Promise<RasterData> {
    parameters.signal?.throwIfAborted();
    const metadata = await this.getMetadata({signal: parameters.signal});
    const raster = await this._readRegion(
      {
        ...parameters,
        bounds: getRasterViewportBoundingBox(parameters.viewport),
        crs: parameters.viewport.crs ?? metadata.crs!,
        width: parameters.viewport.width,
        height: parameters.viewport.height
      },
      false
    );
    if (raster.dtype === 'mixed')
      throw new Error(
        'Mixed-type GeoTIFF viewport reads require separate single-band requests; use getRasterForRegion for a mixed planar result'
      );
    return raster;
  }

  /** Reads an explicit region in the source CRS through the shared window pipeline. */
  async getRasterForRegion(parameters: RasterRegionParameters): Promise<NumericRasterData> {
    return this._readRegion(parameters, true);
  }

  /** Validates and decodes one source-coordinate window for both public entry points. */
  private _readRegion(
    parameters: RasterRegionParameters,
    requireCrs: boolean
  ): Promise<NumericRasterData> {
    return waitForPromiseWithSignals(
      signal => this._decodeRegion({...parameters, signal}, requireCrs),
      [parameters.signal, this._finalizationController.signal]
    );
  }

  /** Runs the native decode pipeline; callers observe cancellation even for noninterruptible codecs. */
  private async _decodeRegion(
    parameters: RasterRegionParameters,
    requireCrs: boolean
  ): Promise<NumericRasterData> {
    parameters.signal?.throwIfAborted();
    const {tiff, images, metadata} = await this._getInitPromise(parameters.signal);
    parameters.signal?.throwIfAborted();
    const viewportBoundingBox = parameters.bounds;
    if (
      (requireCrs && (!metadata.crs || !parameters.crs)) ||
      (parameters.crs && metadata.crs !== parameters.crs)
    )
      throw new Error(
        'GeoTIFFRasterSource does not support reprojection; source and request CRS must match'
      );
    if (!metadata.boundingBox) throw new Error('GeoTIFFRasterSource requires source bounds');
    const bandCount = parameters.bands?.length ?? metadata.bandCount;
    if (
      !bandCount ||
      parameters.bands?.some(
        band => !Number.isInteger(band) || band < 0 || band >= metadata.bandCount
      )
    )
      throw new Error('Invalid raster bands');
    const selectedBands = parameters.bands ?? Array.from({length: bandCount}, (_, index) => index);
    const outputDtype = metadata.bands?.[selectedBands[0]]?.dtype ?? metadata.dtype;
    const mixed = selectedBands.some(
      index => metadata.bands?.[index] && metadata.bands[index].dtype !== outputDtype
    );
    const interleaved = parameters.interleaved ?? this.options.geotiff?.interleaved ?? false;
    if (mixed && !requireCrs)
      throw new Error('Mixed-type GeoTIFF viewport reads require separate single-band requests');
    if (mixed && interleaved) throw new Error('Mixed-type GeoTIFF regions require planar arrays');
    const bytesPerPixel = selectedBands.reduce(
      (bytes, index) =>
        bytes +
        Number((metadata.bands?.[index]?.dtype ?? metadata.dtype).match(/\d+/)?.[0] ?? 64) / 8,
      0
    );
    const maxPixels = parameters.maxPixels ?? this.options.geotiff?.maxPixels ?? 16_000_000;
    const maxDecodedBytes =
      parameters.maxDecodedBytes ?? this.options.geotiff?.maxDecodedBytes ?? 256 * 1024 * 1024;
    const pixels = validateRasterRegion(
      viewportBoundingBox,
      parameters.width,
      parameters.height,
      bytesPerPixel,
      maxPixels,
      maxDecodedBytes
    );
    const clippedBoundingBox = intersectBoundingBoxes(viewportBoundingBox, metadata.boundingBox);
    if (!clippedBoundingBox) {
      if (pixels * (bytesPerPixel + 1) > maxDecodedBytes)
        throw new Error('Empty raster mask exceeds decoded-byte budget');
      if (mixed) {
        return {
          data: selectedBands.map(index =>
            createFilledTypedArray(
              metadata.bands![index].dtype,
              pixels,
              metadata.bands![index].noData ?? 0
            )
          ),
          dtype: 'mixed',
          interleaved: false,
          bands: selectedBands.map(index => metadata.bands![index]),
          width: parameters.width,
          height: parameters.height,
          bandCount,
          crs: metadata.crs,
          boundingBox: parameters.bounds,
          transform: createRegionTransform(parameters.bounds, parameters.width, parameters.height),
          pixelRegistration: 'area',
          provenance: {sourceType: 'geotiff'},
          ownership: 'owned',
          validityMasks: [
            {data: new Uint8Array(pixels), width: parameters.width, height: parameters.height}
          ]
        };
      }
      const empty = createEmptyRaster(parameters, {...metadata, dtype: outputDtype});
      empty.validityMasks = [
        {data: new Uint8Array(pixels), width: parameters.width, height: parameters.height}
      ];
      return empty;
    }

    const targetSize = getClippedTargetSize(viewportBoundingBox, clippedBoundingBox, parameters);
    const fillValue = metadata.noData ?? undefined;
    const requestedResolution: [number, number] = [
      (clippedBoundingBox[1][0] - clippedBoundingBox[0][0]) / targetSize.width,
      (clippedBoundingBox[1][1] - clippedBoundingBox[0][1]) / targetSize.height
    ];
    let overview = 0;
    let transform: RasterAffineTransform | undefined;
    let actualBoundingBox = clippedBoundingBox;
    let raster: GeoTIFFReadRasterResult;
    let validityMasks: RasterData['validityMasks'];
    const readOptions = {
      width: targetSize.width,
      height: targetSize.height,
      samples: parameters.bands,
      interleave: interleaved,
      resampleMethod: parameters.resampleMethod ?? this.options.geotiff?.resampleMethod,
      fillValue,
      signal: parameters.signal
    };
    if (images.length) {
      for (let index = 1; index < images.length; index++) {
        const image = images[index];
        const directory = image.fileDirectory;
        if (directory.NewSubfileType & 4) continue;
        if (!(directory.NewSubfileType & 1) && directory.SubfileType !== 2) continue;
        if (
          images.some(candidate => candidate.fileDirectory?.NewSubfileType & 4) &&
          !images.some(
            candidate =>
              candidate.fileDirectory?.NewSubfileType & 4 &&
              candidate.getWidth() === image.getWidth() &&
              candidate.getHeight() === image.getHeight()
          )
        )
          continue;
        const registration = image.getGeoKeys?.()?.GTRasterTypeGeoKey;
        if (
          (registration === 2 ? 'point' : 'area') !== (metadata.pixelRegistration ?? 'area') &&
          registration !== undefined
        )
          continue;
        if (
          typeof image.getSamplesPerPixel === 'function' &&
          selectedBands.some(band => band >= image.getSamplesPerPixel())
        )
          continue;
        if (
          typeof image.getBitsPerSample === 'function' &&
          typeof image.getSampleFormat === 'function'
        ) {
          try {
            if (
              selectedBands.some(
                band =>
                  getImageDataType(image, band) !==
                  (metadata.bands?.[band]?.dtype ?? metadata.dtype)
              )
            )
              continue;
          } catch {
            continue;
          }
        }
        const resolution = getImageResolution(image, images[0]);
        if (
          resolution &&
          Math.abs(resolution[0]) <= requestedResolution[0] &&
          Math.abs(resolution[1]) <= requestedResolution[1] &&
          image.getWidth() < images[overview].getWidth()
        )
          overview = index;
      }
      const image = images[overview];
      const affine = getImageTransform(image, images[0]);
      if (!affine) throw new Error('GeoTIFF source has no usable affine transform');
      const [columnScale, rowShear, originX, columnShear, rowScale, originY] = affine;
      const determinant = columnScale * rowScale - rowShear * columnShear;
      if (!affine.every(Number.isFinite) || !Number.isFinite(determinant) || determinant === 0)
        throw new Error('Singular GeoTIFF affine transform');
      const corners = [
        clippedBoundingBox[0],
        clippedBoundingBox[1],
        [clippedBoundingBox[0][0], clippedBoundingBox[1][1]],
        [clippedBoundingBox[1][0], clippedBoundingBox[0][1]]
      ];
      const grid = corners.map(([coordinateX, coordinateY]) => [
        (rowScale * (coordinateX - originX) - rowShear * (coordinateY - originY)) / determinant,
        (columnScale * (coordinateY - originY) - columnShear * (coordinateX - originX)) /
          determinant
      ]);
      const window = [
        Math.max(0, Math.floor(Math.min(...grid.map(point => point[0])))),
        Math.max(0, Math.floor(Math.min(...grid.map(point => point[1])))),
        Math.min(image.getWidth(), Math.ceil(Math.max(...grid.map(point => point[0])))),
        Math.min(image.getHeight(), Math.ceil(Math.max(...grid.map(point => point[1]))))
      ];
      const maskImages = images.filter(
        candidate =>
          candidate.fileDirectory?.NewSubfileType & 4 &&
          candidate.getWidth() === image.getWidth() &&
          candidate.getHeight() === image.getHeight()
      );
      if (maskImages.length > 1) throw new Error('Ambiguous GeoTIFF validity mask');
      const nativePixelCount = (window[2] - window[0]) * (window[3] - window[1]);
      const nativeBytes = nativePixelCount * bytesPerPixel;
      const maskBytes = maskImages.length
        ? nativePixelCount * 3 + estimateImageTileBytes(maskImages[0], window, 2)
        : 0;
      const sourceBytesPerPixel =
        image.fileDirectory?.PlanarConfiguration === 2
          ? bytesPerPixel
          : metadata.bands
            ? metadata.bands.reduce(
                (bytes, band) => bytes + Number(band.dtype.match(/\d+/)?.[0] ?? 64) / 8,
                0
              )
            : (metadata.bandCount * Number(metadata.dtype.match(/\d+/)?.[0] ?? 64)) / 8;
      const tileBytes = estimateImageTileBytes(image, window, sourceBytesPerPixel);
      if (
        nativeBytes * 2 + maskBytes + pixels * (bytesPerPixel + bandCount) + tileBytes >
        maxDecodedBytes
      )
        throw new Error('Native decode window exceeds decoded-byte budget');
      if (window[2] <= window[0] || window[3] <= window[1])
        throw new Error('Region does not intersect the source grid');
      const scaleX = (window[2] - window[0]) / targetSize.width;
      const scaleY = (window[3] - window[1]) / targetSize.height;
      const pointShift = metadata.pixelRegistration === 'point' ? 0.5 : 0;
      transform = [
        columnScale * scaleX,
        rowShear * scaleY,
        columnScale * (window[0] - pointShift) + rowShear * (window[1] - pointShift) + originX,
        columnShear * scaleX,
        rowScale * scaleY,
        columnShear * (window[0] - pointShift) + rowScale * (window[1] - pointShift) + originY
      ];
      const sourceCorners = [
        [window[0], window[1]],
        [window[2], window[1]],
        [window[0], window[3]],
        [window[2], window[3]]
      ].map(([column, row]) => [
        columnScale * (column - pointShift) + rowShear * (row - pointShift) + originX,
        columnShear * (column - pointShift) + rowScale * (row - pointShift) + originY
      ]);
      actualBoundingBox = [
        [
          Math.min(...sourceCorners.map(point => point[0])),
          Math.min(...sourceCorners.map(point => point[1]))
        ],
        [
          Math.max(...sourceCorners.map(point => point[0])),
          Math.max(...sourceCorners.map(point => point[1]))
        ]
      ];
      const nativeRaster = (await image.readRasters({
        ...readOptions,
        // geotiff.js interleaving chooses a type from every source band, including unselected bands.
        interleave: false,
        width: window[2] - window[0],
        height: window[3] - window[1],
        window,
        resampleMethod: 'nearest'
      })) as unknown as GeoTIFFReadRasterResult;
      if (
        nativeRaster.width !== window[2] - window[0] ||
        nativeRaster.height !== window[3] - window[1]
      )
        throw new Error('Invalid native raster dimensions');
      const nativeArrays = Array.isArray(nativeRaster) ? nativeRaster : [nativeRaster];
      if (
        nativeArrays.reduce((length, array) => length + array.length, 0) !==
          nativeRaster.width * nativeRaster.height * bandCount ||
        nativeArrays.reduce((length, array) => length + array.byteLength, 0) > maxDecodedBytes
      )
        throw new Error('Invalid or oversized native raster');
      if (
        nativeArrays.length !== bandCount ||
        nativeArrays.some(
          (array, index) =>
            array.constructor !==
            createFilledTypedArray(
              metadata.bands?.[selectedBands[index]]?.dtype ?? metadata.dtype,
              0,
              0
            ).constructor
        )
      )
        throw new Error('Native raster representation does not match selected band metadata');
      let nativeValidityMasks: RasterData['validityMasks'];
      if (maskImages.length) {
        parameters.signal?.throwIfAborted();
        const maskRaster = (await maskImages[0].readRasters({
          window,
          samples: [0],
          interleave: true,
          signal: parameters.signal
        })) as unknown as TypedArray;
        if (maskRaster.length !== nativePixelCount || maskRaster.byteLength > nativePixelCount * 2)
          throw new Error('Invalid GeoTIFF validity mask');
        nativeValidityMasks = [
          {
            data: Uint8Array.from(maskRaster, value =>
              Number.isFinite(value) && value !== 0 ? 1 : 0
            ),
            width: nativeRaster.width,
            height: nativeRaster.height,
            pixelStride: 1,
            rowStride: nativeRaster.width
          }
        ];
      }
      const resized = await resizeRasterWindow(
        nativeRaster,
        selectedBands.map(index =>
          metadata.bands?.[index]
            ? {...metadata.bands[index]}
            : {index, dtype: outputDtype, noData: metadata.noData}
        ),
        interleaved,
        targetSize,
        readOptions.resampleMethod ?? 'nearest',
        parameters.signal,
        nativeValidityMasks
      );
      raster = resized.raster;
      validityMasks = resized.validityMasks;
    } else {
      raster = (await tiff.readRasters({
        ...readOptions,
        bbox: flattenBoundingBox(clippedBoundingBox)
      })) as unknown as GeoTIFFReadRasterResult;
    }

    const data = normalizeRasterReadResult(raster, interleaved);
    parameters.signal?.throwIfAborted();
    const arrays = Array.isArray(data) ? data : [data];
    const expectedLength = raster.width * raster.height * bandCount;
    if (
      !Number.isSafeInteger(raster.width) ||
      !Number.isSafeInteger(raster.height) ||
      raster.width <= 0 ||
      raster.height <= 0 ||
      raster.width * raster.height >
        (parameters.maxPixels ?? this.options.geotiff?.maxPixels ?? 16_000_000)
    )
      throw new Error('Invalid decoded raster dimensions');
    if (
      arrays.reduce((length, array) => length + array.length, 0) !== expectedLength ||
      arrays.reduce((length, array) => length + array.byteLength, 0) >
        (parameters.maxDecodedBytes ?? this.options.geotiff?.maxDecodedBytes ?? 256 * 1024 * 1024)
    )
      throw new Error('Invalid or oversized decoded raster');

    const result = {
      data,
      width: raster.width,
      height: raster.height,
      bandCount,
      dtype: outputDtype,
      interleaved,
      noData: metadata.noData,
      boundingBox: actualBoundingBox,
      crs: metadata.crs,
      metadata: metadata.metadata,
      bands: (parameters.bands ?? Array.from({length: bandCount}, (_, index) => index)).map(
        index =>
          metadata.bands?.[index]
            ? {...metadata.bands[index]}
            : {index, dtype: metadata.dtype, noData: metadata.noData}
      ),
      transform,
      pixelRegistration: 'area',
      validityMasks,
      overview,
      resolution: transform
        ? [Math.hypot(transform[0], transform[3]), Math.hypot(transform[1], transform[4])]
        : requestedResolution,
      nativeResolution: metadata.overviews
        ?.find(level => level.index === overview)
        ?.resolution?.map(Math.abs) as [number, number] | undefined,
      overzoom: metadata.overviews
        ?.find(level => level.index === overview)
        ?.resolution?.some((resolution, axis) => Math.abs(resolution) > requestedResolution[axis]),
      provenance: {sourceType: 'geotiff'},
      ownership: 'owned'
    };
    if (mixed)
      return {
        ...result,
        data: arrays,
        dtype: 'mixed',
        interleaved: false,
        bands: result.bands
      } as RasterMixedData;
    return result as RasterData;
  }

  /** Opens the GeoTIFF once and resolves its overview images and normalized metadata. */
  private async _initialize(signal?: AbortSignal): Promise<GeoTIFFInit> {
    signal?.throwIfAborted();
    const tiff = await this._openGeoTIFF(signal);
    signal?.throwIfAborted();
    const imageCount = await tiff.getImageCount();
    signal?.throwIfAborted();
    const images = await Promise.all(
      Array.from({length: imageCount}, (_, index) => tiff.getImage(index))
    );

    signal?.throwIfAborted();
    if (!images.length) {
      throw new Error('GeoTIFFRasterSource could not load any images.');
    }

    const referenceImage = images[0];
    const metadata = this._getMetadata(referenceImage, images);

    return {tiff, images, metadata};
  }

  /** Returns the shared initialization promise for this source instance. */
  private _getInitPromise(signal?: AbortSignal): Promise<GeoTIFFInit> {
    signal?.throwIfAborted();
    if (!this._initPromise) {
      const initialization = {controller: new AbortController(), subscribers: 0, settled: false};
      this._initialization = initialization;
      const promise = this._initialize(initialization.controller.signal);
      this._initPromise = promise;
      void promise.then(
        () => {
          initialization.settled = true;
        },
        () => {
          initialization.settled = true;
          if (this._initPromise === promise) this._initPromise = null;
        }
      );
    }
    const promise = this._initPromise;
    const initialization = this._initialization;
    if (initialization) initialization.subscribers++;
    const release = () => {
      if (!initialization) return;
      initialization.subscribers--;
      if (!initialization.settled && initialization.subscribers === 0) {
        initialization.controller.abort(signal?.reason);
        if (this._initPromise === promise) this._initPromise = null;
      }
    };
    if (!signal) {
      void promise.then(release, release);
      return promise;
    }
    return new Promise((resolve, reject) => {
      let released = false;
      const cleanup = () => {
        if (released) return;
        released = true;
        signal.removeEventListener('abort', abort);
        release();
      };
      const abort = () => {
        cleanup();
        reject(signal.reason);
      };
      signal.addEventListener('abort', abort, {once: true});
      if (signal.aborted) abort();
      void promise.then(
        value => {
          cleanup();
          resolve(value);
        },
        error => {
          cleanup();
          reject(error);
        }
      );
    });
  }

  /** Opens the underlying GeoTIFF using Blob reads or range-scheduled HTTP access. */
  private async _openGeoTIFF(signal?: AbortSignal): Promise<GeoTIFFDataset> {
    const initialization = this._initialization;
    if (typeof this.data === 'string') {
      const maxEntries = this.options.geotiff?.rangeCacheProps?.maxEntries ?? 128;
      const maxBytes = this.options.geotiff?.rangeCacheProps?.maxBytes ?? 8 * 1024 * 1024;
      if (![maxEntries, maxBytes].every(value => Number.isSafeInteger(value) && value >= 0))
        throw new Error('Invalid GeoTIFF cache limits');
      this._rangeCache?.clear();
      this._rangeCache = new RangeRequestCache({maxEntries, maxBytes});
      const headers = Object.fromEntries(new Headers(this.options.geotiff?.headers));
      const rangeScheduler = this._getRangeScheduler();
      const rangeCache = this._rangeCache;
      const client = new GeoTIFFRangeSchedulerClient({
        url: this.url,
        fetch: this.fetch,
        sourceId: 'geotiff',
        headers,
        rangeCache,
        maxPendingRequests: rangeScheduler.props.maxQueueSize,
        rangeScheduler,
        getInitializationSignal: () => (initialization?.settled ? undefined : signal),
        onRevisionChange: error => {
          this._finalizationController.abort(error);
          rangeCache.clear();
        }
      });
      // The library's BlockedSource retries interrupted shared blocks without a signal.
      // Adapt its buffer-source protocol directly; loaders.gl owns bounded caching and cancellation.
      return await GeoTIFF.fromSource(
        {
          /** Reads independently owned buffers in source request order. */
          fetch: (slices: GeoTIFFRangeSlice[], requestSignal?: AbortSignal) =>
            client.readRanges(slices, requestSignal),
          /** Reflects the validated remote object length discovered by transport. */
          get fileSize() {
            return client.getFileSize();
          },
          /** Releases only this source's owned byte cache. */
          close: () => rangeCache.clear()
        },
        {cache: false},
        signal
      );
    }

    return await fromBlob(this.data, signal);
  }

  /** Returns the configured shared scheduler or lazily creates a per-source scheduler. */
  private _getRangeScheduler(): RangeRequestScheduler {
    if (this.options.geotiff?.rangeScheduler) {
      return this.options.geotiff.rangeScheduler;
    }

    if (!this._rangeScheduler) {
      this._rangeScheduler = new RangeRequestScheduler({
        batchDelayMs: 0,
        ...this.options.geotiff?.rangeSchedulerProps
      });
    }

    return this._rangeScheduler;
  }

  /** Normalizes one GeoTIFF image hierarchy into public raster-source metadata. */
  private _getMetadata(referenceImage: GeoTIFFImage, images: GeoTIFFImage[]): RasterSourceMetadata {
    if (
      ![
        referenceImage.getWidth(),
        referenceImage.getHeight(),
        referenceImage.getSamplesPerPixel()
      ].every(value => Number.isSafeInteger(value) && value > 0)
    )
      throw new Error('Invalid GeoTIFF image dimensions or band count');
    const boundingBox = getImageBoundingBox(referenceImage);
    const geoKeys = referenceImage.getGeoKeys?.() || undefined;
    const gdalMetadata = referenceImage.getGDALMetadata?.() || undefined;
    const noData = referenceImage.getGDALNoData?.() ?? null;

    return {
      name: getGeoTIFFName(this.data),
      keywords: [],
      attributions: this.options.core?.attributions || [],
      crs: getImageCRS(referenceImage),
      boundingBox,
      width: referenceImage.getWidth(),
      height: referenceImage.getHeight(),
      bandCount: referenceImage.getSamplesPerPixel(),
      dtype: getImageDataType(referenceImage),
      bands: Array.from({length: referenceImage.getSamplesPerPixel()}, (_, index) =>
        getImageBandMetadata(referenceImage, index, noData)
      ),
      transform: getImageTransform(referenceImage, referenceImage),
      pixelRegistration:
        geoKeys?.GTRasterTypeGeoKey === 2
          ? 'point'
          : geoKeys?.GTRasterTypeGeoKey === 1
            ? 'area'
            : undefined,
      supportsRegion: true,
      tileSize: {
        width: referenceImage.getTileWidth(),
        height: referenceImage.getTileHeight()
      },
      overviews: images
        .map((image, index) => ({
          index,
          width: image.getWidth(),
          height: image.getHeight(),
          resolution: getImageResolution(image, referenceImage)
        }))
        .filter(overview => !(images[overview.index].fileDirectory?.NewSubfileType & 4)),
      noData,
      metadata: {
        geoKeys,
        gdalMetadata,
        bandMetadata: Array.from(
          {length: referenceImage.getSamplesPerPixel()},
          (_, index) => referenceImage.getGDALMetadata?.(index) || undefined
        )
      }
    };
  }
}

/** Flattens the internal tuple bounding box to GeoTIFF's `[minX, minY, maxX, maxY]` form. */
function flattenBoundingBox(boundingBox: RasterBoundingBox): [number, number, number, number] {
  return [...boundingBox[0], ...boundingBox[1]];
}

/** Computes the overlap between two source-coordinate bounding boxes. */
function intersectBoundingBoxes(
  leftBoundingBox: RasterBoundingBox,
  rightBoundingBox: RasterBoundingBox
): RasterBoundingBox | null {
  const minX = Math.max(leftBoundingBox[0][0], rightBoundingBox[0][0]);
  const minY = Math.max(leftBoundingBox[0][1], rightBoundingBox[0][1]);
  const maxX = Math.min(leftBoundingBox[1][0], rightBoundingBox[1][0]);
  const maxY = Math.min(leftBoundingBox[1][1], rightBoundingBox[1][1]);

  if (maxX <= minX || maxY <= minY) {
    return null;
  }

  return [
    [minX, minY],
    [maxX, maxY]
  ];
}

/** Scales the output raster size to the portion of the viewport that intersects the source. */
function getClippedTargetSize(
  viewportBoundingBox: RasterBoundingBox,
  clippedBoundingBox: RasterBoundingBox,
  parameters: RasterRegionParameters
): {width: number; height: number} {
  const viewportWidth = Math.abs(viewportBoundingBox[1][0] - viewportBoundingBox[0][0]);
  const viewportHeight = Math.abs(viewportBoundingBox[1][1] - viewportBoundingBox[0][1]);
  const clippedWidth = Math.abs(clippedBoundingBox[1][0] - clippedBoundingBox[0][0]);
  const clippedHeight = Math.abs(clippedBoundingBox[1][1] - clippedBoundingBox[0][1]);

  return {
    width: Math.max(
      1,
      Math.min(
        parameters.width,
        Math.round((clippedWidth / Math.max(viewportWidth, Number.EPSILON)) * parameters.width)
      )
    ),
    height: Math.max(
      1,
      Math.min(
        parameters.height,
        Math.round((clippedHeight / Math.max(viewportHeight, Number.EPSILON)) * parameters.height)
      )
    )
  };
}

/** Creates a no-data raster payload when the viewport does not overlap the dataset. */
function createEmptyRaster(
  parameters: RasterRegionParameters,
  metadata: RasterSourceMetadata
): RasterData {
  const length = parameters.width * parameters.height;
  const bandCount = parameters.bands?.length ?? metadata.bandCount;
  const interleaved = parameters.interleaved ?? false;
  const noData = metadata.noData ?? 0;
  const data = interleaved
    ? createFilledTypedArray(metadata.dtype, length * bandCount, noData)
    : bandCount === 1
      ? createFilledTypedArray(metadata.dtype, length, noData)
      : Array.from({length: bandCount}, () =>
          createFilledTypedArray(metadata.dtype, length, noData)
        );

  return {
    data,
    width: parameters.width,
    height: parameters.height,
    bandCount,
    dtype: metadata.dtype,
    interleaved,
    noData: metadata.noData,
    boundingBox: parameters.bounds,
    crs: metadata.crs,
    metadata: metadata.metadata,
    bands: (parameters.bands ?? Array.from({length: bandCount}, (_, index) => index)).map(index =>
      metadata.bands?.[index]
        ? {...metadata.bands[index]}
        : {index, dtype: metadata.dtype, noData: metadata.noData}
    ),
    transform: createRegionTransform(parameters.bounds, parameters.width, parameters.height),
    pixelRegistration: 'area',
    provenance: {sourceType: 'geotiff'},
    ownership: 'owned'
  };
}

/** Allocates a typed array for the requested raster channel type and fills it with one value. */
function createFilledTypedArray(
  dtype: RasterChannelDataType,
  length: number,
  fillValue: number
): TypedArray {
  switch (dtype) {
    case 'uint8':
      return new Uint8Array(length).fill(fillValue);
    case 'uint16':
      return new Uint16Array(length).fill(fillValue);
    case 'uint32':
      return new Uint32Array(length).fill(fillValue);
    case 'int8':
      return new Int8Array(length).fill(fillValue);
    case 'int16':
      return new Int16Array(length).fill(fillValue);
    case 'int32':
      return new Int32Array(length).fill(fillValue);
    case 'float32':
      return new Float32Array(length).fill(fillValue);
    case 'float64':
      return new Float64Array(length).fill(fillValue);
    default:
      return new Uint8Array(length).fill(fillValue);
  }
}

/** Converts GeoTIFF `readRasters()` output into the public `RasterData.data` union shape. */
function normalizeRasterReadResult(
  raster: GeoTIFFReadRasterResult,
  interleaved: boolean
): RasterData['data'] {
  if (interleaved) {
    return raster as unknown as RasterData['data'];
  }

  if (Array.isArray(raster)) {
    return raster.length === 1 ? raster[0] : raster;
  }

  return [raster as unknown as TypedArray];
}

/** Resolves a human-readable dataset name from the source input when possible. */
function getGeoTIFFName(data: string | Blob): string | undefined {
  if (typeof data !== 'string') {
    return undefined;
  }

  const [path] = data.split(/[?#]/);
  return path.split('/').pop() || undefined;
}

/** Returns the source-coordinate bounds advertised by a GeoTIFF image. */
function getImageBoundingBox(image: GeoTIFFImage): RasterBoundingBox | undefined {
  try {
    const [minX, minY, maxX, maxY] = image.getBoundingBox();
    return [
      [minX, minY],
      [maxX, maxY]
    ];
  } catch {
    return undefined;
  }
}

/** Estimates overview resolution relative to the full-resolution reference image. */
function getImageResolution(
  image: GeoTIFFImage,
  referenceImage: GeoTIFFImage
): [number, number] | undefined {
  const transform = getImageTransform(image, referenceImage);
  if (transform) {
    return [
      transform[3] === 0 ? transform[0] : Math.hypot(transform[0], transform[3]),
      transform[1] === 0 ? transform[4] : Math.hypot(transform[1], transform[4])
    ];
  }
  try {
    const resolution = image.getResolution(referenceImage);
    return [resolution[0], resolution[1]];
  } catch {
    return undefined;
  }
}

/** Returns a normalized CRS string for the GeoTIFF image when one is available. */
function getImageCRS(image: GeoTIFFImage): CRSIdentifier | undefined {
  const geoKeys = image.getGeoKeys?.();
  const projectedCrs = geoKeys?.ProjectedCSTypeGeoKey;
  if (projectedCrs || geoKeys?.GTModelTypeGeoKey === 1) {
    return projectedCrs && projectedCrs !== 32767 ? `EPSG:${projectedCrs}` : undefined;
  }

  const geographicCrs = geoKeys?.GeographicTypeGeoKey;
  if (geographicCrs && geographicCrs !== 32767) {
    return `EPSG:${geographicCrs}`;
  }

  return undefined;
}

/** Converts GeoTIFF sample-format metadata to a public raster channel data type. */
function getImageDataType(image: GeoTIFFImage, index = 0): RasterChannelDataType {
  const bitsPerSample = normalizeSampleValue(image.getBitsPerSample(index));
  const sampleFormat = normalizeSampleValue(image.getSampleFormat(index));

  switch (sampleFormat) {
    case 1:
      switch (bitsPerSample) {
        case 8:
          return 'uint8';
        case 16:
          return 'uint16';
        case 32:
          return 'uint32';
        default:
          break;
      }
      break;

    case 2:
      switch (bitsPerSample) {
        case 8:
          return 'int8';
        case 16:
          return 'int16';
        case 32:
          return 'int32';
        default:
          break;
      }
      break;

    case 3:
      switch (bitsPerSample) {
        case 32:
          return 'float32';
        case 64:
          return 'float64';
        default:
          break;
      }
      break;

    default:
      break;
  }

  throw new Error(
    `GeoTIFFRasterSource does not support sample format ${sampleFormat} with ${bitsPerSample} bits.`
  );
}

/** Normalizes single-value or per-sample TIFF metadata arrays to the first sample value. */
function normalizeSampleValue(value: number | number[]): number {
  return Array.isArray(value) ? value[0] : value;
}

/** Encoded byte slice requested by TIFF directory and sample readers. */
type GeoTIFFRangeSlice = {
  /** Starting byte offset. */
  offset: number;
  /** Requested byte length. */
  length: number;
};

type GeoTIFFRangeSchedulerClientProps = {
  url: string;
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  sourceId: string;
  headers?: HeadersInit;
  rangeScheduler: RangeRequestScheduler;
  /** Source-owned encoded byte cache. */
  rangeCache: RangeRequestCache;
  /** Maximum concurrent logical client requests, including shared cache subscribers. */
  maxPendingRequests: number;
  /** Invalidates only the source owning this client when remote revision metadata changes. */
  onRevisionChange?: (error: Error) => void;
  /** Supplies the shared discovery signal only while initialization is active. */
  getInitializationSignal?: () => AbortSignal | undefined;
};

/** Minimal geotiff.js client backed by loaders.gl fetch and range scheduling. */
class GeoTIFFRangeSchedulerClient {
  readonly url: string;

  private readonly fetch: GeoTIFFRangeSchedulerClientProps['fetch'];
  private readonly sourceId: string;
  private readonly defaultHeaders?: HeadersInit;
  private readonly rangeScheduler: RangeRequestScheduler;
  private readonly schedulerIsolationKey = {};
  /** Source-owned cache; never shared across authorization or source instances. */
  private readonly rangeCache: RangeRequestCache;
  /** Admission limit includes every logical cache subscriber. */
  private readonly maxPendingRequests: number;
  /** Number of logical requests awaiting transfer or a cache entry. */
  private pendingRequests = 0;
  private fileSize: number | null = null;
  /** Remote object revision headers remain private to cache identity. */
  private entityTag: string | null = null;
  /** Optional fallback revision hint, compared only when both responses declare it. */
  private lastModified: string | null = null;
  /** Invalidates owned source work without disposing a borrowed scheduler. */
  private readonly onRevisionChange?: (error: Error) => void;
  /** Discovery cancellation for geotiff.js directory reads without their own signal. */
  private readonly getInitializationSignal?: () => AbortSignal | undefined;

  /** Creates a new range-scheduled GeoTIFF client. */
  constructor(props: GeoTIFFRangeSchedulerClientProps) {
    this.url = props.url;
    this.fetch = props.fetch;
    this.sourceId = props.sourceId;
    this.defaultHeaders = new Headers(props.headers);
    this.rangeCache = props.rangeCache;
    this.maxPendingRequests = props.maxPendingRequests;
    this.rangeScheduler = props.rangeScheduler;
    this.getInitializationSignal = props.getInitializationSignal;
    this.onRevisionChange = props.onRevisionChange;
  }

  /** Returns the validated remote file size, when available. */
  getFileSize(): number | null {
    return this.fileSize;
  }

  /** Returns standalone buffers in the order required by geotiff.js's source protocol. */
  async readRanges(slices: GeoTIFFRangeSlice[], signal?: AbortSignal): Promise<ArrayBuffer[]> {
    return Promise.all(
      slices.map(slice =>
        this.request({
          headers: createRangeRequestHeaders(new Headers(), slice.offset, slice.length),
          signal
        })
      )
    );
  }

  /** Executes one geotiff.js byte-range request through the shared scheduler. */
  async request({
    headers,
    signal
  }: {
    headers?: HeadersInit;
    signal?: AbortSignal;
  } = {}): Promise<ArrayBuffer> {
    signal ??= this.getInitializationSignal?.();
    signal?.throwIfAborted();
    if (this.pendingRequests >= this.maxPendingRequests)
      throw new Error('GeoTIFF request queue limit exceeded');
    this.pendingRequests++;
    try {
      const mergedHeaders = new Headers(this.defaultHeaders);
      new Headers(headers).forEach((value, key) => mergedHeaders.set(key, value));
      const {offset, length} = parseSingleRangeHeader(mergedHeaders.get('Range'));
      const requestHeaders = new Headers(mergedHeaders);
      requestHeaders.delete('Range');
      const readRange = (rangeOffset: number, rangeLength: number, rangeSignal?: AbortSignal) =>
        this.rangeScheduler.scheduleRequest({
          sourceId: this.sourceId,
          isolationKey: this.schedulerIsolationKey,
          offset: rangeOffset,
          length: rangeLength,
          signal: rangeSignal,
          fetchRange: (transportOffset, transportLength, transportSignal) =>
            this._fetchRange(transportOffset, transportLength, requestHeaders, transportSignal)
        });
      let arrayBuffer: ArrayBuffer;
      if (this.fileSize === null) {
        // The first read can be shorter at EOF; it discovers the immutable file size.
        arrayBuffer = await readRange(offset, length, signal);
        this.rangeCache.set(this.sourceId, offset, arrayBuffer);
      } else {
        const boundedLength =
          offset < this.fileSize ? Math.min(length, this.fileSize - offset) : length;
        arrayBuffer = await this.rangeCache.read({
          sourceId: this.sourceId,
          offset,
          length: boundedLength,
          signal,
          fetchRange: readRange
        });
      }
      signal?.throwIfAborted();

      return arrayBuffer;
    } finally {
      this.pendingRequests--;
    }
  }

  /** Fetches one transport range from the remote GeoTIFF. */
  private async _fetchRange(
    offset: number,
    length: number,
    headers: Headers,
    signal?: AbortSignal
  ): Promise<RangeRequestTransportResult> {
    let response = await this.fetch(this.url, {
      headers: createRangeRequestHeaders(headers, offset, length),
      signal
    });

    if (response.status === 416 && offset === 0) {
      const actualLength = parseUnsatisfiedContentRange(response.headers.get('Content-Range'));
      if (!actualLength || !Number.isSafeInteger(actualLength) || actualLength > length) {
        throw new Error('Missing content-length on 416 response');
      }
      await response.body?.cancel().catch(() => {});
      response = await this.fetch(this.url, {
        headers: createRangeRequestHeaders(headers, 0, actualLength),
        signal
      });
    }

    if (response.status === 200) {
      await response.body?.cancel().catch(() => {});
      throw new Error('Byte-range request failed: server returned 200 instead of 206');
    }

    if (response.status !== 206) {
      await response.body?.cancel().catch(() => {});
      throw new Error(`Bad response code: ${response.status}`);
    }

    let total: number | null;
    try {
      total = validateGeoTIFFContentRange(response.headers.get('Content-Range'), offset, length);
      const entityTag = response.headers.get('ETag');
      const lastModified = response.headers.get('Last-Modified');
      if (
        (this.fileSize !== null && total !== null && this.fileSize !== total) ||
        (this.entityTag && entityTag && this.entityTag !== entityTag) ||
        (this.lastModified && lastModified && this.lastModified !== lastModified)
      ) {
        const error = new Error('Remote GeoTIFF revision changed; recreate the source');
        this.onRevisionChange?.(error);
        throw error;
      }
      if (total !== null) this.fileSize = total;
      this.entityTag ??= entityTag;
      this.lastModified ??= lastModified;
    } catch (error) {
      await response.body?.cancel().catch(() => {});
      throw error;
    }
    const arrayBuffer = await readGeoTIFFRangeResponse(response, length, signal);
    return {
      arrayBuffer,
      status: response.status,
      sourceByteLength: this.fileSize ?? undefined,
      transportBytes: arrayBuffer.byteLength
    };
  }
}

/** Creates the HTTP headers for one byte-range request. */
function createRangeRequestHeaders(headers: Headers, offset: number, length: number): Headers {
  const requestHeaders = new Headers(headers);
  requestHeaders.set('Range', `bytes=${offset}-${offset + length - 1}`);
  return requestHeaders;
}

/** Parses one single-range `Range` header into offset and byte length. */
function parseSingleRangeHeader(rangeHeader: string | null): {offset: number; length: number} {
  const match = rangeHeader?.match(/^bytes=(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`GeoTIFF range request requires a single byte range. Received: ${rangeHeader}`);
  }

  const offset = Number(match[1]);
  const endOffset = Number(match[2]);
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(endOffset) || endOffset < offset)
    throw new Error('Invalid GeoTIFF byte range');
  return {offset, length: endOffset - offset + 1};
}

/** Validates response placement and optional object length before any encoded bytes are buffered. */
function validateGeoTIFFContentRange(
  contentRange: string | null,
  offset: number,
  length: number
): number | null {
  if (!contentRange) return null; // CORS may hide this response header.
  const match = contentRange.match(/^bytes (\d+)-(\d+)\/(\d+|\*)$/);
  if (!match) throw new Error('Invalid GeoTIFF Content-Range');
  const start = Number(match[1]);
  const end = Number(match[2]);
  const total = match[3] === '*' ? null : Number(match[3]);
  if (
    ![start, end].every(Number.isSafeInteger) ||
    start !== offset ||
    end < start ||
    (total !== null && (!Number.isSafeInteger(total) || total <= end)) ||
    end !== Math.min(offset + length - 1, total === null ? Infinity : total - 1)
  )
    throw new Error('Contradictory GeoTIFF Content-Range');
  return total;
}

/** Reads at most one requested range, canceling lying or obsolete streams without buffering a whole asset. */
async function readGeoTIFFRangeResponse(
  response: Response,
  maximumBytes: number,
  signal?: AbortSignal
): Promise<ArrayBuffer> {
  if (!response.body) return new ArrayBuffer(0);
  const reader = response.body.getReader();
  const bytes = new Uint8Array(maximumBytes);
  let writtenBytes = 0;
  try {
    while (true) {
      const chunk = await waitForPromiseWithSignal(reader.read(), signal);
      if (chunk.done) break;
      if (writtenBytes + chunk.value.byteLength > maximumBytes)
        throw new Error('GeoTIFF range response exceeds byte budget');
      bytes.set(chunk.value, writtenBytes);
      writtenBytes += chunk.value.byteLength;
    }
    signal?.throwIfAborted();
    return writtenBytes === maximumBytes ? bytes.buffer : bytes.buffer.slice(0, writtenBytes);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

/** Parses the file length from a `416 Range Not Satisfiable` `Content-Range` header. */
function parseUnsatisfiedContentRange(contentRange: string | null): number | null {
  const match = contentRange?.match(/^bytes \*\/(\d+)$/);
  return match ? Number(match[1]) : null;
}

/** Preserves TIFF rotation/shear, or resolves the explicit origin and signed pixel spacing. */
function getImageTransform(
  image: GeoTIFFImage,
  referenceImage: GeoTIFFImage
): RasterAffineTransform | undefined {
  const matrix = image.fileDirectory?.ModelTransformation;
  if (matrix) return [matrix[0], matrix[1], matrix[3], matrix[4], matrix[5], matrix[7]];
  if (
    image !== referenceImage &&
    !image.fileDirectory?.ModelTiepoint &&
    !image.fileDirectory?.ModelPixelScale
  ) {
    const referenceTransform = getImageTransform(referenceImage, referenceImage);
    if (referenceTransform) {
      const scaleX = referenceImage.getWidth() / image.getWidth();
      const scaleY = referenceImage.getHeight() / image.getHeight();
      return [
        referenceTransform[0] * scaleX,
        referenceTransform[1] * scaleY,
        referenceTransform[2],
        referenceTransform[3] * scaleX,
        referenceTransform[4] * scaleY,
        referenceTransform[5]
      ];
    }
  }
  try {
    const resolution = image.getResolution(referenceImage);
    let origin: number[];
    try {
      origin = image.getOrigin();
    } catch {
      origin = referenceImage.getOrigin();
    }
    const tiepoint = image.fileDirectory?.ModelTiepoint;
    return [
      resolution[0],
      0,
      origin[0] - (tiepoint?.[0] ?? 0) * resolution[0],
      0,
      resolution[1],
      origin[1] - (tiepoint?.[1] ?? 0) * resolution[1]
    ];
  } catch {
    return undefined;
  }
}

/** Parses finite numeric metadata without interpreting empty content as zero. */
function parseFiniteMetadataValue(value: unknown): number | undefined {
  if (typeof value !== 'number' && typeof value !== 'string') return undefined;
  if (typeof value === 'string' && !value.trim()) return undefined;
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}

/** Interprets optional GDAL band attributes while retaining samples in the raw domain. */
function getImageBandMetadata(
  image: GeoTIFFImage,
  index: number,
  noData: number | null
): RasterBandMetadata {
  const metadata = image.getGDALMetadata?.(index) || {};
  const scale = parseFiniteMetadataValue(metadata.SCALE);
  const offset = parseFiniteMetadataValue(metadata.OFFSET);
  if (
    (metadata.SCALE !== undefined && scale === undefined) ||
    (metadata.OFFSET !== undefined && offset === undefined)
  )
    throw new Error('Invalid GDAL band scale or offset');
  const minimumValue = parseFiniteMetadataValue(metadata.STATISTICS_MINIMUM);
  const maximumValue = parseFiniteMetadataValue(metadata.STATISTICS_MAXIMUM);
  const hasMinimum = minimumValue !== undefined;
  const hasMaximum = maximumValue !== undefined;
  const hasDeclaredRange =
    (hasMinimum || hasMaximum) && !(hasMinimum && hasMaximum && minimumValue > maximumValue);
  return {
    index,
    declaredStatistics: hasDeclaredRange
      ? {
          band: index,
          domain: 'unknown',
          scope: 'source',
          method: 'declared',
          min: hasMinimum ? minimumValue : undefined,
          max: hasMaximum ? maximumValue : undefined
        }
      : undefined,
    dtype: getImageDataType(image, index),
    categorical:
      index === 0 && image.fileDirectory?.PhotometricInterpretation === 3 ? true : undefined,
    name: metadata.DESCRIPTION,
    units: metadata.UNITTYPE,
    scale,
    offset,
    noData
  };
}

/** Resamples native windows with shared raw-domain validity; yields between row groups for cancellation. */
async function resizeRasterWindow(
  nativeRaster: GeoTIFFReadRasterResult,
  bands: RasterBandMetadata[],
  interleaved: boolean,
  targetSize: {width: number; height: number},
  method: 'nearest' | 'bilinear',
  signal?: AbortSignal,
  nativeValidityMasks?: RasterData['validityMasks']
): Promise<{raster: GeoTIFFReadRasterResult; validityMasks?: RasterData['validityMasks']}> {
  signal?.throwIfAborted();
  if (nativeRaster.width === targetSize.width && nativeRaster.height === targetSize.height) {
    const raster = interleaved
      ? await interleaveRasterBands(nativeRaster, bands[0].dtype, signal)
      : nativeRaster;
    return {raster, validityMasks: nativeValidityMasks};
  }
  const data = normalizeRasterReadResult(nativeRaster, false);
  const mixed = bands.some(band => band.dtype !== bands[0].dtype);
  const input = {
    data,
    dtype: mixed ? 'mixed' : bands[0].dtype,
    interleaved: false,
    width: nativeRaster.width,
    height: nativeRaster.height,
    bandCount: bands.length,
    bands,
    validityMasks: nativeValidityMasks
  } as NumericRasterData;
  const pixelCount = targetSize.width * targetSize.height;
  const output = interleaved
    ? createFilledTypedArray(bands[0].dtype, pixelCount * bands.length, 0)
    : bands.map(band => createFilledTypedArray(band.dtype, pixelCount, band.noData ?? 0));
  const validityMasks = bands.map((_band, band) => ({
    data: new Uint8Array(pixelCount),
    band,
    width: targetSize.width,
    height: targetSize.height,
    pixelStride: 1,
    rowStride: targetSize.width
  }));
  for (let row = 0; row < targetSize.height; row++) {
    for (let column = 0; column < targetSize.width; column++) {
      const pixelIndex = row * targetSize.width + column;
      if (pixelIndex % 32768 === 0) {
        signal?.throwIfAborted();
        if (pixelIndex > 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
        signal?.throwIfAborted();
      }
      const sample = sampleRaster(
        input,
        [
          ((column + 0.5) * nativeRaster.width) / targetSize.width - 0.5,
          ((row + 0.5) * nativeRaster.height) / targetSize.height - 0.5
        ],
        {method}
      );
      for (let band = 0; band < bands.length; band++) {
        const value = sample.values[band];
        if (value === undefined || !Number.isFinite(value)) continue;
        if (Array.isArray(output)) output[band][pixelIndex] = value;
        else output[pixelIndex * bands.length + band] = value;
        validityMasks[band].data[pixelIndex] = 1;
      }
    }
  }
  signal?.throwIfAborted();
  const raster = Object.assign(output, {
    width: targetSize.width,
    height: targetSize.height
  }) as GeoTIFFReadRasterResult;
  return {raster, validityMasks};
}

/** Packs native planar bands without widening, scaling, or replacing invalid raw values. */
async function interleaveRasterBands(
  raster: GeoTIFFReadRasterResult,
  dtype: RasterChannelDataType,
  signal?: AbortSignal
): Promise<GeoTIFFReadRasterResult> {
  const arrays = Array.isArray(raster) ? raster : [raster];
  const pixelCount = raster.width * raster.height;
  const output = createFilledTypedArray(dtype, pixelCount * arrays.length, 0);
  for (let pixel = 0; pixel < pixelCount; pixel++) {
    if (pixel % 32768 === 0) {
      signal?.throwIfAborted();
      if (pixel > 0) await new Promise<void>(resolve => setTimeout(resolve, 0));
      signal?.throwIfAborted();
    }
    for (let band = 0; band < arrays.length; band++)
      output[pixel * arrays.length + band] = arrays[band][pixel];
  }
  signal?.throwIfAborted();
  return Object.assign(output, {
    width: raster.width,
    height: raster.height
  }) as GeoTIFFReadRasterResult;
}

/** Describes an explicitly invalid output grid in the caller's declared source CRS. */
function createRegionTransform(
  bounds: RasterBoundingBox,
  width: number,
  height: number
): RasterAffineTransform {
  return [
    (bounds[1][0] - bounds[0][0]) / width,
    0,
    bounds[0][0],
    0,
    -(bounds[1][1] - bounds[0][1]) / height,
    bounds[1][1]
  ];
}

/** Estimates all concurrently decoded tiles intersecting a native window, including unselected channels. */
function estimateImageTileBytes(
  image: GeoTIFFImage,
  window: number[],
  bytesPerPixel: number
): number {
  const tileWidth = image.getTileWidth?.() ?? window[2] - window[0];
  const tileHeight = image.getTileHeight?.() ?? window[3] - window[1];
  if (![tileWidth, tileHeight].every(value => Number.isSafeInteger(value) && value > 0))
    throw new Error('Invalid GeoTIFF tile dimensions');
  const columns = Math.ceil(window[2] / tileWidth) - Math.floor(window[0] / tileWidth);
  const rows = Math.ceil(window[3] / tileHeight) - Math.floor(window[1] / tileHeight);
  return columns * rows * tileWidth * tileHeight * bytesPerPixel;
}
