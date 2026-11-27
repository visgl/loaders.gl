// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {
  TileGridMatrix,
  CoreAPI,
  GetRasterParameters,
  GetRasterTileParameters,
  RasterBoundingBox,
  RasterChannelDataType,
  RasterData,
  RasterSource,
  RasterSourceMetadata,
  SourceLoader,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanQueryMetadataProvider
} from '@loaders.gl/core/loader-utils';
import type {CRSDefinition} from '@math.gl/geospatial/crs';
import {
  createTileGrid,
  createScanQueryMetadata,
  getRasterViewportBoundingBox,
  isRasterSampleValid,
  resolveTileGridTile
} from '@loaders.gl/core/loader-utils';

import {getMultiscaleVariablePaths, getSpatialMultiscaleLevels} from './lib/spatial-multiscales';
import type {SpatialMultiscaleLevel} from './lib/spatial-multiscales';
import type {SupportedTypedArray} from './types';
import {ZarrSource, type ZarrLoaderOptions} from './ome-zarr-loader';
import {
  awaitWithAbort,
  cloneZarrSelection,
  getCachedZarrSelection,
  getZarrSelectionKey
} from './lib/zarr-data-cache';
import {GEO_ZARR_DEFAULT_MAX_CONCURRENT_REQUESTS} from './lib/geo-zarr-defaults';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Six Rasterio/Affine coefficients `[scaleX, rotationX, translateX, rotationY, scaleY, translateY]`. */
export type GeoZarrAffineTransform = [
  scaleX: number,
  rotationX: number,
  translateX: number,
  rotationY: number,
  scaleY: number,
  translateY: number
];

/** One non-spatial dimension that can be selected before reading a 2D raster window. */
export type GeoZarrSelectionDimension = {
  /** Dimension name declared by Zarr or xarray. */
  name: string;
  /** Number of indices in this dimension. */
  size: number;
  /** Index used when a raster request omits this dimension. */
  defaultIndex: number;
};

/** Native array geometry for one advertised spatial multiscale level. */
export type GeoZarrLevelMetadata = {
  /** Advertised asset identifier, preserved verbatim. */
  id: string;
  /** Data-array path relative to the selected group. */
  array: string;
  /** Resolved array metadata; absent when this level cannot be normalized. */
  metadata?: Omit<GeoZarrSourceMetadata, 'levels' | 'tileGrid' | 'nativeTileMatrixIds'>;
};

/** Normalized metadata exposed by {@link GeoZarrRasterSource}. */
export type GeoZarrSourceMetadata = RasterSourceMetadata & {
  /** Data-array path relative to the selected Zarr group. */
  array: string;
  /** Advertised spatial multiscales and their native raster geometry. */
  levels?: GeoZarrLevelMetadata[];
  /** Ordered names matching the data array shape. */
  dimensions: string[];
  /** Logical `[y, x]` spatial dimension names. */
  spatialDimensions: [y: string, x: string];
  /** Selectable time, vertical, band, or other non-spatial dimensions. */
  selectionDimensions: GeoZarrSelectionDimension[];
  /** Normalized pixel-corner affine transform used for spatial window reads. */
  transform: GeoZarrAffineTransform;
  /** Registration declared by GeoZarr, or `pixel` for a transform derived from CF coordinates. */
  registration: 'pixel' | 'node';
};

/** Options for {@link GeoZarrLoader}. */
export type GeoZarrLoaderOptions = ZarrLoaderOptions & {
  /** GeoZarr and CF data-variable options. */
  geozarr?: {
    /** Data-array path relative to `zarr.path`, or the variable name in a level-group pyramid. */
    array?: string;
    /** Explicit logical `[y, x]` dimension names. */
    spatialDimensions?: [y: string, x: string];
    /** Explicit affine transform when the store does not provide one. */
    transform?: GeoZarrAffineTransform;
    /** Explicit coordinate reference system definition or identifier. */
    coordinateReferenceSystem?: CRSDefinition;
    /** Default indices for non-spatial dimensions such as `time` or `level`. */
    defaultSelection?: Record<string, number>;
    /** Uses a finite Zarr fill value as no-data in the absence of a CF declaration. Defaults to false for all dtypes. */
    fillValueAsNoData?: boolean;
    /** Maximum concurrent store reads. Defaults to 16. */
    maxConcurrentRequests?: number;
  };
};

/** Parameters used to request a native-resolution spatial window from a GeoZarr array. */
export type GetGeoZarrParameters = Omit<GetRasterParameters, 'bands' | 'interleaved'>;

/** Zarr attributes before format-specific normalization. */
type GeoZarrAttributes = Record<string, unknown>;

/** A level's metadata cannot be normalized into supported raster geometry. */
class UnsupportedGeoZarrLevelError extends Error {}

/** Open data array and geometry used for reading its windows. */
type GeoZarrInit = {
  /** Validated parent group and shared store used by sibling metadata reads. */
  group: zarrita.Group<Readable>;
  /** Open Zarrita data array. */
  array: zarrita.Array<zarrita.DataType, Readable>;
  /** Normalized source metadata. */
  metadata: GeoZarrSourceMetadata;
  /** Physical position of the logical x dimension. */
  xDimensionIndex: number;
  /** Physical position of the logical y dimension. */
  yDimensionIndex: number;
  /** Multiscale levels of the selected array, resolved once by `initialize`. */
  layout: SpatialMultiscaleLevel[];
};

/** Advertised overview metadata and the open arrays that can be read. */
type GeoZarrGrid = {
  /** Selected array metadata with all advertised levels and the chunk grid. */
  metadata: GeoZarrSourceMetadata;
  /** Open arrays in advertised level order. */
  levels: (GeoZarrInit | undefined)[];
};

/** Inclusive start and exclusive stop coordinates for a pixel window. */
type PixelWindow = {
  /** First included column. */
  columnStart: number;
  /** First excluded column. */
  columnStop: number;
  /** First included row. */
  rowStart: number;
  /** First excluded row. */
  rowStop: number;
};

/** GeoZarr's single-band raster window with its required pixel-corner transform. */
type GeoZarrRasterWindow = RasterData & {
  /** Packed row-major samples for the selected slice. */
  data: SupportedTypedArray;
  /** Affine transform anchored at the window's first pixel corner. */
  transform: GeoZarrAffineTransform;
};

/** Source factory for GeoZarr and regular CF/xarray Zarr raster arrays. */
export const GeoZarrLoaderWithParser = {
  dataType: null as unknown as GeoZarrRasterSource,
  /** Runtime source type marker used by `createDataSource()` type inference. */
  dataSource: null as unknown as GeoZarrRasterSource,
  batchType: null as never,
  name: 'GeoZarrLoader',
  id: 'geozarr',
  module: 'scientific',
  version: VERSION,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'geozarr',
  fromUrl: true,
  fromBlob: false,

  options: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    geozarr: {
      array: undefined!,
      spatialDimensions: undefined!,
      transform: undefined!,
      coordinateReferenceSystem: undefined!,
      defaultSelection: undefined!,
      fillValueAsNoData: false,
      maxConcurrentRequests: GEO_ZARR_DEFAULT_MAX_CONCURRENT_REQUESTS
    }
  } as GeoZarrLoaderOptions,

  defaultOptions: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    },
    geozarr: {
      array: undefined!,
      spatialDimensions: undefined!,
      transform: undefined!,
      coordinateReferenceSystem: undefined!,
      defaultSelection: undefined!,
      fillValueAsNoData: false,
      maxConcurrentRequests: GEO_ZARR_DEFAULT_MAX_CONCURRENT_REQUESTS
    }
  },

  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  createDataSourceSync: (
    data: string,
    options: GeoZarrLoaderOptions,
    coreApi?: CoreAPI
  ): GeoZarrRasterSource => new GeoZarrRasterSource(data, options, coreApi)
} as const satisfies SourceLoader<GeoZarrRasterSource>;

