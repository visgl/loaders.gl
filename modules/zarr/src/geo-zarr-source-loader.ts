// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as zarrita from 'zarrita';
import type {Readable} from 'zarrita';
import type {
  CoreAPI,
  GetRasterParameters,
  RasterBoundingBox,
  RasterChannelDataType,
  RasterData,
  RasterSource,
  RasterSourceMetadata,
  SourceLoader
} from '@loaders.gl/loader-utils';
import {getRasterViewportBoundingBox} from '@loaders.gl/loader-utils';

import type {SupportedTypedArray} from './types';
import {
  ZarrSource,
  type ZarrSourceLoaderOptions
} from './ome-zarr-source-loader';
import {getCachedZarrSelection, getZarrSelectionKey} from './lib/zarr-data-cache';

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

/** Normalized metadata exposed by {@link GeoZarrRasterSource}. */
export type GeoZarrSourceMetadata = RasterSourceMetadata & {
  /** Data-array path relative to the selected Zarr group. */
  array: string;
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
    /** Explicit coordinate reference system identifier or WKT. */
    coordinateReferenceSystem?: string;
    /** Default indices for non-spatial dimensions such as `time` or `level`. */
    defaultSelection?: Record<string, number>;
  };
};

/** Parameters used to request a native-resolution spatial window from a GeoZarr array. */
export type GetGeoZarrParameters = Omit<GetRasterParameters, 'bands' | 'interleaved'>;

type GeoZarrAttributes = Record<string, unknown>;

