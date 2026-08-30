// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI} from '@loaders.gl/loader-utils';
import {
  OMEZarrImageSource,
  OMEZarrSourceLoader,
  type ZarrSourceLoader,
  type ZarrSourceLoaderOptions,
  ZarrSource
} from './ome-zarr-source-loader';
import {ZarrArraySource, type ZarrArraySourceLoaderOptions} from './zarr-array-source';
import type {ZarrConsolidatedMetadata} from './lib/consolidated-zarr';

/** SpatialData element families stored below a container root. */
export type SpatialDataElementKind = 'image' | 'labels' | 'points' | 'shapes' | 'table';

/** Storage convention used by one SpatialData element. */
export type SpatialDataElementFormat =
  | 'ome-zarr'
  | 'parquet-dataset'
  | 'geoparquet'
  | 'anndata-zarr';

/** A normalized SpatialData element discovered without reading its payload. */
export type SpatialDataElementMetadata = Readonly<{
  /** Element family. */
  kind: SpatialDataElementKind;
  /** Element name within its family namespace. */
  name: string;
  /** Zarr group path relative to the SpatialData root. */
  path: string;
  /** URL of the element group or its external table payload. */
  url: string;
  /** Storage convention used to open the element. */
  format: SpatialDataElementFormat;
  /** SpatialData element encoding version when declared. */
  version?: string;
  /** Named element axes when declared. */
  axes?: readonly string[];
  /** Coordinate transformations retained in their interoperable NGFF representation. */
  coordinateTransformations?: readonly unknown[];
  /** Original group attributes for application-specific extensions. */
  attributes: Readonly<Record<string, unknown>>;
}>;

/** Normalized metadata for a SpatialData container. */
export type SpatialDataSourceMetadata = Readonly<{
  /** SpatialData container format version. */
  version?: string;
  /** Every discovered element in stable namespace and name order. */
  elements: readonly SpatialDataElementMetadata[];
  /** Image elements. */
  images: readonly SpatialDataElementMetadata[];
  /** Label raster elements. */
  labels: readonly SpatialDataElementMetadata[];
  /** Point-table elements. */
  points: readonly SpatialDataElementMetadata[];
  /** Shape-table elements. */
  shapes: readonly SpatialDataElementMetadata[];
  /** AnnData table elements. */
  tables: readonly SpatialDataElementMetadata[];
  /** Original root attributes. */
  attributes: Readonly<Record<string, unknown>>;
}>;

/** Options for {@link SpatialDataSourceLoader}. */
export type SpatialDataSourceLoaderOptions = ZarrSourceLoaderOptions;

/** Runtime source returned for a Zarr-backed SpatialData raster or table array. */
export type SpatialDataZarrElementSource = OMEZarrImageSource | ZarrArraySource;