/** Viewport-driven raster source for GeoZarr and regular CF/xarray Zarr data variables. */
export class GeoZarrRasterSource
  extends ZarrSource
  implements
    RasterSource<RasterData, GetGeoZarrParameters, GeoZarrSourceMetadata>,
    ScanQueryMetadataProvider
{
  /** Shared source initialization request. */
  private initializationPromise: Promise<GeoZarrInit> | null = null;

  /** Shared multiscale discovery request. */
  private gridPromise: Promise<GeoZarrGrid> | null = null;

  /** Creates a GeoZarr raster source. */
  constructor(data: string, options: GeoZarrLoaderOptions, coreApi?: CoreAPI) {
    super(
      data,
      options,
      coreApi,
      options.geozarr?.maxConcurrentRequests ?? GEO_ZARR_DEFAULT_MAX_CONCURRENT_REQUESTS
    );
  }

  /** Returns normalized geospatial, array, and selectable-dimension metadata. */
  async getMetadata(): Promise<GeoZarrSourceMetadata> {
    return (await this.getGridPromise()).metadata;
  }

  /** Shares open overview arrays across metadata and window requests. */
  private async getGridPromise(): Promise<GeoZarrGrid> {
    if (!this.gridPromise) {
      this.gridPromise = this.loadGridMetadata().catch(error => {
        this.gridPromise = null;
        throw error;
      });
    }
    return await this.gridPromise;
  }

  /** Opens sibling geometry, reading coordinate arrays when needed. */
  private async loadGridMetadata(): Promise<GeoZarrGrid> {
    const selected = await this.getInitializationPromise();
    const {metadata, group, layout} = selected;
    const selectedScale = layout.find(level => level.array === metadata.array)?.scale;
    const levels = await Promise.all(
      layout.map(async level => {
        if (level.array === metadata.array) return selected;
        try {
          const initialization = await this.initialize(undefined, group, level.array, layout);
          if (
            selectedScale &&
            level.scale &&
            !isConsistentOMELevel(level.scale, selectedScale, initialization.metadata, metadata)
          ) {
            return undefined;
          }
          return initialization;
        } catch (error) {
          // Propagate read failures so the next request can retry grid discovery.
          rethrowRetryableLevelError(error);
          return undefined;
        }
      })
    );
    const advertisedLevels: GeoZarrLevelMetadata[] = layout.map(({id, array}, index) => {
      const level = levels[index];
      return level ? {id, array, metadata: level.metadata} : {id, array};
    });
    const normalizedLevels = advertisedLevels.length
      ? advertisedLevels
      : [{id: metadata.array, array: metadata.array, metadata}];
    const matrices = normalizedLevels.map(level => getSpatialChunkMatrix(level.id, level.metadata));
    const commonCoordinateReferenceSystem =
      typeof metadata.crs === 'string' &&
      normalizedLevels.every(level => level.metadata?.crs === metadata.crs)
        ? metadata.crs
        : undefined;
    const tileGrid = createTileGrid(commonCoordinateReferenceSystem, matrices);
    return {
      metadata: {
        ...metadata,
        ...(advertisedLevels.length ? {levels: advertisedLevels} : {}),
        tileGrid,
        // Native reads need a complete matrix set, so an incomplete grid has no readable IDs.
        nativeTileMatrixIds: tileGrid.tileMatrixSet?.crs ? tileGrid.matrixIds?.slice() ?? [] : []
      },
      levels: advertisedLevels.length ? levels : [selected]
    };
  }

  /** Discovers GeoZarr variables, spatial bounds, and selectable dimensions. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    if (options.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const metadata = await this.getMetadata();
    if (options.signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
    const fields = [{name: metadata.array, type: metadata.dtype, nullable: true, metadata: {}}];
    return createScanQueryMetadata({
      sourceType: 'geozarr',
      queryType: 'raster',
      execution: {status: 'supported', method: 'getRaster'},
      name: metadata.name,
      schema: {fields, metadata: {}},
      capabilities: {
        bounds: 'pushdown',
        levelOfDetail: 'unsupported'
      },
      spatial: metadata.boundingBox
        ? {
            bounds: {minimum: metadata.boundingBox[0], maximum: metadata.boundingBox[1]},
            coordinateReferenceSystems:
              typeof metadata.crs === 'string' ? [metadata.crs] : undefined
          }
        : undefined
    });
  }

  /**
   * Loads a clipped native-resolution 2D window for the requested viewport and named selection.
   * When supplying `viewport.crs`, pass the string from the source's `metadata.crs`.
   */
  async getRaster(parameters: GetGeoZarrParameters): Promise<RasterData> {
    parameters.signal?.throwIfAborted();
    const selected = await this.getInitializationPromise(parameters.signal);
    const requestedBoundingBox = getRasterViewportBoundingBox(parameters.viewport);
    const viewportCoordinateReferenceSystem = parameters.viewport.crs;

    if (
      selected.metadata.crs &&
      viewportCoordinateReferenceSystem &&
      selected.metadata.crs !== viewportCoordinateReferenceSystem
    ) {
      throw new Error(
        `GeoZarrRasterSource does not support reprojection. Requested ${viewportCoordinateReferenceSystem}, source ${selected.metadata.crs}.`
      );
    }
    if (parameters.resampleMethod === 'bilinear') {
      throw new Error(
        'GeoZarrRasterSource currently supports native nearest-neighbor windows only.'
      );
    }

    let overview = Math.max(
      0,
      selected.layout.findIndex(level => level.array === selected.metadata.array)
    );
    let initialization = selected;
    const {width: viewportWidth, height: viewportHeight} = parameters.viewport;
    const requestedPixelSize = Math.min(
      (requestedBoundingBox[1][0] - requestedBoundingBox[0][0]) / viewportWidth,
      (requestedBoundingBox[1][1] - requestedBoundingBox[0][1]) / viewportHeight
    );
    const selectedPixelSize = getPixelSize(selected.metadata.transform);
    const sourceIntersection = intersectBoundingBoxes(
      requestedBoundingBox,
      selected.metadata.boundingBox
    );
    if (
      sourceIntersection &&
      selected.layout.length > 1 &&
      Number.isFinite(requestedPixelSize) &&
      requestedPixelSize > selectedPixelSize
    ) {
      const grid = await awaitWithAbort(this.getGridPromise(), parameters.signal);
      let pixelSize = selectedPixelSize;
      for (const [index, level] of grid.levels.entries()) {
        if (!level || !isSameCRS(level.metadata.crs, selected.metadata.crs)) continue;
        const levelPixelSize = getPixelSize(level.metadata.transform);
        const [scaleX, , , , scaleY] = level.metadata.transform;
        if (
          levelPixelSize > pixelSize &&
          levelPixelSize <= requestedPixelSize &&
          haveMatchingSelections(selected.metadata, level.metadata) &&
          containsBoundingBox(
            level.metadata.boundingBox,
            sourceIntersection,
            Math.abs(scaleX),
            Math.abs(scaleY)
          )
        ) {
          overview = index;
          initialization = level;
          pixelSize = levelPixelSize;
        }
      }
    }
    parameters.signal?.throwIfAborted();
    const {metadata} = initialization;
    const clippedBoundingBox =
      sourceIntersection && intersectBoundingBoxes(sourceIntersection, metadata.boundingBox);
    if (!clippedBoundingBox) {
      return createEmptyRaster(metadata, requestedBoundingBox, overview);
    }

    const pixelWindow = getPixelWindow(clippedBoundingBox, metadata);
    if (
      pixelWindow.columnStart === pixelWindow.columnStop ||
      pixelWindow.rowStart === pixelWindow.rowStop
    ) {
      return createEmptyRaster(metadata, clippedBoundingBox, overview);
    }

    return this.readRasterWindow(initialization, pixelWindow, overview, parameters);
  }

  /** Experimental. Reads one spatial chunk from the named level at its native resolution. */
  async getRasterTile(parameters: GetRasterTileParameters): Promise<RasterData | null> {
    const {tileMatrix, signal, bands, interleaved = false} = parameters;
    signal?.throwIfAborted();
    const {metadata: sourceMetadata, levels} = await awaitWithAbort(this.getGridPromise(), signal);
    signal?.throwIfAborted();
    const {tileGrid} = sourceMetadata;
    const matrixSet = tileGrid?.tileMatrixSet;
    if (!matrixSet?.crs || !matrixSet.matrices.length) {
      throw new Error('GeoZarr native tile reads require a complete native tile matrix set');
    }
    const tile = resolveTileGridTile(tileGrid, {...parameters, z: 0});
    if (!tile) return null;
    const overview = matrixSet.matrices.findIndex(matrix => matrix.id === tileMatrix);
    const level = levels[overview];
    if (!level) return null;

    const {metadata} = level;
    const [width, height] = matrixSet.matrices[overview].tileSize;
    const columnStart = tile.x * width;
    const rowStart = tile.y * height;
    if (columnStart >= metadata.width || rowStart >= metadata.height) return null;
    if (bands && (bands.length !== 1 || bands[0] !== 0)) {
      throw new Error(
        'GeoZarr exposes one raster band. Use bands: [0] and select non-spatial indices by name.'
      );
    }

    const pixelWindow = {
      columnStart,
      columnStop: Math.min(columnStart + width, metadata.width),
      rowStart,
      rowStop: Math.min(rowStart + height, metadata.height)
    };
    const raster = await this.readRasterWindow(level, pixelWindow, overview, parameters);
    signal?.throwIfAborted();
    const {transform} = raster;
    const resolution: [number, number] = [transform[0], Math.abs(transform[4])];
    return {
      ...raster,
      ...padRasterTile(raster, width, height),
      width,
      height,
      interleaved,
      bands: raster.bands?.map(band => ({...band})),
      boundingBox: getTransformBoundingBox(transform, width, height),
      pixelRegistration: 'area',
      resolution,
      nativeResolution: resolution,
      overzoom: false,
      provenance: {sourceType: 'geozarr'},
      ownership: 'owned'
    };
  }

  /** Reads a selected 2D integer window and returns row-major samples in source coordinates. */
  private async readRasterWindow(
    initialization: GeoZarrInit,
    pixelWindow: PixelWindow,
    overview: number,
    parameters: Pick<GetGeoZarrParameters, 'selection' | 'signal'>
  ): Promise<GeoZarrRasterWindow> {
    const {array, metadata, xDimensionIndex, yDimensionIndex} = initialization;
    const selection = normalizeSelection(parameters.selection, metadata.selectionDimensions);
    const zarritaSelection = metadata.dimensions.map((dimensionName, dimensionIndex) => {
      if (dimensionIndex === xDimensionIndex) {
        return zarrita.slice(pixelWindow.columnStart, pixelWindow.columnStop);
      }
      if (dimensionIndex === yDimensionIndex) {
        return zarrita.slice(pixelWindow.rowStart, pixelWindow.rowStop);
      }
      return selection[dimensionName];
    });
    const chunk = await getCachedZarrSelection(
      array,
      getZarrSelectionKey(zarritaSelection),
      () =>
        zarrita.get(array, zarritaSelection) as Promise<{
          data: SupportedTypedArray;
          shape: number[];
          stride: number[];
        }>,
      parameters.signal
    );
    parameters.signal?.throwIfAborted();
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read GeoZarr raster selection.');
    }

    const width = pixelWindow.columnStop - pixelWindow.columnStart;
    const height = pixelWindow.rowStop - pixelWindow.rowStart;
    const {data: typedData, stride} = cloneZarrSelection(chunk);
    const [columnStride, rowStride] =
      xDimensionIndex < yDimensionIndex ? stride : [stride[1], stride[0]];
    const data = toRowMajorRaster(typedData, width, height, columnStride, rowStride);
    const transform = getPixelWindowTransform(pixelWindow, metadata.transform);

    return {
      data,
      width,
      height,
      bandCount: 1,
      dtype: metadata.dtype,
      interleaved: false,
      noData: metadata.noData,
      bands: metadata.bands,
      boundingBox: getTransformBoundingBox(transform, width, height),
      transform,
      overview,
      crs: metadata.crs,
      metadata: {
        ...metadata.metadata,
        array: metadata.array,
        dimensions: metadata.dimensions,
        selection,
        pixelWindow
      }
    };
  }

  /** Returns the shared initialization request for this source. */
  private async getInitializationPromise(signal?: AbortSignal): Promise<GeoZarrInit> {
    if (!this.initializationPromise) {
      this.initializationPromise = this.initialize(signal);
    }

    const initializationPromise = this.initializationPromise;
    try {
      return await initializationPromise;
    } catch (error) {
      if (this.initializationPromise === initializationPromise) {
        this.initializationPromise = null;
      }
      throw error;
    }
  }

  /** Opens the selected data array and resolves GeoZarr or CF/xarray geospatial metadata. */
  private async initialize(
    signal?: AbortSignal,
    validatedGroup?: zarrita.Group<Readable>,
    levelArrayPath?: string,
    knownLayout?: SpatialMultiscaleLevel[]
  ): Promise<GeoZarrInit> {
    const group = validatedGroup || (await this.openGroup(signal));
    const options = (this.options as GeoZarrLoaderOptions).geozarr;
    const requestedArray = levelArrayPath ?? options?.array;
    if (!requestedArray) {
      throw new Error('GeoZarrRasterSource requires a geozarr.array data-variable path.');
    }

    const groupAttributes = normalizeAttributes(group.attrs);
    const {array, arrayPath} = await openRasterArray(
      group,
      groupAttributes,
      requestedArray,
      signal
    );
    const arrayAttributes = normalizeAttributes(array.attrs);
    let layout =
      knownLayout ??
      getSpatialMultiscaleLevels(groupAttributes, arrayPath, {
        spatialOME: declaresCoordinateReferenceSystem({...groupAttributes, ...arrayAttributes})
      });
    let level = layout.find(candidate => candidate.array === arrayPath);
    const levelGroupAttributes = await loadArrayGroupAttributes(
      group,
      arrayPath,
      level?.group,
      signal
    );
    let gridMappingPromise: Promise<CFGridMapping | null> | undefined;
    /** Shares the CF grid-mapping lookup across the transform and CRS fallbacks. */
    const getGridMapping = () =>
      (gridMappingPromise ||= loadCFGridMapping(
        group,
        arrayPath,
        arrayAttributes.grid_mapping ??
          level?.attributes.grid_mapping ??
          levelGroupAttributes.grid_mapping ??
          groupAttributes.grid_mapping,
        signal
      ));
    if (!layout.length) {
      // A spatial datasets[] layout can declare the CRS only on the selected level's group or
      // grid mapping. Probe these before treating an otherwise native OME pyramid as spatial.
      const omeLayout = getOMELevelsOrEmpty(groupAttributes, arrayPath);
      if (
        omeLayout.length &&
        (declaresCoordinateReferenceSystem(levelGroupAttributes) ||
          getGridMappingCoordinateReferenceSystem((await getGridMapping())?.attributes))
      ) {
        layout = omeLayout;
        level = layout.find(candidate => candidate.array === arrayPath);
      }
    }
    const attributes = {
      ...groupAttributes,
      ...levelGroupAttributes,
      ...level?.attributes,
      ...arrayAttributes
    };
    const coordinateReferenceSystemKeys = ['proj:code', 'proj:wkt2', 'proj:projjson', 'proj:epsg'];
    const coordinateReferenceSystemAttributes = [
      arrayAttributes,
      level?.attributes,
      levelGroupAttributes
    ].find(
      candidate =>
        candidate && coordinateReferenceSystemKeys.some(key => Object.hasOwn(candidate, key))
    );
    if (coordinateReferenceSystemAttributes) {
      for (const key of coordinateReferenceSystemKeys) {
        delete attributes[key];
        if (Object.hasOwn(coordinateReferenceSystemAttributes, key)) {
          attributes[key] = coordinateReferenceSystemAttributes[key];
        }
      }
    }
    if (level) {
      // A root affine does not establish the geometry of each differently sampled child.
      attributes['spatial:transform'] =
        arrayAttributes['spatial:transform'] ??
        level.attributes['spatial:transform'] ??
        levelGroupAttributes['spatial:transform'];
    }
    const dimensions = getDimensionNames(array, attributes);
    const spatialDimensions = getSpatialDimensions(
      dimensions,
      attributes,
      options?.spatialDimensions
    );
    const yDimensionIndex = dimensions.indexOf(spatialDimensions[0]);
    const xDimensionIndex = dimensions.indexOf(spatialDimensions[1]);
    const width = array.shape[xDimensionIndex];
    const height = array.shape[yDimensionIndex];
    const coordinateTransform =
      (!levelArrayPath && options?.transform) ||
      normalizeAffineTransform(attributes['spatial:transform']) ||
      // An ancestor grid mapping can be shared by several multiscale levels: it gives the CRS only.
      normalizeGDALGeoTransform(
        await getGridMapping().then(mapping =>
          mapping?.local ? mapping.attributes.GeoTransform : null
        )
      ) ||
      (await loadCFCoordinateTransform(group, arrayPath, spatialDimensions, signal));
    if (!coordinateTransform) {
      throw new UnsupportedGeoZarrLevelError(
        'GeoZarrRasterSource requires spatial:transform metadata, explicit geozarr.transform, a CF grid-mapping GeoTransform, or regular 1D CF coordinate arrays.'
      );
    }

    const declaredRegistration = normalizeRegistration(attributes['spatial:registration']);
    const transform =
      declaredRegistration === 'node'
        ? convertNodeTransformToPixelTransform(coordinateTransform)
        : coordinateTransform;
    const declaredBoundingBox = normalizeBoundingBox(attributes['spatial:bbox']);
    const boundingBox =
      declaredRegistration === 'pixel' && declaredBoundingBox
        ? toRasterBoundingBox(declaredBoundingBox)
        : getTransformBoundingBox(transform, width, height);
    const coordinateReferenceSystem =
      options?.coordinateReferenceSystem ||
      normalizeDeclaredCoordinateReferenceSystem(attributes) ||
      getGridMappingCoordinateReferenceSystem((await getGridMapping())?.attributes) ||
      getGDALCoordinateReferenceSystem(attributes._CRS) ||
      normalizeString(levelGroupAttributes.crs) ||
      normalizeString(groupAttributes.crs) ||
      inferGeographicCoordinateReferenceSystem(spatialDimensions);
    const defaultSelection = options?.defaultSelection || {};
    const selectionDimensions = dimensions
      .map((dimensionName, dimensionIndex) => ({
        name: dimensionName,
        size: array.shape[dimensionIndex],
        defaultIndex: defaultSelection[dimensionName] ?? 0
      }))
      .filter(dimension => !spatialDimensions.includes(dimension.name));
    normalizeSelection(undefined, selectionDimensions);
    const dtype = normalizeDtype(array.dtype);
    const noData =
      normalizeNumber(attributes._FillValue) ??
      normalizeNumber(attributes.missing_value) ??
      (options?.fillValueAsNoData ? normalizeNumber(array.fillValue) : undefined);
    const metadata: GeoZarrSourceMetadata = {
      name: normalizeString(attributes.long_name) || normalizeString(attributes.title) || arrayPath,
      title: normalizeString(attributes.title) || normalizeString(groupAttributes.title),
      abstract:
        normalizeString(attributes.description) || normalizeString(groupAttributes.description),
      keywords: normalizeStringArray(groupAttributes.keywords),
      attributions: this.options.core?.attributions || [],
      crs: coordinateReferenceSystem,
      boundingBox,
      width,
      height,
      bandCount: 1,
      dtype,
      tileSize: {
        width: array.chunks[xDimensionIndex],
        height: array.chunks[yDimensionIndex]
      },
      noData,
      bands: [{index: 0, dtype, noData}],
      metadata: {
        groupAttributes,
        arrayAttributes,
        sourceTransform: coordinateTransform,
        sourceBoundingBox: declaredBoundingBox
      },
      array: arrayPath,
      dimensions,
      spatialDimensions,
      selectionDimensions,
      transform,
      registration: declaredRegistration
    };

    return {group, array, metadata, xDimensionIndex, yDimensionIndex, layout};
  }
}

