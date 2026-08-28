// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import type {
  CoreAPI,
  DataSourceOptions,
  GetFeaturesParameters,
  ScanColumnRole,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SpatialReference,
  SourceLoader,
  TableQueryExplain,
  VectorSource,
  VectorSourceData,
  VectorSourceLayer,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  createSpatialReference,
  DataSource,
  explainTableQuery
} from '@loaders.gl/loader-utils';
import {FlatGeobufFormat} from './flatgeobuf-format';
import {
  makeArrowSchema,
  parseFlatGeobuf,
  queryFlatGeobufArrowTable,
  type FlatGeobufQueryOptions
} from './lib/parse-flatgeobuf';
import {
  getFlatGeobufCRSIdentifier,
  readFlatGeobufHeader,
  type FlatGeobufHeader
} from './lib/flatgeobuf-reader';
import {FLATGEOBUF_TABLE_QUERY_CAPABILITIES} from './flatgeobuf-table-query-capabilities';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

type FlatGeobufResponseFormat = 'geojson' | 'binary' | 'arrow';

/** Options for `FlatGeobufSourceLoader`. */
export type FlatGeobufSourceLoaderOptions = DataSourceOptions & {flatgeobuf?: {format?: FlatGeobufResponseFormat}};

/** Portable query options accepted by `FlatGeobufVectorSource.query()`. */
export type FlatGeobufReadOptions = FlatGeobufQueryOptions;

/** Footer-free explanation of a FlatGeobuf portable query. */
export type FlatGeobufSourceExplain = TableQueryExplain &
  Readonly<{
    /** Source discriminator for format-specific explain consumers. */
    source: 'flatgeobuf';
    /** Packed R-tree bounds planning performed before feature decoding. */
    spatial: Readonly<{
      /** Whether the query requests a bounding box. */
      enabled: boolean;
      /** FlatGeobuf packed R-tree support for bounding boxes. */
      support: 'pushdown';
      /** Requested bounds in the source coordinate reference system. */
      bounds?: Readonly<{
        minimum: readonly [number, number];
        maximum: readonly [number, number];
      }>;
    }>;
  }>;

type HeaderInfo = {
  arrayBuffer: ArrayBuffer;
  header: FlatGeobufHeader;
  schema: Schema;
  querySchema: Schema;
  metadata: VectorSourceMetadata;
  layerName: string;
};
type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