type GeoZarrInit = {
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
export const GeoZarrSourceLoader = {
  dataType: null as unknown as GeoZarrRasterSource,
  /** Runtime source type marker used by `createDataSource()` type inference. */
  dataSource: null as unknown as GeoZarrRasterSource,
  batchType: null as never,
  name: 'GeoZarrSourceLoader',
  id: 'geozarr',
  module: 'zarr',
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
  implements RasterSource<RasterData, GetGeoZarrParameters, GeoZarrSourceMetadata>
{
  /** Shared source initialization request. */
  private initializationPromise: Promise<GeoZarrInit> | null = null;

  /** Creates a GeoZarr raster source. */
  constructor(data: string, options: GeoZarrSourceLoaderOptions, coreApi?: CoreAPI) {
    super(data, options, coreApi);
  }

  /** Returns normalized geospatial, array, and selectable-dimension metadata. */
  async getMetadata(): Promise<GeoZarrSourceMetadata> {
    const {metadata} = await this.getInitializationPromise();
    return metadata;
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
      throw new Error('GeoZarrRasterSource currently supports native nearest-neighbor windows only.');
    }

    const clippedBoundingBox = intersectBoundingBoxes(
      requestedBoundingBox,
      metadata.boundingBox
    );
    if (!clippedBoundingBox) {
      return createEmptyRaster(metadata, requestedBoundingBox);
    }

    const pixelWindow = getPixelWindow(clippedBoundingBox, metadata);
    if (pixelWindow.columnStart === pixelWindow.columnStop || pixelWindow.rowStart === pixelWindow.rowStop) {
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
    const chunk = await getCachedZarrSelection(array, getZarrSelectionKey(zarritaSelection), () =>
      zarrita.get(array, zarritaSelection, {signal: parameters.signal}) as Promise<{
        data: SupportedTypedArray;
        shape: number[];
      }>
    );
    if (!chunk || typeof chunk !== 'object' || !('data' in chunk) || !('shape' in chunk)) {
      throw new Error('Failed to read GeoZarr raster selection.');
    }

    const width = pixelWindow.columnStop - pixelWindow.columnStart;
    const height = pixelWindow.rowStop - pixelWindow.rowStart;
    const typedData = chunk.data as SupportedTypedArray;
    const data = xDimensionIndex < yDimensionIndex
      ? transposeRaster(typedData, width, height)
      : typedData;
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
  private async initialize(signal?: AbortSignal): Promise<GeoZarrInit> {
    const group = await this.openGroup(signal);
    const options = (this.options as GeoZarrSourceLoaderOptions).geozarr;
    const arrayPath = options?.array;
    if (!arrayPath) {
      throw new Error('GeoZarrRasterSource requires a geozarr.array data-variable path.');
    }

    const array = await zarrita.open(group.resolve(arrayPath), {kind: 'array', signal});
    const groupAttributes = normalizeAttributes(group.attrs);
    const arrayAttributes = normalizeAttributes(array.attrs);
    const attributes = {...groupAttributes, ...arrayAttributes};
    const dimensions = getDimensionNames(array, attributes);
    const spatialDimensions = getSpatialDimensions(dimensions, attributes, options?.spatialDimensions);
    const yDimensionIndex = dimensions.indexOf(spatialDimensions[0]);
    const xDimensionIndex = dimensions.indexOf(spatialDimensions[1]);
    const width = array.shape[xDimensionIndex];
    const height = array.shape[yDimensionIndex];
    const coordinateTransform =
      options?.transform ||
      normalizeAffineTransform(attributes['spatial:transform']) ||
      (await loadCFCoordinateTransform(group, spatialDimensions, signal));
    if (!coordinateTransform) {
      throw new Error(
        'GeoZarrRasterSource requires spatial:transform metadata, explicit geozarr.transform, or regular 1D CF coordinate arrays.'
      );
    }

    const declaredRegistration = normalizeRegistration(attributes['spatial:registration']);
    const transform = declaredRegistration === 'node'
      ? convertNodeTransformToPixelTransform(coordinateTransform)
      : coordinateTransform;
    const declaredBoundingBox = normalizeBoundingBox(attributes['spatial:bbox']);
    const boundingBox =
      declaredRegistration === 'pixel' && declaredBoundingBox
        ? toRasterBoundingBox(declaredBoundingBox)
        : getTransformBoundingBox(transform, width, height);
    const coordinateReferenceSystem =
      options?.coordinateReferenceSystem ||
      normalizeString(attributes['proj:wkt2']) ||
      normalizeString(attributes['proj:code']) ||
      (await loadCFCoordinateReferenceSystem(group, attributes, spatialDimensions, signal));
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
    const noData = normalizeNumber(attributes._FillValue) ?? normalizeNumber(attributes.missing_value);
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

    return {array, metadata, xDimensionIndex, yDimensionIndex};
  }
}

/** Converts arbitrary Zarrita attributes into a plain object. */
function normalizeAttributes(attributes: unknown): GeoZarrAttributes {
  return attributes && typeof attributes === 'object'
    ? (attributes as GeoZarrAttributes)
    : {};
}

/** Resolves array dimension names from Zarr v3 or xarray's Zarr v2 convention. */
function getDimensionNames(
  array: zarrita.Array<zarrita.DataType, Readable>,
  attributes: GeoZarrAttributes
): string[] {
  const dimensions = array.dimensionNames?.length
    ? [...array.dimensionNames]
    : normalizeStringArray(attributes._ARRAY_DIMENSIONS);

  if (!dimensions || dimensions.length !== array.shape.length || new Set(dimensions).size !== dimensions.length) {
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
  const declaredDimensions = optionDimensions || normalizeSpatialDimensions(attributes['spatial:dimensions']);
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
function toRasterBoundingBox(
  boundingBox: [number, number, number, number]
): RasterBoundingBox {
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
  spatialDimensions: [y: string, x: string],
  signal?: AbortSignal
): Promise<GeoZarrAffineTransform | null> {
  try {
    const [yCoordinates, xCoordinates] = await Promise.all([
      loadCoordinateValues(group, spatialDimensions[0], signal),
      loadCoordinateValues(group, spatialDimensions[1], signal)
    ]);
    const scaleX = getRegularCoordinateSpacing(xCoordinates, spatialDimensions[1]);
    const scaleY = getRegularCoordinateSpacing(yCoordinates, spatialDimensions[0]);
    return [
      scaleX,
      0,
      xCoordinates[0] - scaleX / 2,
      0,
      scaleY,
      yCoordinates[0] - scaleY / 2
    ];
  } catch {
    return null;
  }
}

/** Loads all values from one one-dimensional coordinate variable. */
async function loadCoordinateValues(
  group: zarrita.Group<Readable>,
  coordinateName: string,
  signal?: AbortSignal
): Promise<number[]> {
  const coordinateArray = await zarrita.open(group.resolve(coordinateName), {kind: 'array', signal});
  if (coordinateArray.shape.length !== 1 || coordinateArray.shape[0] < 2) {
    throw new Error(`Coordinate ${coordinateName} must be a one-dimensional array with at least two values.`);
  }
  const coordinateChunk = await zarrita.get(coordinateArray, [null], {signal});
  if (!coordinateChunk || typeof coordinateChunk !== 'object' || !('data' in coordinateChunk)) {
    throw new Error(`Could not read coordinate ${coordinateName}.`);
  }
  return Array.from(coordinateChunk.data as ArrayLike<number>);
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
    if (!Number.isFinite(coordinates[index]) || Math.abs(coordinates[index] - expectedCoordinate) > tolerance) {
      throw new Error(`Coordinate ${coordinateName} is not regularly spaced.`);
    }
  }
  return spacing;
}

/** Resolves CRS metadata from a CF grid-mapping variable or longitude/latitude dimensions. */
async function loadCFCoordinateReferenceSystem(
  group: zarrita.Group<Readable>,
  attributes: GeoZarrAttributes,
  spatialDimensions: [y: string, x: string],
  signal?: AbortSignal
): Promise<string | undefined> {
  const gridMapping = normalizeString(attributes.grid_mapping);
  if (gridMapping) {
    const gridMappingName = gridMapping.trim().split(/[\s:]/, 1)[0];
    try {
      const gridMappingArray = await zarrita.open(group.resolve(gridMappingName), {
        kind: 'array',
        signal
      });
      const gridMappingAttributes = normalizeAttributes(gridMappingArray.attrs);
      const coordinateReferenceSystem =
        normalizeString(gridMappingAttributes.crs_wkt) ||
        normalizeString(gridMappingAttributes.spatial_ref) ||
        normalizeString(gridMappingAttributes['proj:wkt2']) ||
        normalizeString(gridMappingAttributes['proj:code']);
      if (coordinateReferenceSystem) {
        return coordinateReferenceSystem;
      }
    } catch {
      // Fall through to the common longitude/latitude CRS below.
    }
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
    ? [[minimumX, minimumY], [maximumX, maximumY]]
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
): new (length: number) => SupportedTypedArray {
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