/** Opens an explicit array, falling back to the finest advertised level for a variable name. */
async function openRasterArray(
  group: zarrita.Group<Readable>,
  groupAttributes: GeoZarrAttributes,
  requestedArray: string,
  signal?: AbortSignal
): Promise<{array: zarrita.Array<zarrita.DataType, Readable>; arrayPath: string}> {
  try {
    const array = await zarrita.open(group.resolve(requestedArray), {kind: 'array', signal});
    return {array, arrayPath: requestedArray};
  } catch (error) {
    rethrowUnlessAbsent(error);
    let match: {array: zarrita.Array<zarrita.DataType, Readable>; arrayPath: string} | undefined;
    for (const arrayPath of getMultiscaleVariablePaths(groupAttributes, requestedArray)) {
      const array = await zarrita
        .open(group.resolve(arrayPath), {kind: 'array', signal})
        .catch(candidateError => {
          rethrowUnlessAbsent(candidateError);
          return undefined;
        });
      if (array) {
        if (match)
          throw new UnsupportedGeoZarrLevelError(
            `GeoZarr variable ${requestedArray} belongs to more than one multiscale.`
          );
        match = {array, arrayPath};
      }
    }
    if (match) return match;
    throw error;
  }
}

/** Reads enclosing group attributes, including the advertised level group for a nested variable. */
async function loadArrayGroupAttributes(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  levelGroup?: string,
  signal?: AbortSignal
): Promise<GeoZarrAttributes> {
  const parent = arrayPath.slice(0, Math.max(0, arrayPath.lastIndexOf('/')));
  /** Reads the attributes of an explicit group, allowing implicit v2 groups. */
  async function loadGroup(path: string): Promise<GeoZarrAttributes> {
    if (!path) return {};
    try {
      return normalizeAttributes(
        (await zarrita.open(group.resolve(path), {kind: 'group', signal})).attrs
      );
    } catch (error) {
      rethrowUnlessAbsent(error);
      return {};
    }
  }
  return levelGroup && levelGroup !== parent
    ? {...(await loadGroup(levelGroup)), ...(await loadGroup(parent))}
    : await loadGroup(parent);
}