/** Source loader for SpatialData containers stored as Zarr. */
export const SpatialDataSourceLoader = {
  dataType: null as unknown as SpatialDataSource,
  dataSource: null as unknown as SpatialDataSource,
  batchType: null as never,
  name: 'SpatialDataSourceLoader',
  id: 'spatial-data',
  module: 'zarr',
  version: OMEZarrSourceLoader.version,
  extensions: ['zarr'],
  mimeTypes: [],
  type: 'spatial-data',
  fromUrl: true,
  fromBlob: false,
  options: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    }
  } as SpatialDataSourceLoaderOptions,
  defaultOptions: {
    zarr: {
      metadataPath: 'auto',
      path: null,
      labels: undefined!,
      requireConsolidatedMetadata: true
    }
  },
  testURL: (url: string): boolean => /\.zarr(?:$|[/?#])/i.test(url),
  createDataSource: (
    data: string,
    options: SpatialDataSourceLoaderOptions,
    coreApi?: CoreAPI
  ): SpatialDataSource => new SpatialDataSource(data, options, coreApi)
} as const satisfies ZarrSourceLoader<SpatialDataSource>;

/** Discovers and opens the typed elements of a SpatialData Zarr container. */
export class SpatialDataSource extends ZarrSource {
  /** Shared normalized metadata discovery request. */
  private metadataPromise: Promise<SpatialDataSourceMetadata> | null = null;

  /** Creates a SpatialData container source. */
  constructor(data: string, options: SpatialDataSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(data, options, coreApi);
  }

  /** Discovers images, labels, points, shapes, and tables without reading payload chunks. */
  async getMetadata(signal?: AbortSignal): Promise<SpatialDataSourceMetadata> {
    this.metadataPromise ||= this.discoverMetadata(signal);
    try {
      return await this.metadataPromise;
    } catch (error) {
      this.metadataPromise = null;
      throw error;
    }
  }

  /** Returns one named element, throwing when the kind or name is absent. */
  async getElement(
    kind: SpatialDataElementKind,
    name: string,
    signal?: AbortSignal
  ): Promise<SpatialDataElementMetadata> {
    const metadata = await this.getMetadata(signal);
    const element = metadata.elements.find(candidate => candidate.kind === kind && candidate.name === name);
    if (!element) {
      throw new Error(`SpatialData ${kind} element ${name} is not available.`);
    }
    return element;
  }

  /** Opens an image or label element as an OME-Zarr raster source. */
  async createRasterSource(
    kind: 'image' | 'labels',
    name: string,
    signal?: AbortSignal
  ): Promise<OMEZarrImageSource> {
    const element = await this.getElement(kind, name, signal);
    return new OMEZarrImageSource(
      this.data,
      {
        ...this.options,
        zarr: {...this.options.zarr, path: joinZarrPath(this.path, element.path)}
      },
      this.hasCoreApi ? this.coreApi : undefined
    );
  }

  /** Opens an array below an AnnData table element through the generic Zarr array source. */
  async createTableArraySource(
    name: string,
    arrayPath: string,
    options: ZarrArraySourceLoaderOptions['zarrArray'] = {},
    signal?: AbortSignal
  ): Promise<ZarrArraySource> {
    const element = await this.getElement('table', name, signal);
    const normalizedArrayPath = arrayPath.replace(/^\/+|\/+$/g, '');
    if (!normalizedArrayPath) {
      throw new Error('SpatialData table array path must not be empty.');
    }
    return new ZarrArraySource(
      this.data,
      {
        ...this.options,
        zarr: {...this.options.zarr, path: joinZarrPath(this.path, element.path)},
        zarrArray: {...options, path: normalizedArrayPath}
      },
      this.hasCoreApi ? this.coreApi : undefined
    );
  }

  /** Loads and normalizes the consolidated SpatialData element catalog. */
  private async discoverMetadata(signal?: AbortSignal): Promise<SpatialDataSourceMetadata> {
    const consolidated = await this.getConsolidatedMetadata(signal);
    const spatialDataPath = normalizeZarrPath(this.path);
    const attributes = spatialDataPath
      ? getGroupAttributes(consolidated, spatialDataPath)
      : consolidated.rootAttributes;
    const elements = Object.freeze(
      discoverSpatialDataElements(this.url, consolidated, spatialDataPath)
    );
    const rootSpatialDataAttributes = getObject(attributes.spatialdata_attrs);
    const metadata: SpatialDataSourceMetadata = {
      version: getString(rootSpatialDataAttributes?.version),
      elements,
      images: getElementsByKind(elements, 'image'),
      labels: getElementsByKind(elements, 'labels'),
      points: getElementsByKind(elements, 'points'),
      shapes: getElementsByKind(elements, 'shapes'),
      tables: getElementsByKind(elements, 'table'),
      attributes: Object.freeze({...attributes})
    };
    return Object.freeze(metadata);
  }
}

const SPATIAL_DATA_NAMESPACES = Object.freeze([
  {namespace: 'images', kind: 'image', format: 'ome-zarr'},
  {namespace: 'labels', kind: 'labels', format: 'ome-zarr'},
  {namespace: 'points', kind: 'points', format: 'parquet-dataset'},
  {namespace: 'shapes', kind: 'shapes', format: 'geoparquet'},
  {namespace: 'tables', kind: 'table', format: 'anndata-zarr'}
] as const);

/** Discovers direct element groups beneath every SpatialData namespace. */
function discoverSpatialDataElements(
  rootUrl: string,
  consolidated: ZarrConsolidatedMetadata,
  spatialDataPath: string
): SpatialDataElementMetadata[] {
  const elements: SpatialDataElementMetadata[] = [];
  for (const definition of SPATIAL_DATA_NAMESPACES) {
    const namespacePath = joinZarrPath(spatialDataPath, definition.namespace);
    const paths = getDirectGroupChildren(consolidated, namespacePath);
    for (const fullPath of paths) {
      const name = fullPath.slice(namespacePath.length + 1);
      const path = `${definition.namespace}/${name}`;
      const attributes = getGroupAttributes(consolidated, fullPath);
      const spatialDataAttributes = getObject(attributes.spatialdata_attrs);
      elements.push(
        Object.freeze({
          kind: definition.kind,
          name,
          path,
          url: getElementUrl(rootUrl, fullPath, definition.format),
          format: definition.format,
          version: getString(spatialDataAttributes?.version) || getString(attributes.version),
          axes: getAxes(attributes),
          coordinateTransformations: getCoordinateTransformations(attributes),
          attributes: Object.freeze({...attributes})
        })
      );
    }
  }
  return elements;
}

/** Joins normalized Zarr group paths without introducing a leading slash. */
function joinZarrPath(...paths: Array<string | null>): string {
  return paths.map(normalizeZarrPath).filter(Boolean).join('/');
}

/** Normalizes an optional Zarr group path for consolidated metadata lookups. */
function normalizeZarrPath(path: string | null): string {
  return path?.replace(/^\/+|\/+$/g, '') || '';
}

/** Returns group paths that are direct children of a namespace. */
function getDirectGroupChildren(
  consolidated: ZarrConsolidatedMetadata,
  namespace: string
): string[] {
  const prefix = `${namespace}/`;
  const paths = new Set<string>();
  for (const [metadataPath, value] of Object.entries(consolidated.metadata)) {
    const path = consolidated.format === 'v2'
      ? metadataPath.endsWith('/.zgroup')
        ? metadataPath.slice(0, -8)
        : ''
      : value && typeof value === 'object' && (value as {node_type?: unknown}).node_type === 'group'
        ? metadataPath
        : '';
    if (!path.startsWith(prefix) || path.slice(prefix.length).includes('/')) continue;
    paths.add(path);
  }
  return [...paths].sort();
}

/** Returns normalized group attributes across consolidated Zarr generations. */
function getGroupAttributes(
  consolidated: ZarrConsolidatedMetadata,
  path: string
): Record<string, unknown> {
  if (consolidated.format === 'v2') {
    return {...(getObject(consolidated.metadata[`${path}/.zattrs`]) || {})};
  }
  const node = getObject(consolidated.metadata[path]);
  return {...(getObject(node?.attributes) || {})};
}

/** Returns the external or Zarr URL associated with an element format. */
function getElementUrl(
  rootUrl: string,
  path: string,
  format: SpatialDataElementFormat
): string {
  const baseUrl = `${rootUrl.replace(/\/+$/, '')}/${path}`;
  if (format === 'parquet-dataset') return `${baseUrl}/points.parquet`;
  if (format === 'geoparquet') return `${baseUrl}/shapes.parquet`;
  return baseUrl;
}

/** Extracts axis names from SpatialData or nested OME metadata. */
function getAxes(attributes: Record<string, unknown>): readonly string[] | undefined {
  const directAxes = normalizeAxes(attributes.axes);
  if (directAxes) return Object.freeze(directAxes);
  const ome = getObject(attributes.ome);
  const multiscales = Array.isArray(ome?.multiscales) ? ome.multiscales : [];
  const multiscale = getObject(multiscales[0]);
  const axes = normalizeAxes(multiscale?.axes);
  return axes ? Object.freeze(axes) : undefined;
}

/** Normalizes string and object axis declarations to names. */
function normalizeAxes(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const axes = value
    .map(axis => typeof axis === 'string' ? axis : getString(getObject(axis)?.name))
    .filter((axis): axis is string => Boolean(axis));
  return axes.length ? axes : undefined;
}

/** Extracts coordinate transformations from SpatialData or nested OME metadata. */
function getCoordinateTransformations(
  attributes: Record<string, unknown>
): readonly unknown[] | undefined {
  if (Array.isArray(attributes.coordinateTransformations)) {
    return Object.freeze([...attributes.coordinateTransformations]);
  }
  const ome = getObject(attributes.ome);
  const multiscales = Array.isArray(ome?.multiscales) ? ome.multiscales : [];
  const multiscale = getObject(multiscales[0]);
  return Array.isArray(multiscale?.coordinateTransformations)
    ? Object.freeze([...multiscale.coordinateTransformations])
    : undefined;
}

/** Filters and freezes one SpatialData element family. */
function getElementsByKind(
  elements: readonly SpatialDataElementMetadata[],
  kind: SpatialDataElementKind
): readonly SpatialDataElementMetadata[] {
  return Object.freeze(elements.filter(element => element.kind === kind));
}

/** Narrows an unknown metadata value to an object. */
function getObject(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

/** Narrows an unknown metadata value to a string. */
function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}
