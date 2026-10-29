// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {
  TileGridMatrix,
  CoreAPI,
  GetRasterParameters,
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
  getRasterViewportBoundingBox
} from '@loaders.gl/core/loader-utils';

import {getSpatialMultiscaleLevels} from './lib/spatial-multiscales';
import type {SupportedTypedArray} from './types';
import {ZarrSource, type ZarrSourceLoaderOptions} from './ome-zarr-source-loader';
import {
  cloneZarrSelection,
  getCachedZarrSelection,
  getZarrSelectionKey
} from './lib/zarr-data-cache';

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
  metadata?: Omit<GeoZarrSourceMetadata, 'levels' | 'tileGrid'>;
};

/** Normalized metadata exposed by {@link GeoZarrRasterSource}. */
export type GeoZarrSourceMetadata = RasterSourceMetadata & {
  /** Data-array path relative to the selected Zarr group. */
  array: string;
  /** Advertised spatial multiscales; reads still use the selected `array`. */
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

/** Options for {@link GeoZarrSourceLoader}. */
export type GeoZarrSourceLoaderOptions = ZarrSourceLoaderOptions & {
  /** GeoZarr and CF data-variable options. */
  geozarr?: {
    /** Data-array path relative to `zarr.path`. */
    array?: string;
    /** Explicit logical `[y, x]` dimension names. */
    spatialDimensions?: [y: string, x: string];
    /** Explicit affine transform when the store does not provide one. */
    transform?: GeoZarrAffineTransform;
    /** Explicit coordinate reference system definition or identifier. */
    coordinateReferenceSystem?: CRSDefinition;
    /** Default indices for non-spatial dimensions such as `time` or `level`. */
    defaultSelection?: Record<string, number>;
  };
};

/** Parameters used to request a native-resolution spatial window from a GeoZarr array. */
export type GetGeoZarrParameters = Omit<GetRasterParameters, 'bands' | 'interleaved'>;

type GeoZarrAttributes = Record<string, unknown>;

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
};

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