/** Converts arbitrary Zarrita attributes into a plain object. */
function normalizeAttributes(attributes: unknown): GeoZarrAttributes {
  return attributes && typeof attributes === 'object' ? (attributes as GeoZarrAttributes) : {};
}

/** Resolves array dimension names from Zarr v3 or xarray's Zarr v2 convention. */
function getDimensionNames(
  array: zarrita.Array<zarrita.DataType, Readable>,
  attributes: GeoZarrAttributes
): string[] {
  const dimensions = array.dimensionNames?.length
    ? [...array.dimensionNames]
    : normalizeStringArray(attributes._ARRAY_DIMENSIONS);

  if (
    !dimensions ||
    dimensions.length !== array.shape.length ||
    new Set(dimensions).size !== dimensions.length
  ) {
    throw new UnsupportedGeoZarrLevelError(
      'GeoZarrRasterSource requires unique Zarr dimension_names or xarray _ARRAY_DIMENSIONS matching the array shape.'
    );
  }
  return dimensions;
}

/** Resolves logical y/x dimensions from options, GeoZarr metadata, or common CF names. */
function getSpatialDimensions(
  dimensions: string[],
  attributes: GeoZarrAttributes,
  optionDimensions?: [y: string, x: string]
): [y: string, x: string] {
  const declaredDimensions =
    optionDimensions || normalizeSpatialDimensions(attributes['spatial:dimensions']);
  const spatialDimensions = declaredDimensions || [
    findDimension(dimensions, ['y', 'lat', 'latitude']),
    findDimension(dimensions, ['x', 'lon', 'longitude'])
  ];

  if (
    spatialDimensions.length !== 2 ||
    !spatialDimensions[0] ||
    !spatialDimensions[1] ||
    !dimensions.includes(spatialDimensions[0]) ||
    !dimensions.includes(spatialDimensions[1]) ||
    spatialDimensions[0] === spatialDimensions[1]
  ) {
    throw new UnsupportedGeoZarrLevelError(
      'GeoZarrRasterSource could not resolve two spatial dimensions. Set spatial:dimensions or geozarr.spatialDimensions.'
    );
  }

  return spatialDimensions as [string, string];
}

