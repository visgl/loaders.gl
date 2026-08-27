// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ArrowTable, ArrowTableBatch} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {
  GetFeaturesParameters,
  GetTileParameters,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  ScanSpatialMetadata,
  TableQueryExplain,
  VectorSource,
  VectorTileSource
} from '@loaders.gl/loader-utils';
import {createScanQueryMetadata} from '@loaders.gl/loader-utils';
import {
  ARROW_TABLE_QUERY_CAPABILITIES,
  explainArrowTableQuery,
  queryArrowTable,
  type ArrowQueryOptions,
  type SQLPredicate
} from '@loaders.gl/sql';

/** Shared display and provenance options for an addressed vector-table scan. */
export type VectorTableScanSourceOptions = Readonly<{
  /** Stable source type reported through query metadata. */
  sourceType?: string;
  /** Optional display name shown by metadata-driven query controls. */
  name?: string;
  /** Optional description of the addressed table view. */
  description?: string;
}>;

/** Options that bind one vector tile before portable table-query planning begins. */
export type VectorTileTableScanSourceOptions = VectorTableScanSourceOptions &
  Readonly<{
    /** Tile address and source-specific layer selection, deliberately outside `TableQuery`. */
    tile: Omit<GetTileParameters, 'signal'>;
  }>;

/** Options that bind one bounded vector-service request before table-query planning begins. */
export type VectorFeatureTableScanSourceOptions = VectorTableScanSourceOptions &
  Readonly<{
    /** Layers, bounds, and output CRS, deliberately outside `TableQuery`. */
    request: Omit<GetFeaturesParameters, 'format' | 'signal'>;
  }>;

/**
 * Base source for a physical vector selection that resolves to one Arrow feature table.
 *
 * The physical address is immutable and owned by a specialized adapter. Portable predicates,
 * projection, ordering, aggregates, and limits are applied only after that selection resolves.
 */
export abstract class AddressedVectorTableScanSource {
  /** Stable adapter type reported by `getQueryMetadata()`. */
  readonly sourceType: string;
  /** Optional display name shown by query controls. */
  readonly name?: string;
  /** Human-readable description of the bound physical selection. */
  readonly description: string;
  /** Spatial extent of the bound physical selection. */
  readonly spatial?: ScanSpatialMetadata;

  private tablePromise: Promise<ArrowTable> | null = null;

  /** Creates a table-scan view over one immutable physical selection. */
  protected constructor(
    options: VectorTableScanSourceOptions,
    defaults: Readonly<{
      sourceType: string;
      description: string;
      spatial?: ScanSpatialMetadata;
    }>
  ) {
    this.sourceType = options.sourceType || defaults.sourceType;
    this.name = options.name;
    this.description = options.description || defaults.description;
    this.spatial = defaults.spatial;
  }

  /** Loads the physically addressed data as one Arrow table. */
  protected abstract loadTable(signal?: AbortSignal): Promise<ArrowTable | null>;

  /** Discovers the addressed result schema and portable residual-query capabilities. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    const table = await this.getTable(options.signal);
    const schema = table.schema || convertArrowToSchema(table.data.schema);
    return createScanQueryMetadata({
      sourceType: this.sourceType,
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      name: this.name,
      description: this.description,
      schema,
      capabilities: {
        table: ARROW_TABLE_QUERY_CAPABILITIES,
        bounds: 'unsupported',
        levelOfDetail: 'unsupported'
      },
      columnRoles: inferVectorColumnRoles(schema.fields.map(field => field.name)),
      spatial: this.spatial,
      statistics: {rowCount: table.data.numRows}
    });
  }

  /** Applies the portable Arrow query to the addressed feature table. */
  async query(options: ArrowQueryOptions = {}): Promise<ArrowTable> {
    const table = await this.getTable(options.signal);
    return queryArrowTable(table, options);
  }

  /** Explains the residual Arrow plan after resolving the addressed feature table. */
  async explain(options: ArrowQueryOptions = {}): Promise<TableQueryExplain<SQLPredicate>> {
    const table = await this.getTable(options.signal);
    return explainArrowTableQuery(table, options);
  }

  /** Emits the portable query result as one bounded Arrow batch. */
  async *read(options: ArrowQueryOptions = {}): AsyncIterableIterator<ArrowTableBatch> {
    const result = await this.query(options);
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema: result.schema,
      data: result.data,
      length: result.data.numRows
    };
  }

  /** Resolves and caches the addressed table while allowing failed loads to be retried. */
  private async getTable(signal?: AbortSignal): Promise<ArrowTable> {
    throwIfAborted(signal);
    if (!this.tablePromise) {
      this.tablePromise = this.loadTable()
        .then(table => {
          if (!table) {
            throw new Error('The addressed vector selection did not return a feature table.');
          }
          if (table.shape !== 'arrow-table') {
            throw new Error(
              'The addressed vector selection must return an Arrow table. Configure the source with shape "arrow-table".'
            );
          }
          return table;
        })
        .catch(error => {
          this.tablePromise = null;
          throw error;
        });
    }
    return await waitForPromise(this.tablePromise, signal);
  }
}

/**
 * Portable table-query view over one explicitly addressed vector tile.
 *
 * MVT and vector PMTiles sources participate when configured to return `shape: 'arrow-table'`.
 * Tile coordinates and layer selection remain source parameters rather than relational operators.
 */
