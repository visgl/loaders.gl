// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  GetTileParameters,
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/core/loader-utils';
import {
  getRequestedTileMatrix,
  createScanQueryMetadata,
  DataSource,
  filterColumnarRowIndices,
  makeTableScanBatch,
  validateTableQueryOptions
} from '@loaders.gl/core/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {convertArrowToSchema, queryArrowTable} from '@loaders.gl/schema-utils';
import type {WKTCRSDefinition} from '@math.gl/crs';

import type {GeoPackageLoaderOptions} from './geopackage-loader-types';
import {
  DEFAULT_SQLJS_CDN,
  getGeoPackageArrowSchema,
  getProjections,
  listGeoPackageVectorTables,
  loadGeoPackageDatabase,
  parseGeoPackageToArrow,
  selectGeoPackageVectorTable
} from './lib/parse-geopackage';
import {GeoPackageFormat} from './geopackage-format';
import {listGeoPackageTileTables} from './lib/geopackage-tile-metadata';
import type {GeoPackageTileTableMetadata} from './lib/geopackage-tile-metadata';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export type GeoPackageSourceTableMetadata = {
  /** Query-visible WKB Arrow schema for this feature table. */
  schema: Schema;
  name: string;
  identifier?: string;
  description?: string;
  srsId?: number;
  /** Preferred WKT2 or fallback WKT1 definition for the table SRS. */
  crs?: WKTCRSDefinition;
  geometryColumnName: string;
  geometryTypeName: string;
  bounds?: [[number, number], [number, number]];
  isDefault: boolean;
};

export type GeoPackageSourceMetadata = {
  /** Feature tables available for Arrow reads. */
  tables: GeoPackageSourceTableMetadata[];
  /** Raster tile-table metadata for encoded payload reads. */
  tileTables: GeoPackageTileTableMetadata[];
};

/** Limits applied to one encoded GeoPackage tile read. */
export type GeoPackageTileReadOptions = {
  /** Maximum encoded payload size, default 16 MiB. */
  maxBytes?: number;
};

export type GeoPackageSourceOptions = DataSourceOptions &
  GeoPackageLoaderOptions & {
    geopackage?: GeoPackageLoaderOptions['geopackage'];
    gis?: GeoPackageLoaderOptions['gis'];
  };

/**
 * Source factory for GeoPackage datasets that expose table metadata and one-table Arrow reads.
 */