/** Finds the first dimension whose case-insensitive name matches a candidate. */
function findDimension(dimensions: string[], candidates: string[]): string {
  return dimensions.find(dimension => candidates.includes(dimension.toLowerCase())) || '';
}

/** Normalizes a two-string logical spatial-dimension tuple. */
function normalizeSpatialDimensions(value: unknown): [y: string, x: string] | null {
  return Array.isArray(value) && value.length === 2 && value.every(item => typeof item === 'string')
    ? [value[0], value[1]]
    : null;
}

/** Normalizes a six-number affine transform tuple. */
function normalizeAffineTransform(value: unknown): GeoZarrAffineTransform | null {
  return Array.isArray(value) && value.length === 6 && value.every(Number.isFinite)
    ? (value as GeoZarrAffineTransform)
    : null;
}

/** Normalizes a flat four-number bounding box. */
function normalizeBoundingBox(value: unknown): [number, number, number, number] | null {
  return Array.isArray(value) && value.length === 4 && value.every(Number.isFinite)
    ? (value as [number, number, number, number])
    : null;
}

/** Converts a flat `[minimumX, minimumY, maximumX, maximumY]` box to RasterSource form. */
function toRasterBoundingBox(boundingBox: [number, number, number, number]): RasterBoundingBox {
  return [
    [boundingBox[0], boundingBox[1]],
    [boundingBox[2], boundingBox[3]]
  ];
}

/** Normalizes GeoZarr grid registration. */
function normalizeRegistration(value: unknown): 'pixel' | 'node' {
  return value === 'node' ? 'node' : 'pixel';
}

/** Converts a node-centered GeoZarr transform to the pixel-corner transform used by RasterSource. */
function convertNodeTransformToPixelTransform(
  transform: GeoZarrAffineTransform
): GeoZarrAffineTransform {
  const [scaleX, rotationX, translateX, rotationY, scaleY, translateY] = transform;
  return [
    scaleX,
    rotationX,
    translateX - (scaleX + rotationX) / 2,
    rotationY,
    scaleY,
    translateY - (rotationY + scaleY) / 2
  ];
}

/** Loads regular one-dimensional CF coordinate variables and derives a pixel-corner transform. */
async function loadCFCoordinateTransform(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  spatialDimensions: [y: string, x: string],
  signal?: AbortSignal
): Promise<GeoZarrAffineTransform | null> {
  let coordinates: [number[], number[]];
  try {
    coordinates = await Promise.all([
      loadCoordinateValues(group, arrayPath, spatialDimensions[0], signal),
      loadCoordinateValues(group, arrayPath, spatialDimensions[1], signal)
    ]);
  } catch (error) {
    rethrowUnlessAbsent(error);
    return null;
  }
  const [yCoordinates, xCoordinates] = coordinates;
  try {
    const scaleX = getRegularCoordinateSpacing(xCoordinates, spatialDimensions[1]);
    const scaleY = getRegularCoordinateSpacing(yCoordinates, spatialDimensions[0]);
    return [scaleX, 0, xCoordinates[0] - scaleX / 2, 0, scaleY, yCoordinates[0] - scaleY / 2];
  } catch {
    // Irregular coordinates give no affine transform.
    return null;
  }
}