export class VectorTileTableScanSource extends AddressedVectorTableScanSource {
  /** Specialized tile source that owns tile addressing and decoding. */
  readonly source: VectorTileSource;
  /** Immutable tile address bound to this table view. */
  readonly tile: Omit<GetTileParameters, 'signal'>;

  /** Creates a portable table view over one vector tile. */
  constructor(source: VectorTileSource, options: VectorTileTableScanSourceOptions) {
    const tile = Object.freeze({
      ...options.tile,
      layers: cloneAndFreezeLayers(options.tile.layers)
    });
    super(options, {
      sourceType: 'vector-tile-table',
      description: `Vector tile ${tile.z}/${tile.x}/${tile.y}`,
      spatial: {
        bounds: getWGS84TileBounds(tile),
        coordinateReferenceSystems: ['EPSG:4326']
      }
    });
    this.source = source;
    this.tile = tile;
  }

  /** Loads the bound vector tile using the source's requested Arrow output shape. */
  protected loadTable(signal?: AbortSignal): Promise<ArrowTable | null> {
    return this.source.getVectorTile({...this.tile, signal}) as Promise<ArrowTable | null>;
  }
}

/**
 * Portable table-query view over one explicitly bounded vector-service request.
 *
 * WFS and ArcGIS feature sources participate through their existing Arrow feature output. Layers,
 * service bounds, and output CRS remain source parameters rather than relational operators.
 */
export class VectorFeatureTableScanSource extends AddressedVectorTableScanSource {
  /** Specialized vector source that owns service request construction and parsing. */
  readonly source: VectorSource;
  /** Immutable bounded feature request bound to this table view. */
  readonly request: Omit<GetFeaturesParameters, 'format' | 'signal'>;

  /** Creates a portable table view over one bounded vector-service request. */
  constructor(source: VectorSource, options: VectorFeatureTableScanSourceOptions) {
    const request = Object.freeze({
      ...options.request,
      layers: cloneAndFreezeLayers(options.request.layers),
      boundingBox: Object.freeze([
        Object.freeze([...options.request.boundingBox[0]]),
        Object.freeze([...options.request.boundingBox[1]])
      ]) as GetFeaturesParameters['boundingBox']
    });
    const coordinateReferenceSystems = typeof request.crs === 'string' ? [request.crs] : undefined;
    super(options, {
      sourceType: 'vector-feature-table',
      description: `Vector feature request for ${normalizeLayers(request.layers).join(', ')}`,
      spatial: {
        bounds: {
          minimum: Object.freeze([...request.boundingBox[0]]),
          maximum: Object.freeze([...request.boundingBox[1]])
        },
        coordinateReferenceSystems
      }
    });
    this.source = source;
    this.request = request;
  }

  /** Loads the bound service request through the source's Arrow feature output. */
  protected loadTable(signal?: AbortSignal): Promise<ArrowTable | null> {
    return this.source.getFeatures({
      ...this.request,
      format: 'arrow',
      signal
    }) as Promise<ArrowTable | null>;
  }
}

/** Returns the WGS84 extent of one XYZ tile address. */
function getWGS84TileBounds(tile: Pick<GetTileParameters, 'x' | 'y' | 'z'>) {
  const scale = 2 ** tile.z;
  return {
    minimum: [(tile.x / scale) * 360 - 180, tileYToLatitude(tile.y + 1, scale)],
    maximum: [((tile.x + 1) / scale) * 360 - 180, tileYToLatitude(tile.y, scale)]
  };
}

/** Converts one XYZ tile row to its WGS84 latitude edge. */
function tileYToLatitude(tileY: number, scale: number): number {
  return (Math.atan(Math.sinh(Math.PI * (1 - (2 * tileY) / scale))) * 180) / Math.PI;
}

/** Infers the small semantic-role set useful for vector feature query controls. */
function inferVectorColumnRoles(columnNames: readonly string[]) {
  return Object.fromEntries(
    columnNames.map(columnName => [
      columnName,
      columnName.toLowerCase() === 'geometry' ? 'geometry' : 'attribute'
    ])
  ) as Readonly<Record<string, 'geometry' | 'attribute'>>;
}

/** Normalizes a single layer name to the service API's list shape. */
function normalizeLayers(layers: string | string[]): string[] {
  return Array.isArray(layers) ? layers : [layers];
}

/** Clones and freezes a possibly plural layer selection for an immutable physical address. */
function cloneAndFreezeLayers<LayersT extends string | string[] | undefined>(
  layers: LayersT
): LayersT {
  return (Array.isArray(layers) ? Object.freeze([...layers]) : layers) as LayersT;
}

/** Waits for a shared cached load while preserving one caller's independent cancellation. */
async function waitForPromise<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) {
    return await promise;
  }
  throwIfAborted(signal);
  return await new Promise<T>((resolve, reject) => {
    const abort = () => reject(getAbortReason(signal));
    signal.addEventListener('abort', abort, {once: true});
    void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}

/** Throws before physical or residual work begins when cancellation was requested. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw getAbortReason(signal);
  }
}

/** Returns the caller's cancellation reason or a portable AbortError fallback. */
function getAbortReason(signal: AbortSignal): unknown {
  return signal.reason || new DOMException('Request aborted', 'AbortError');
}