/** Incrementally loads indexed FlatGeobuf data sources. */
export const FlatGeobufSourceLoader = {
  dataType: null as unknown as FlatGeobufVectorSource,
  batchType: null as never,
  ...FlatGeobufFormat,
  version: VERSION,
  type: 'flatgeobuf',
  fromUrl: true,
  fromBlob: false,
  options: {flatgeobuf: {format: 'arrow'}},
  defaultOptions: {flatgeobuf: {format: 'arrow'}},
  testURL: (url: string): boolean => /\.fgb($|[?#])/i.test(url),
  createDataSource: (url: string, options: FlatGeobufSourceLoaderOptions, coreApi?: CoreAPI): FlatGeobufVectorSource => new FlatGeobufVectorSource(url, options, coreApi)
} as const satisfies SourceLoader<FlatGeobufVectorSource>;

/** Runtime vector source backed by FlatGeobuf HTTP data. */
export class FlatGeobufVectorSource extends DataSource<string, FlatGeobufSourceLoaderOptions> implements VectorSource {
  /** Conservative table-query capabilities; bounding-box pruning is format-specific. */
  readonly tableQueryCapabilities = FLATGEOBUF_TABLE_QUERY_CAPABILITIES;
  /** Shared header and dataset promise for this URL. */
  protected headerInfoPromise: Promise<HeaderInfo> | null = null;

  /** Creates a vector source from a FlatGeobuf URL. */
  constructor(data: string, options: FlatGeobufSourceLoaderOptions, coreApi?: CoreAPI) { super(data, options, FlatGeobufSourceLoader.defaultOptions, coreApi); }

  /** Returns the property schema declared by the dataset header. */
  async getSchema(): Promise<Schema> { return (await this.getHeaderInfo()).schema; }

  /** Returns normalized FlatGeobuf source metadata. */
  async getMetadata(options: {formatSpecificMetadata?: boolean} = {}): Promise<VectorSourceMetadata> {
    const info = await this.getHeaderInfo();
    return options.formatSpecificMetadata ? {...info.metadata, formatSpecificMetadata: serializeHeader(info.header)} : info.metadata;
  }

  /** Discovers query-visible columns, spatial bounds, and capabilities without decoding features. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    assertNotAborted(options.signal);
    const info = await this.getHeaderInfo();
    assertNotAborted(options.signal);
    return createScanQueryMetadata({
      sourceType: 'flatgeobuf',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      name: info.layerName,
      description: info.header.description,
      schema: info.querySchema,
      columnRoles: getColumnRoles(info.header),
      capabilities: {table: this.tableQueryCapabilities, bounds: 'pushdown'},
      spatial: {
        bounds: getScanBoundsFromHeader(info.header),
        coordinateReferenceSystems: getLayerCrs(info.header),
        spatialReference: getFlatGeobufSpatialReference(info.header)
      },
      statistics: {rowCount: info.header.featuresCount}
    });
  }

  /** Explains relational and packed R-tree work without decoding feature rows. */
  async explain(options: FlatGeobufReadOptions = {}): Promise<FlatGeobufSourceExplain> {
    assertNotAborted(options.signal);
    const info = await this.getHeaderInfo();
    assertNotAborted(options.signal);
    const sourceColumnNames = info.querySchema.fields.map(field => field.name);
    const explanation = explainTableQuery(
      sourceColumnNames,
      {columns: options.columns, predicate: options.predicate, limit: options.limit},
      this.tableQueryCapabilities
    );
    const bounds = options.boundingBox
      ? Object.freeze({
          minimum: Object.freeze([...options.boundingBox[0]]) as readonly [number, number],
          maximum: Object.freeze([...options.boundingBox[1]]) as readonly [number, number]
        })
      : undefined;
    return Object.freeze({
      ...explanation,
      source: 'flatgeobuf' as const,
      spatial: Object.freeze({
        enabled: Boolean(bounds),
        support: 'pushdown' as const,
        bounds
      })
    });
  }

  /** Returns features in the requested format for one bounding box. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    assertNotAborted(parameters.signal);
    const info = await this.getHeaderInfo();
    assertNotAborted(parameters.signal);
    const format = parameters.format || this.options.flatgeobuf?.format || 'arrow';
    return parseFlatGeobuf(info.arrayBuffer, {shape: format === 'arrow' ? 'arrow-table' : format === 'binary' ? 'binary-geometry' : 'geojson-table', boundingBox: parameters.boundingBox, crs: parameters.crs || 'WGS84', reproject: Boolean(parameters.crs)}) as VectorSourceData;
  }

  /** Executes a spatially pruned FlatGeobuf query and returns an Arrow table. */
  async query(options: FlatGeobufReadOptions = {}): Promise<ArrowTable> {
    assertNotAborted(options.signal);
    const info = await this.getHeaderInfo();
    assertNotAborted(options.signal);
    return queryFlatGeobufArrowTable(info.arrayBuffer, options);
  }

  /** Streams one stable-schema Arrow batch for a portable FlatGeobuf query. */
  async *read(options: FlatGeobufReadOptions = {}): AsyncIterable<ArrowTableBatch> {
    const table = await this.query(options);
    yield {
      shape: 'arrow-table',
      batchType: 'data',
      length: table.data.numRows,
      schema: table.schema,
      data: table.data
    };
  }

  protected getHeaderInfo(): Promise<HeaderInfo> { this.headerInfoPromise ||= loadHeaderInfo(this.url, this.fetch); return this.headerInfoPromise; }
}

async function loadHeaderInfo(url: string, fetch: FetchLike): Promise<HeaderInfo> {
  const response = await fetch(url);
  if (!response.ok && response.status !== 0) throw new Error(`Unable to load FlatGeobuf source: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const header = readFlatGeobufHeader(arrayBuffer);
  const layerName = inferLayerName(url, header);
  const querySchema = makeArrowSchema(header);
  return {arrayBuffer, header, schema: {...querySchema, fields: querySchema.fields.slice(0, -1)}, querySchema, layerName, metadata: buildMetadata(layerName, header)};
}

function buildMetadata(layerName: string, header: FlatGeobufHeader): VectorSourceMetadata {
  const layer: VectorSourceLayer = {
    name: layerName,
    title: header.title || layerName,
    crs: getLayerCrs(header),
    spatialReference: getFlatGeobufSpatialReference(header),
    boundingBox: getBoundingBoxFromHeader(header)
  };
  return {name: layerName, title: header.title || layerName, abstract: header.description, keywords: [], layers: [layer]};
}

function inferLayerName(url: string, header: FlatGeobufHeader): string { if (header.title) return header.title; const fileName = url.split(/[?#]/)[0].split('/').pop() || 'flatgeobuf'; return fileName.replace(/\.fgb$/i, '') || 'flatgeobuf'; }
function getLayerCrs(header: FlatGeobufHeader): string[] | undefined { const values = [getFlatGeobufCRSIdentifier(header.crs), header.crs?.wkt].filter(Boolean).map(String); return values.length ? values : undefined; }
/** Normalize FlatGeobuf header CRS fields without discarding their original representations. */
function getFlatGeobufSpatialReference(header: FlatGeobufHeader): SpatialReference {
  const identifier = getFlatGeobufCRSIdentifier(header.crs);
  const wkt = header.crs?.wkt;
  if (wkt) {
    return createSpatialReference({
      crs: {
        state: 'explicit',
        definition: wkt,
        representation: 'wkt',
        provenance: 'metadata',
        alternatives: identifier
          ? [{definition: identifier, representation: 'identifier'}]
          : undefined
      },
      coordinateOrder: header.hasZ ? ['x', 'y', 'z'] : ['x', 'y']
    });
  }
  if (identifier) {
    return createSpatialReference({
      crs: {
        state: 'explicit',
        definition: identifier,
        representation: 'identifier',
        provenance: 'metadata'
      },
      coordinateOrder: header.hasZ ? ['x', 'y', 'z'] : ['x', 'y']
    });
  }
  return createSpatialReference({
    crs: {
      state: header.crs ? 'unknown' : 'absent',
      provenance: header.crs ? 'metadata' : 'unknown'
    },
    coordinateOrder: header.hasZ ? ['x', 'y', 'z'] : ['x', 'y']
  });
}
function getBoundingBoxFromHeader(header: FlatGeobufHeader): [[number, number], [number, number]] | undefined { const envelope = header.envelope; return envelope && envelope.length >= 4 ? [[envelope[0], envelope[1]], [envelope[2], envelope[3]]] : undefined; }
function getScanBoundsFromHeader(header: FlatGeobufHeader): {minimum: [number, number]; maximum: [number, number]} | undefined { const boundingBox = getBoundingBoxFromHeader(header); return boundingBox ? {minimum: boundingBox[0], maximum: boundingBox[1]} : undefined; }
function getColumnRoles(header: FlatGeobufHeader): Record<string, ScanColumnRole> { const roles: Record<string, ScanColumnRole> = {geometry: 'geometry'}; for (const column of header.columns) if (column.primaryKey) roles[column.name] = 'identifier'; return roles; }
function serializeHeader(header: FlatGeobufHeader): Record<string, unknown> { return {...header, envelope: header.envelope ? Array.from(header.envelope) : undefined}; }
function assertNotAborted(signal?: AbortSignal): void { if (signal?.aborted) { const error = new Error('Aborted'); error.name = 'AbortError'; throw error; } }