/** Loads all values from one one-dimensional coordinate variable. */
async function loadCoordinateValues(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  coordinateName: string,
  signal?: AbortSignal
): Promise<number[]> {
  const {array: coordinateArray} = await openNearestArray(group, arrayPath, coordinateName, signal);
  if (coordinateArray.shape.length !== 1 || coordinateArray.shape[0] < 2) {
    throw new UnsupportedGeoZarrLevelError(
      `Coordinate ${coordinateName} must be a one-dimensional array with at least two values.`
    );
  }
  const coordinateChunk = await zarrita.get(coordinateArray, [null], {signal});
  if (!coordinateChunk || typeof coordinateChunk !== 'object' || !('data' in coordinateChunk)) {
    throw new UnsupportedGeoZarrLevelError(`Could not read coordinate ${coordinateName}.`);
  }
  return Array.from(coordinateChunk.data as ArrayLike<number>);
}

/**
 * Opens a CF variable referenced by name from a data array, searching the array's own group and
 * then each ancestor up to the selected group, as CF 1.8 search by proximity specifies. `local`
 * is true when the variable is in the array's own group.
 */
async function openNearestArray(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  name: string,
  signal?: AbortSignal
): Promise<{array: zarrita.Array<zarrita.DataType, Readable>; local: boolean}> {
  const segments = arrayPath.split('/').slice(0, -1);
  let lastError: unknown;
  for (let depth = segments.length; depth >= 0; depth--) {
    const path = [...segments.slice(0, depth), name].join('/');
    try {
      const array = await zarrita.open(group.resolve(path), {kind: 'array', signal});
      return {array, local: depth === segments.length};
    } catch (error) {
      // Only an absent variable continues the search. A local variable that exists but cannot be
      // read must fail, not be replaced by an ancestor of the same name.
      if (!zarrita.isZarritaError(error, 'NotFoundError')) {
        throw error;
      }
      lastError = error;
    }
  }
  throw lastError;
}

/** Validates that coordinate values are finite and regularly spaced. */
function getRegularCoordinateSpacing(coordinates: number[], coordinateName: string): number {
  const spacing = (coordinates.at(-1)! - coordinates[0]) / (coordinates.length - 1);
  if (!Number.isFinite(spacing) || spacing === 0) {
    throw new UnsupportedGeoZarrLevelError(`Coordinate ${coordinateName} does not have finite non-zero spacing.`);
  }

  const tolerance = Math.max(Math.abs(spacing) * 1e-6, Number.EPSILON);
  for (let index = 0; index < coordinates.length; index++) {
    const expectedCoordinate = coordinates[0] + spacing * index;
    if (
      !Number.isFinite(coordinates[index]) ||
      Math.abs(coordinates[index] - expectedCoordinate) > tolerance
    ) {
      throw new UnsupportedGeoZarrLevelError(`Coordinate ${coordinateName} is not regularly spaced.`);
    }
  }
  return spacing;
}

/** Attributes of a CF grid-mapping variable, and whether it is in the data array's own group. */
type CFGridMapping = {attributes: GeoZarrAttributes; local: boolean};

/** Loads the named CF grid mapping, or tries an implicit sibling `spatial_ref` mapping. */
async function loadCFGridMapping(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  gridMapping: unknown,
  signal?: AbortSignal
): Promise<CFGridMapping | null> {
  const gridMappingName = normalizeString(gridMapping)?.trim().split(/[\s:]/, 1)[0];
  if (gridMappingName) {
    try {
      const {array, local} = await openNearestArray(group, arrayPath, gridMappingName, signal);
      return {attributes: normalizeAttributes(array.attrs), local};
    } catch (error) {
      rethrowUnlessAbsent(error);
    }
  }
  if (gridMappingName === 'spatial_ref') return null;
  const siblingPath = `${arrayPath.slice(0, arrayPath.lastIndexOf('/') + 1)}spatial_ref`;
  try {
    const array = await zarrita.open(group.resolve(siblingPath), {kind: 'array', signal});
    return {attributes: normalizeAttributes(array.attrs), local: true};
  } catch (error) {
    rethrowUnlessAbsent(error);
    return null;
  }
}

/**
 * Rethrows every error except an absent node. An absent CF variable means "no georeference"; a
 * variable that exists but cannot be read must fail, not give a plausible but wrong result.
 */
function rethrowUnlessAbsent(error: unknown): void {
  if (!zarrita.isZarritaError(error, 'NotFoundError')) {
    throw error;
  }
}

/**
 * Rethrows sibling-level errors that may succeed on a later request. A missing level, metadata
 * that does not parse (for example an HTML fallback page) and unsupported geometry are permanent,
 * so the level is advertised without geometry instead.
 */
function rethrowRetryableLevelError(error: unknown): void {
  if (
    !(error instanceof UnsupportedGeoZarrLevelError) &&
    !zarrita.isZarritaError(error, 'NotFoundError') &&
    !zarrita.isZarritaError(error, 'InvalidMetadataError')
  ) {
    throw error;
  }
}

/** Reads the CRS definition carried by a CF grid-mapping variable. */
function getGridMappingCoordinateReferenceSystem(
  attributes?: GeoZarrAttributes
): string | undefined {
  return (
    normalizeString(attributes?.crs_wkt) ||
    normalizeString(attributes?.spatial_ref) ||
    normalizeString(attributes?.['proj:wkt2']) ||
    normalizeString(attributes?.['proj:code'])
  );
}

/** Infers WGS84 from longitude and latitude dimension names. */
function inferGeographicCoordinateReferenceSystem(
  spatialDimensions: [y: string, x: string]
): string | undefined {
  const normalizedDimensions = spatialDimensions.map(dimension => dimension.toLowerCase());
  if (
    ['lat', 'latitude'].includes(normalizedDimensions[0]) &&
    ['lon', 'longitude'].includes(normalizedDimensions[1])
  ) {
    return 'EPSG:4326';
  }
  return undefined;
}

/**
 * Reads a GDAL `GeoTransform` (`originX pixelWidth rotationX originY rotationY pixelHeight`, a
 * pixel-corner affine) from a CF grid-mapping variable, as written by GDAL and rioxarray.
 */
function normalizeGDALGeoTransform(value: unknown): GeoZarrAffineTransform | null {
  const coefficients = typeof value === 'string' ? value.trim().split(/\s+/).map(Number) : value;
  if (
    !Array.isArray(coefficients) ||
    coefficients.length !== 6 ||
    coefficients.some(
      coefficient => typeof coefficient !== 'number' || !Number.isFinite(coefficient)
    )
  ) {
    return null;
  }
  const [originX, pixelWidth, rotationX, originY, rotationY, pixelHeight] =
    coefficients as number[];
  if (pixelWidth === 0 || pixelHeight === 0) return null;
  return [pixelWidth, rotationX, originX, rotationY, pixelHeight, originY];
}

/**
 * OME-NGFF levels read as spatial levels, or none. Native OME metadata that is not valid as
 * spatial levels stays native: this probe must not make an existing microscopy store fail.
 */
function getOMELevelsOrEmpty(attributes: GeoZarrAttributes, arrayPath: string) {
  try {
    return getSpatialMultiscaleLevels(attributes, arrayPath, {spatialOME: true});
  } catch {
    return [];
  }
}