/** Source factory for GeoZarr and regular CF/xarray Zarr raster arrays. */
export const GeoZarrSourceLoaderWithParser = {
  dataType: null as unknown as GeoZarrRasterSource,
  /** Runtime source type marker used by `createDataSource()` type inference. */
  dataSource: null as unknown as GeoZarrRasterSource,
  batchType: null as never,
  name: 'GeoZarrSourceLoader',
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
      defaultSelection: undefined!
    }
  } as GeoZarrSourceLoaderOptions,

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
      defaultSelection: undefined!
    }
  },

  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  createDataSource: (
    data: string,
    options: GeoZarrSourceLoaderOptions,
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

  /** Shared metadata-only multiscale discovery request. */
  private metadataPromise: Promise<GeoZarrSourceMetadata> | null = null;

  /** Creates a GeoZarr raster source. */
  constructor(data: string, options: GeoZarrSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, coreApi);
  }

  /** Returns normalized geospatial, array, and selectable-dimension metadata. */
  async getMetadata(): Promise<GeoZarrSourceMetadata> {
    if (!this.metadataPromise) {
      this.metadataPromise = this.loadGridMetadata().catch(error => {
        this.metadataPromise = null;
        throw error;
      });
    }
    return await this.metadataPromise;
  }

  /** Opens sibling array metadata without selecting or decoding their samples. */
  private async loadGridMetadata(): Promise<GeoZarrSourceMetadata> {
    const {metadata, group} = await this.getInitializationPromise();
    const groupAttributes = metadata.metadata?.groupAttributes as GeoZarrAttributes;
    const arrayAttributes = metadata.metadata?.arrayAttributes as GeoZarrAttributes;
    const layout = getSpatialMultiscaleLevels(groupAttributes, metadata.array, {
      spatialOME: declaresCoordinateReferenceSystem({...groupAttributes, ...arrayAttributes})
    });
    const levels: GeoZarrLevelMetadata[] = [];
    for (const level of layout) {
      if (level.array === metadata.array) {
        levels.push({id: level.id, array: level.array, metadata});
        continue;
      }
      const options = this.options as GeoZarrSourceLoaderOptions;
      const source = new GeoZarrRasterSource(
        this.data,
        {
          ...options,
          geozarr: {...options.geozarr, array: level.array, transform: undefined}
        },
        this.hasCoreApi ? this.coreApi : undefined
      );
      try {
        const initialization = await source.initialize(undefined, true, group);
        levels.push({id: level.id, array: level.array, metadata: initialization.metadata});
      } catch {
        // Unsupported siblings remain advertised; never publish a complete set with missing levels.
        levels.push({id: level.id, array: level.array});
      }
    }
    const selectedScale = layout.find(level => level.array === metadata.array)?.scale;
    if (selectedScale) {
      for (const [index, level] of levels.entries()) {
        const scale = layout[index].scale!;
        if (level.metadata && !isConsistentOMELevel(scale, selectedScale, level.metadata, metadata)) {
          delete level.metadata;
        }
      }
    }
    const normalizedLevels = levels.length
      ? levels
      : [{id: metadata.array, array: metadata.array, metadata}];
    const matrices = normalizedLevels.map(level => getSpatialChunkMatrix(level.id, level.metadata));
    const commonCoordinateReferenceSystem =
      typeof metadata.crs === 'string' &&
      normalizedLevels.every(level => level.metadata?.crs === metadata.crs)
        ? metadata.crs
        : undefined;
    return {
      ...metadata,
      ...(levels.length ? {levels} : {}),
      tileGrid: createTileGrid(commonCoordinateReferenceSystem, matrices)
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

  /** Loads a clipped native-resolution 2D window for the requested viewport and named selection. */
  async getRaster(parameters: GetGeoZarrParameters): Promise<RasterData> {
    const initialization = await this.getInitializationPromise(parameters.signal);
    const {array, metadata, xDimensionIndex, yDimensionIndex} = initialization;
    const requestedBoundingBox = getRasterViewportBoundingBox(parameters.viewport);
    const viewportCoordinateReferenceSystem = parameters.viewport.crs;

    if (
      metadata.crs &&
      viewportCoordinateReferenceSystem &&
      metadata.crs !== viewportCoordinateReferenceSystem
    ) {
      throw new Error(
        `GeoZarrRasterSource does not support reprojection. Requested ${viewportCoordinateReferenceSystem}, source ${metadata.crs}.`
      );
    }
    if (parameters.resampleMethod === 'bilinear') {
      throw new Error(
        'GeoZarrRasterSource currently supports native nearest-neighbor windows only.'
      );
    }

    const clippedBoundingBox = intersectBoundingBoxes(requestedBoundingBox, metadata.boundingBox);
    if (!clippedBoundingBox) {
      return createEmptyRaster(metadata, requestedBoundingBox);
    }

    const pixelWindow = getPixelWindow(clippedBoundingBox, metadata);
    if (
      pixelWindow.columnStart === pixelWindow.columnStop ||
      pixelWindow.rowStart === pixelWindow.rowStop
    ) {
      return createEmptyRaster(metadata, clippedBoundingBox);
    }

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
        }>,
      parameters.signal
    );
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read GeoZarr raster selection.');
    }

    const width = pixelWindow.columnStop - pixelWindow.columnStart;
    const height = pixelWindow.rowStop - pixelWindow.rowStart;
    const typedData = cloneZarrSelection(chunk).data as SupportedTypedArray;
    const data =
      xDimensionIndex < yDimensionIndex ? transposeRaster(typedData, width, height) : typedData;
    const outputBoundingBox = getPixelWindowBoundingBox(pixelWindow, metadata.transform);

    return {
      data,
      width,
      height,
      bandCount: 1,
      dtype: metadata.dtype,
      interleaved: false,
      noData: metadata.noData,
      boundingBox: outputBoundingBox,
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
    metadataOnly = false,
    validatedGroup?: zarrita.Group<Readable>
  ): Promise<GeoZarrInit> {
    const group = validatedGroup || await this.openGroup(signal);
    const options = (this.options as GeoZarrSourceLoaderOptions).geozarr;
    const arrayPath = options?.array;
    if (!arrayPath) {
      throw new Error('GeoZarrRasterSource requires a geozarr.array data-variable path.');
    }

    const array = await zarrita.open(group.resolve(arrayPath), {kind: 'array', signal});
    const groupAttributes = normalizeAttributes(group.attrs);
    const arrayAttributes = normalizeAttributes(array.attrs);
    const layout = getSpatialMultiscaleLevels(groupAttributes, arrayPath, {
      spatialOME: declaresCoordinateReferenceSystem({...groupAttributes, ...arrayAttributes})
    });
    const level = layout.find(candidate => candidate.array === arrayPath);
    const levelGroupAttributes = level?.group
      ? normalizeAttributes(
          (await zarrita.open(group.resolve(level.group), {kind: 'group', signal})).attrs
        )
      : {};
    const attributes = {
      ...groupAttributes,
      ...levelGroupAttributes,
      ...level?.attributes,
      ...arrayAttributes
    };
    const coordinateReferenceSystemKeys = ['proj:code', 'proj:wkt2', 'proj:projjson', 'proj:epsg'];
    const coordinateReferenceSystemAttributes = [
      arrayAttributes, level?.attributes, levelGroupAttributes
    ].find(candidate => candidate &&
      coordinateReferenceSystemKeys.some(key => Object.hasOwn(candidate, key)));
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
    let gridMappingPromise: Promise<GeoZarrAttributes | null> | undefined;
    const getGridMappingAttributes = () =>
      (gridMappingPromise ||= loadCFGridMappingAttributes(group, arrayPath, attributes, signal));
    const coordinateTransform =
      options?.transform ||
      normalizeAffineTransform(attributes['spatial:transform']) ||
      normalizeGDALGeoTransform((await getGridMappingAttributes())?.GeoTransform) ||
      (!metadataOnly
        ? await loadCFCoordinateTransform(group, arrayPath, spatialDimensions, signal)
        : null);
    if (!coordinateTransform) {
      throw new Error(
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
      getCFCoordinateReferenceSystem(await getGridMappingAttributes(), spatialDimensions);
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
      normalizeNumber(attributes._FillValue) ?? normalizeNumber(attributes.missing_value);
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

    return {group, array, metadata, xDimensionIndex, yDimensionIndex};
  }
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
    throw new Error(
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
    throw new Error(
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
  try {
    const [yCoordinates, xCoordinates] = await Promise.all([
      loadCoordinateValues(group, arrayPath, spatialDimensions[0], signal),
      loadCoordinateValues(group, arrayPath, spatialDimensions[1], signal)
    ]);
    const scaleX = getRegularCoordinateSpacing(xCoordinates, spatialDimensions[1]);
    const scaleY = getRegularCoordinateSpacing(yCoordinates, spatialDimensions[0]);
    return [scaleX, 0, xCoordinates[0] - scaleX / 2, 0, scaleY, yCoordinates[0] - scaleY / 2];
  } catch {
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
  const coordinateArray = await openNearestArray(group, arrayPath, coordinateName, signal);
  if (coordinateArray.shape.length !== 1 || coordinateArray.shape[0] < 2) {
    throw new Error(
      `Coordinate ${coordinateName} must be a one-dimensional array with at least two values.`
    );
  }
  const coordinateChunk = await zarrita.get(coordinateArray, [null], {signal});
  if (!coordinateChunk || typeof coordinateChunk !== 'object' || !('data' in coordinateChunk)) {
    throw new Error(`Could not read coordinate ${coordinateName}.`);
  }
  return Array.from(coordinateChunk.data as ArrayLike<number>);
}

/**
 * Opens a CF variable referenced by name from a data array, searching the array's own group and
 * then each ancestor up to the selected group, as CF 1.8 search by proximity specifies.
 */
async function openNearestArray(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  name: string,
  signal?: AbortSignal
): Promise<zarrita.Array<zarrita.DataType, Readable>> {
  const segments = arrayPath.split('/').slice(0, -1);
  let lastError: unknown;
  for (let depth = segments.length; depth >= 0; depth--) {
    const path = [...segments.slice(0, depth), name].join('/');
    try {
      return await zarrita.open(group.resolve(path), {kind: 'array', signal});
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

/** Validates that coordinate values are finite and regularly spaced. */
function getRegularCoordinateSpacing(coordinates: number[], coordinateName: string): number {
  const spacing = (coordinates.at(-1)! - coordinates[0]) / (coordinates.length - 1);
  if (!Number.isFinite(spacing) || spacing === 0) {
    throw new Error(`Coordinate ${coordinateName} does not have finite non-zero spacing.`);
  }

  const tolerance = Math.max(Math.abs(spacing) * 1e-6, Number.EPSILON);
  for (let index = 0; index < coordinates.length; index++) {
    const expectedCoordinate = coordinates[0] + spacing * index;
    if (
      !Number.isFinite(coordinates[index]) ||
      Math.abs(coordinates[index] - expectedCoordinate) > tolerance
    ) {
      throw new Error(`Coordinate ${coordinateName} is not regularly spaced.`);
    }
  }
  return spacing;
}

/** Loads the attributes of the CF grid-mapping variable named by a data array, if any. */
async function loadCFGridMappingAttributes(
  group: zarrita.Group<Readable>,
  arrayPath: string,
  attributes: GeoZarrAttributes,
  signal?: AbortSignal
): Promise<GeoZarrAttributes | null> {
  const gridMapping = normalizeString(attributes.grid_mapping);
  if (!gridMapping) return null;
  const gridMappingName = gridMapping.trim().split(/[\s:]/, 1)[0];
  try {
    const gridMappingArray = await openNearestArray(group, arrayPath, gridMappingName, signal);
    return normalizeAttributes(gridMappingArray.attrs);
  } catch {
    return null;
  }
}

/** Resolves CRS metadata from CF grid-mapping attributes or longitude/latitude dimensions. */
function getCFCoordinateReferenceSystem(
  gridMappingAttributes: GeoZarrAttributes | null,
  spatialDimensions: [y: string, x: string]
): string | undefined {
  const coordinateReferenceSystem =
    gridMappingAttributes &&
    (normalizeString(gridMappingAttributes.crs_wkt) ||
      normalizeString(gridMappingAttributes.spatial_ref) ||
      normalizeString(gridMappingAttributes['proj:wkt2']) ||
      normalizeString(gridMappingAttributes['proj:code']));
  if (coordinateReferenceSystem) {
    return coordinateReferenceSystem;
  }

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
    !Array.isArray(coefficients) || coefficients.length !== 6 ||
    coefficients.some(coefficient => typeof coefficient !== 'number' || !Number.isFinite(coefficient))
  ) {
    return null;
  }
  const [originX, pixelWidth, rotationX, originY, rotationY, pixelHeight] = coefficients as number[];
  if (pixelWidth === 0 || pixelHeight === 0) return null;
  return [pixelWidth, rotationX, originX, rotationY, pixelHeight, originY];
}

/** Whether attributes declare a CRS through GeoZarr `proj:*` metadata or a CF grid mapping. */
function declaresCoordinateReferenceSystem(attributes: GeoZarrAttributes): boolean {
  return Boolean(
    normalizeDeclaredCoordinateReferenceSystem(attributes) || normalizeString(attributes.grid_mapping)
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

/** Computes exact source bounds for an integer pixel window. */
function getPixelWindowBoundingBox(
  pixelWindow: PixelWindow,
  transform: GeoZarrAffineTransform
): RasterBoundingBox {
  return getTransformBoundingBox(
    [
      transform[0],
      transform[1],
      transformPosition(transform, pixelWindow.columnStart, pixelWindow.rowStart)[0],
      transform[3],
      transform[4],
      transformPosition(transform, pixelWindow.columnStart, pixelWindow.rowStart)[1]
    ],
    pixelWindow.columnStop - pixelWindow.columnStart,
    pixelWindow.rowStop - pixelWindow.rowStart
  );
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
        throw new Error(
          `GeoZarr ${dimension.name} index ${index} is out of bounds for dimension size ${dimension.size}.`
        );
      }
      return [dimension.name, index];
    })
  );
}

/** Transposes a C-order 2D raster whose physical dimensions are `[x, y]`. */
function transposeRaster(
  source: SupportedTypedArray,
  width: number,
  height: number
): SupportedTypedArray {
  const TypedArrayConstructor = source.constructor as new (length: number) => SupportedTypedArray;
  const target = new TypedArrayConstructor(source.length);
  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      target[row * width + column] = source[column * height + row];
    }
  }
  return target;
}

/** Creates a zero-sized raster for a viewport outside the source extent. */
function createEmptyRaster(
  metadata: GeoZarrSourceMetadata,
  boundingBox: RasterBoundingBox
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
    boundingBox,
    crs: metadata.crs,
    metadata: metadata.metadata
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
      throw new Error(`GeoZarr dtype ${dtype} is not currently supported.`);
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
  metadata?: Omit<GeoZarrSourceMetadata, 'levels' | 'tileGrid'>
): TileGridMatrix {
  if (!metadata) return {id};
  const {transform, tileSize, width, height} = metadata;
  const [scaleX, rotationX, translateX, rotationY, scaleY, translateY] = transform;
  if (
    rotationX !== 0 || rotationY !== 0 || scaleX <= 0 || scaleY === 0 ||
    !transform.every(Number.isFinite) || !tileSize || !width || !height
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
    ? projection as CRSDefinition
    : undefined;
}