export const GeoPackageSource = {
  ...GeoPackageFormat,
  dataType: null as unknown as GeoPackageDataSource,
  batchType: null as never,
  name: 'GeoPackageSource',
  version: VERSION,
  type: 'geopackage',
  fromUrl: true,
  fromBlob: true,

  options: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      table: undefined,
      workerUrl: undefined
    },
    gis: {}
  },

  defaultOptions: {
    geopackage: {
      sqlJsCDN: DEFAULT_SQLJS_CDN,
      table: undefined!,
      workerUrl: undefined!
    },
    gis: {}
  },

  testURL: (url: string): boolean => /\.gpkg(?:$|[?#])/i.test(url),
  createDataSource: (
    data: string | Blob,
    options: GeoPackageSourceOptions,
    coreApi?: CoreAPI
  ): GeoPackageDataSource => new GeoPackageDataSource(data, options, coreApi)
} as const satisfies SourceLoader<GeoPackageDataSource>;

/**
 * GeoPackage data source that exposes vector table metadata and Arrow table reads.
 */
export class GeoPackageDataSource
  extends DataSource<string | Blob, GeoPackageSourceOptions>
  implements TableScanSource<ArrowTableBatch>
{
  private arrayBufferPromise: Promise<ArrayBuffer> | null = null;
  private metadataPromise: Promise<GeoPackageSourceMetadata> | null = null;

  constructor(data: string | Blob, options: GeoPackageSourceOptions, coreApi?: CoreAPI) {
    super(data, options, GeoPackageSource.defaultOptions, coreApi);
  }

  /** Returns GeoPackage table metadata and marks the selected default table. */
  async getMetadata(): Promise<GeoPackageSourceMetadata> {
    if (!this.metadataPromise) {
      this.metadataPromise = this.loadMetadata();
    }

    return this.metadataPromise;
  }

  /** Discovers the selected feature table schema and spatial bounds for the shared scan panel. */
  async getQueryMetadata(options: ScanQueryMetadataOptions = {}): Promise<ScanQueryMetadata> {
    throwIfAborted(options.signal);
    const metadata = await this.getMetadata();
    throwIfAborted(options.signal);
    const selectedTable = metadata.tables.find(table => table.isDefault) || metadata.tables[0];
    if (!selectedTable) throw new Error('GeoPackage contains no vector feature tables');
    const fieldNames = new Set(selectedTable.schema.fields.map(field => field.name));
    const geometryColumnName = fieldNames.has('geometry')
      ? 'geometry'
      : fieldNames.has(selectedTable.geometryColumnName)
        ? selectedTable.geometryColumnName
        : undefined;
    return createScanQueryMetadata({
      sourceType: 'geopackage',
      queryType: 'table',
      execution: {status: 'supported', method: 'read'},
      name: selectedTable.identifier || selectedTable.name,
      description: selectedTable.description,
      schema: selectedTable.schema,
      columnRoles: geometryColumnName ? {[geometryColumnName]: 'geometry'} : undefined,
      capabilities: {
        table: {
          projection: 'residual',
          predicate: 'residual',
          limit: 'residual',
          streaming: false,
          cancellation: false
        }
      },
      spatial:
        selectedTable.bounds || selectedTable.crs
          ? {
              bounds: selectedTable.bounds
                ? {minimum: selectedTable.bounds[0], maximum: selectedTable.bounds[1]}
                : undefined,
              coordinateReferenceSystems: selectedTable.crs ? [selectedTable.crs] : undefined
            }
          : undefined,
      statistics: {byteLength: undefined}
    });
  }

  /** Reads one encoded tile from an explicitly selected raster table. Missing tiles return null.
   * The byte limit applies to encoded payloads; opening SQLite still loads the whole GeoPackage.
   */
  async getTile(
    tableName: string,
    parameters: Pick<GetTileParameters, 'z' | 'x' | 'y' | 'tileMatrix' | 'signal'>,
    options: GeoPackageTileReadOptions = {}
  ): Promise<ArrayBuffer | null> {
    throwIfAborted(parameters.signal);
    const maximumBytes = options.maxBytes ?? 16 * 1024 * 1024;
    if (!Number.isSafeInteger(maximumBytes) || maximumBytes < 0) {
      throw new Error('Invalid GeoPackage tile byte limit');
    }
    const metadata = await this.getMetadata();
    throwIfAborted(parameters.signal);
    const table = metadata.tileTables.find(candidate => candidate.name === tableName);
    if (!table) throw new Error('Unknown GeoPackage tile table: ' + tableName);
    const matrix = getRequestedTileMatrix(
      table.tileGrid.matrices || [],
      value => value.id,
      parameters
    );
    if (!matrix) throw new Error('Unknown GeoPackage tile matrix');
    if (![parameters.x, parameters.y].every(value => Number.isSafeInteger(value))) {
      throw new Error('GeoPackage tile coordinates must be integers');
    }
    if (
      parameters.x < 0 ||
      parameters.y < 0 ||
      !matrix.matrixSize ||
      parameters.x >= matrix.matrixSize[0] ||
      parameters.y >= matrix.matrixSize[1]
    )
      return null;
    const database = await loadGeoPackageDatabase(
      await this.getArrayBuffer(),
      this.options.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
    );
    try {
      throwIfAborted(parameters.signal);
      const identifier = '"' + table.name.replaceAll('"', '""') + '"';
      const statement = database.prepare(
        'SELECT length(tile_data) AS size, typeof(tile_data) AS type, ' +
          'CASE WHEN length(tile_data) <= ? THEN tile_data ELSE NULL END AS payload FROM ' +
          identifier +
          ' WHERE zoom_level = ? AND tile_column = ? AND tile_row = ? LIMIT 1'
      );
      try {
        statement.bind([maximumBytes, Number(matrix.id), parameters.x, parameters.y]);
        if (!statement.step()) return null;
        const row = statement.getAsObject();
        if (row.type !== 'blob') throw new Error('Invalid GeoPackage tile payload');
        if (Number(row.size) > maximumBytes) throw new Error('GeoPackage tile exceeds byte limit');
        throwIfAborted(parameters.signal);
        return (row.payload as Uint8Array).slice().buffer;
      } finally {
        statement.free();
      }
    } finally {
      database.close();
    }
  }

  /** Loads one GeoPackage vector table as an Arrow table. */
  async getTable(tableName?: string): Promise<ArrowTable> {
    const arrayBuffer = await this.getArrayBuffer();
    return parseGeoPackageToArrow(arrayBuffer, this.getLoaderOptions(tableName));
  }

  /** Executes projection, residual predicates, and a global limit on the selected feature table. */
  async query(options: TableScanReadOptions = {}): Promise<ArrowTable> {
    throwIfAborted(options.signal);
    const table = await this.getTable();
    throwIfAborted(options.signal);
    return queryGeoPackageTable(table, options);
  }

  /** Executes a common table scan as one bounded Arrow batch. */
  async *read(options: TableScanReadOptions = {}): AsyncIterableIterator<ArrowTableBatch> {
    const table = await this.query(options);
    yield makeTableScanBatch(table);
  }

  private async loadMetadata(): Promise<GeoPackageSourceMetadata> {
    const arrayBuffer = await this.getArrayBuffer();
    const database = await loadGeoPackageDatabase(
      arrayBuffer,
      this.options.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
    );
    try {
      const vectorTables = listGeoPackageVectorTables(database);
      const projections = getProjections(database);
      const defaultTable =
        vectorTables.length || this.options.geopackage?.table
          ? selectGeoPackageVectorTable(vectorTables, this.options.geopackage?.table || undefined)
          : undefined;

      return {
        tileTables: listGeoPackageTileTables(database),
        tables: vectorTables.map(vectorTable => {
          const crs = vectorTable.srsId === undefined ? undefined : projections[vectorTable.srsId];
          return {
            schema: getGeoPackageArrowSchema(database, vectorTable, crs),
            name: vectorTable.name,
            identifier: vectorTable.identifier,
            description: vectorTable.description,
            srsId: vectorTable.srsId,
            crs,
            geometryColumnName: vectorTable.geometryColumnName,
            geometryTypeName: vectorTable.geometryTypeName,
            bounds: vectorTable.bounds
              ? [
                  [vectorTable.bounds.minX, vectorTable.bounds.minY],
                  [vectorTable.bounds.maxX, vectorTable.bounds.maxY]
                ]
              : undefined,
            isDefault: vectorTable.name === defaultTable?.name
          };
        })
      };
    } finally {
      database.close();
    }
  }

  private async getArrayBuffer(): Promise<ArrayBuffer> {
    if (!this.arrayBufferPromise) {
      this.arrayBufferPromise = this.loadArrayBuffer();
    }

    return this.arrayBufferPromise;
  }

  private async loadArrayBuffer(): Promise<ArrayBuffer> {
    try {
      if (typeof this.data === 'string') {
        const response = await this.fetch(this.url);
        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }
        return await response.arrayBuffer();
      }

      return await this.data.arrayBuffer();
    } catch (error) {
      throw this.reportError(error, `Failed to load GeoPackage from ${this.url || 'Blob input'}`);
    }
  }

  private getLoaderOptions(tableName?: string): GeoPackageLoaderOptions {
    const loadOptions = this.loadOptions as GeoPackageLoaderOptions;

    return {
      ...loadOptions,
      geopackage: {
        ...loadOptions.geopackage,
        ...this.options.geopackage,
        sqlJsCDN: this.options.geopackage?.sqlJsCDN ?? loadOptions.geopackage?.sqlJsCDN,
        table: tableName || this.options.geopackage?.table || loadOptions.geopackage?.table
      },
      gis: {
        ...loadOptions.gis,
        ...this.options.gis
      }
    };
  }
}

/** Applies the portable table query to a materialized GeoPackage feature table. */
function queryGeoPackageTable(table: ArrowTable, options: TableScanReadOptions): ArrowTable {
  const availableColumns = table.data.schema.fields.map(field => field.name);
  validateTableQueryOptions(availableColumns, options);
  const queriedTable = queryArrowTable(table, options, (predicate, columns, rowCount) =>
    filterColumnarRowIndices(predicate as never, columns as never, rowCount)
  );
  return {...queriedTable, schema: convertArrowToSchema(queriedTable.data.schema)};
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
}