/** Whether attributes declare a GeoZarr CRS, a CF grid mapping, a GDAL CRS, or a group CRS. */
function declaresCoordinateReferenceSystem(attributes: GeoZarrAttributes): boolean {
  return Boolean(
    normalizeDeclaredCoordinateReferenceSystem(attributes) ||
      normalizeString(attributes.grid_mapping) ||
      normalizeString(attributes.crs) ||
      getGDALCoordinateReferenceSystem(attributes._CRS)
  );
}

/**
 * Reads the `_CRS` attribute that the GDAL Zarr driver writes: an object with `wkt`, `projjson`
 * and `url` members. Prefers WKT, then an EPSG code from an OGC definition URL, then PROJJSON.
 */
function getGDALCoordinateReferenceSystem(value: unknown): CRSDefinition | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const {wkt, url, projjson} = value as {wkt?: unknown; url?: unknown; projjson?: unknown};
  const wellKnownText = normalizeString(wkt);
  if (wellKnownText) {
    return wellKnownText;
  }
  const code = normalizeString(url)?.match(/\/def\/crs\/EPSG\/[^/]+\/(\d+)\/?$/i)?.[1];
  if (code) {
    return `EPSG:${code}`;
  }
  return projjson && typeof projjson === 'object' && !Array.isArray(projjson)
    ? (projjson as CRSDefinition)
    : undefined;
}

/** Largest axis-aligned pixel size, or infinity for a grid unsuitable for overview selection. */
function getPixelSize(transform: GeoZarrAffineTransform): number {
  const [scaleX, rotationX, , rotationY, scaleY] = transform;
  return rotationX === 0 && rotationY === 0 && scaleX !== 0 && scaleY !== 0
    ? Math.max(Math.abs(scaleX), Math.abs(scaleY))
    : Infinity;
}

/** Tests whether the same named indices can address the source and a sibling level. */
function haveMatchingSelections(
  selected: GeoZarrSourceMetadata,
  level: GeoZarrSourceMetadata
): boolean {
  return (
    selected.selectionDimensions.length === level.selectionDimensions.length &&
    selected.selectionDimensions.every(dimension =>
      level.selectionDimensions.some(
        candidate => candidate.name === dimension.name && candidate.size === dimension.size
      )
    )
  );
}

/**
 * Whether a level's cell size relative to the selected level matches its OME-NGFF scale relative
 * to the selected level. The OME frame may differ from the CRS frame, so only ratios are compared.
 */
function isConsistentOMELevel(
  scale: Readonly<Record<string, number>>,
  selectedScale: Readonly<Record<string, number>>,
  level: Pick<GeoZarrSourceMetadata, 'transform'>,
  selected: Pick<GeoZarrSourceMetadata, 'transform' | 'spatialDimensions'>
): boolean {
  return selected.spatialDimensions.every((dimension, index) => {
    const coefficient = index === 0 ? 4 : 0;
    const expected = Math.abs(scale[dimension] / selectedScale[dimension]);
    const actual = Math.abs(level.transform[coefficient] / selected.transform[coefficient]);
    return Number.isFinite(expected) && Math.abs(actual - expected) <= expected * 1e-6;
  });
}

/** Computes a bounding box from all four transformed raster corners. */
function getTransformBoundingBox(
  transform: GeoZarrAffineTransform,
  width: number,
  height: number
): RasterBoundingBox {
  const corners = [
    transformPosition(transform, 0, 0),
    transformPosition(transform, width, 0),
    transformPosition(transform, 0, height),
    transformPosition(transform, width, height)
  ];
  const xCoordinates = corners.map(position => position[0]);
  const yCoordinates = corners.map(position => position[1]);
  return [
    [Math.min(...xCoordinates), Math.min(...yCoordinates)],
    [Math.max(...xCoordinates), Math.max(...yCoordinates)]
  ];
}

/** Applies an affine transform to one column/row position. */
function transformPosition(
  transform: GeoZarrAffineTransform,
  column: number,
  row: number
): [x: number, y: number] {
  const [scaleX, rotationX, translateX, rotationY, scaleY, translateY] = transform;
  return [
    scaleX * column + rotationX * row + translateX,
    rotationY * column + scaleY * row + translateY
  ];
}

/** Tests containment, allowing one overview pixel per edge for rounded level dimensions. */
function containsBoundingBox(
  outer: RasterBoundingBox | undefined,
  inner: RasterBoundingBox,
  toleranceX: number,
  toleranceY: number
): boolean {
  const overlap = intersectBoundingBoxes(inner, outer);
  return (
    overlap !== null &&
    overlap[0][0] - inner[0][0] <= toleranceX &&
    overlap[0][1] - inner[0][1] <= toleranceY &&
    inner[1][0] - overlap[1][0] <= toleranceX &&
    inner[1][1] - overlap[1][1] <= toleranceY
  );
}

/** Intersects two source-coordinate bounding boxes. */
function intersectBoundingBoxes(
  leftBoundingBox: RasterBoundingBox,
  rightBoundingBox?: RasterBoundingBox
): RasterBoundingBox | null {
  if (!rightBoundingBox) {
    return null;
  }
  const minimumX = Math.max(leftBoundingBox[0][0], rightBoundingBox[0][0]);
  const minimumY = Math.max(leftBoundingBox[0][1], rightBoundingBox[0][1]);
  const maximumX = Math.min(leftBoundingBox[1][0], rightBoundingBox[1][0]);
  const maximumY = Math.min(leftBoundingBox[1][1], rightBoundingBox[1][1]);
  return maximumX > minimumX && maximumY > minimumY
    ? [
        [minimumX, minimumY],
        [maximumX, maximumY]
      ]
    : null;
}

/** Converts an axis-aligned source bounding box into a clipped integer pixel window. */
function getPixelWindow(
  boundingBox: RasterBoundingBox,
  metadata: GeoZarrSourceMetadata
): PixelWindow {
  const [scaleX, rotationX, translateX, rotationY, scaleY, translateY] = metadata.transform;
  if (rotationX !== 0 || rotationY !== 0) {
    throw new Error('GeoZarrRasterSource does not yet support rotated affine window reads.');
  }

  const columnCoordinates = [
    (boundingBox[0][0] - translateX) / scaleX,
    (boundingBox[1][0] - translateX) / scaleX
  ];
  const rowCoordinates = [
    (boundingBox[0][1] - translateY) / scaleY,
    (boundingBox[1][1] - translateY) / scaleY
  ];
  return {
    columnStart: clamp(Math.floor(Math.min(...columnCoordinates)), 0, metadata.width),
    columnStop: clamp(Math.ceil(Math.max(...columnCoordinates)), 0, metadata.width),
    rowStart: clamp(Math.floor(Math.min(...rowCoordinates)), 0, metadata.height),
    rowStop: clamp(Math.ceil(Math.max(...rowCoordinates)), 0, metadata.height)
  };
}

/** Moves the selected level's affine origin to the first pixel in the window. */
function getPixelWindowTransform(
  pixelWindow: PixelWindow,
  transform: GeoZarrAffineTransform
): GeoZarrAffineTransform {
  const [originX, originY] = transformPosition(
    transform,
    pixelWindow.columnStart,
    pixelWindow.rowStart
  );
  return [transform[0], transform[1], originX, transform[3], transform[4], originY];
}

/** Normalizes and validates indices for all non-spatial dimensions. */
function normalizeSelection(
  requestedSelection: Record<string, number> | undefined,
  dimensions: GeoZarrSelectionDimension[]
): Record<string, number> {
  const knownDimensions = new Set(dimensions.map(dimension => dimension.name));
  for (const requestedDimension of Object.keys(requestedSelection || {})) {
    if (!knownDimensions.has(requestedDimension)) {
      throw new Error(`Unknown GeoZarr selection dimension ${requestedDimension}.`);
    }
  }

  return Object.fromEntries(
    dimensions.map(dimension => {
      const index = requestedSelection?.[dimension.name] ?? dimension.defaultIndex;
      if (!Number.isInteger(index) || index < 0 || index >= dimension.size) {
        throw new UnsupportedGeoZarrLevelError(
          `GeoZarr ${dimension.name} index ${index} is out of bounds for dimension size ${dimension.size}.`
        );
      }
      return [dimension.name, index];
    })
  );
}

/** Packs a strided 2D array into contiguous raster rows. */
function toRowMajorRaster(
  source: SupportedTypedArray,
  width: number,
  height: number,
  columnStride: number,
  rowStride: number
): SupportedTypedArray {
  if (columnStride === 1 && rowStride === width) return source;
  const TypedArrayConstructor = source.constructor as new (length: number) => SupportedTypedArray;
  const target = new TypedArrayConstructor(source.length);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      target[row * width + column] = source[row * rowStride + column * columnStride];
    }
  }
  return target;
}

/** Pads edge chunks and records validity using the common raw raster sample rules. */
function padRasterTile(
  raster: GeoZarrRasterWindow,
  width: number,
  height: number
): Pick<RasterData, 'data' | 'validityMasks'> {
  const padded = raster.width !== width || raster.height !== height;
  const TypedArrayConstructor = getTypedArrayConstructor(raster.dtype);
  const data = padded
    ? new TypedArrayConstructor(width * height).fill(raster.noData ?? 0)
    : raster.data;
  if (!padded && raster.noData == null && raster.dtype !== 'float32' && raster.dtype !== 'float64') {
    return {data};
  }
  const mask = new Uint8Array(width * height);
  for (let row = 0; row < raster.height; row++) {
    const rowOffset = row * width;
    if (padded) {
      data.set(raster.data.subarray(row * raster.width, (row + 1) * raster.width), rowOffset);
    }
    for (let column = 0; column < raster.width; column++) {
      mask[rowOffset + column] = isRasterSampleValid(raster, column, row, 0) ? 1 : 0;
    }
  }
  return {data, validityMasks: [{data: mask, width, height}]};
}

/** Creates a zero-sized raster for a viewport outside the source extent. */
function createEmptyRaster(
  metadata: GeoZarrSourceMetadata,
  boundingBox: RasterBoundingBox,
  overview: number
): RasterData {
  const TypedArrayConstructor = getTypedArrayConstructor(metadata.dtype);
  return {
    data: new TypedArrayConstructor(0),
    width: 0,
    height: 0,
    bandCount: 1,
    dtype: metadata.dtype,
    interleaved: false,
    noData: metadata.noData,
    bands: metadata.bands,
    boundingBox,
    crs: metadata.crs,
    overview,
    metadata: {...metadata.metadata, array: metadata.array}
  };
}

/** Converts a Zarrita dtype into the raster-source dtype union. */
function normalizeDtype(dtype: string): RasterChannelDataType {
  switch (dtype) {
    case 'uint8':
    case 'uint16':
    case 'uint32':
    case 'int8':
    case 'int16':
    case 'int32':
    case 'float32':
    case 'float64':
      return dtype;
    default:
      throw new UnsupportedGeoZarrLevelError(`GeoZarr dtype ${dtype} is not currently supported.`);
  }
}

/** Returns the typed-array constructor represented by a raster dtype. */
function getTypedArrayConstructor(
  dtype: RasterChannelDataType
): new (
  length: number
) => SupportedTypedArray {
  switch (dtype) {
    case 'uint8':
      return Uint8Array;
    case 'uint16':
      return Uint16Array;
    case 'uint32':
      return Uint32Array;
    case 'int8':
      return Int8Array;
    case 'int16':
      return Int16Array;
    case 'int32':
      return Int32Array;
    case 'float32':
      return Float32Array;
    case 'float64':
      return Float64Array;
    default:
      throw new Error(`Unsupported GeoZarr dtype ${dtype}.`);
  }
}

/** Returns a finite number or `undefined`. */
function normalizeNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

/** Returns a non-empty string or `undefined`. */
function normalizeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length ? value : undefined;
}

/** Returns a string array or `undefined`. */
function normalizeStringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(item => typeof item === 'string')
    ? [...value]
    : undefined;
}

/** Clamps a number to an inclusive range. */
function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

/** Describes spatial storage chunks only when the affine is axis aligned and rightward. */
function getSpatialChunkMatrix(
  id: string,
  metadata?: GeoZarrLevelMetadata['metadata']
): TileGridMatrix {
  if (!metadata) return {id};
  const {transform, tileSize, width, height} = metadata;
  const [scaleX, rotationX, translateX, rotationY, scaleY, translateY] = transform;
  if (
    rotationX !== 0 ||
    rotationY !== 0 ||
    scaleX <= 0 ||
    scaleY === 0 ||
    !transform.every(Number.isFinite) ||
    !tileSize ||
    !width ||
    !height
  ) {
    return {id};
  }
  return {
    id,
    resolution: scaleX,
    resolutionY: Math.abs(scaleY),
    origin: [translateX, translateY],
    cornerOfOrigin: scaleY < 0 ? 'topLeft' : 'bottomLeft',
    tileSize: [tileSize.width, tileSize.height],
    matrixSize: [Math.ceil(width / tileSize.width), Math.ceil(height / tileSize.height)]
  };
}

/** Retains declared CRS definitions without resolving them, and normalizes numeric EPSG identifiers. */
function normalizeDeclaredCoordinateReferenceSystem(
  attributes: GeoZarrAttributes
): CRSDefinition | undefined {
  const wellKnownText = normalizeString(attributes['proj:wkt2']);
  if (wellKnownText) return wellKnownText;
  const code = normalizeString(attributes['proj:code']);
  if (code) return code;
  const epsg = attributes['proj:epsg'];
  if (typeof epsg === 'number' && Number.isSafeInteger(epsg) && epsg > 0) return `EPSG:${epsg}`;
  const projection = attributes['proj:projjson'];
  return projection && typeof projection === 'object' && !Array.isArray(projection)
    ? (projection as CRSDefinition)
    : undefined;
}

/** Compares CRS definitions by value, so equal PROJJSON objects from separate levels match. */
function isSameCRS(first: unknown, second: unknown): boolean {
  if (first === second) {
    return true;
  }
  return (
    typeof first === 'object' &&
    typeof second === 'object' &&
    first !== null &&
    second !== null &&
    JSON.stringify(first) === JSON.stringify(second)
  );
}
