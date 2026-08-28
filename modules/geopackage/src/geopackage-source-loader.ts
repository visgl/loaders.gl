// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  DataSourceOptions,
  ScanQueryMetadata,
  ScanQueryMetadataOptions,
  SourceLoader,
  TableScanReadOptions,
  TableScanSource
} from '@loaders.gl/loader-utils';
import {
  createScanQueryMetadata,
  DataSource,
  filterColumnarRowIndices,
  validateTableQueryOptions
} from '@loaders.gl/loader-utils';
import type {ArrowTable, ArrowTableBatch, Schema} from '@loaders.gl/schema';
import {convertArrowToSchema} from '@loaders.gl/schema-utils';
import type {WKTCRSDefinition} from '@math.gl/crs';
import * as arrow from 'apache-arrow';

import type {GeoPackageLoaderOptions} from './geopackage-loader';
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
  tables: GeoPackageSourceTableMetadata[];
};

export type GeoPackageSourceOptions = DataSourceOptions & {
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
    yield {
      batchType: 'data',
      shape: 'arrow-table',
      schema: table.schema,
      data: table.data,
      length: table.data.numRows
    };
  }

  private async loadMetadata(): Promise<GeoPackageSourceMetadata> {
    const arrayBuffer = await this.getArrayBuffer();
    const database = await loadGeoPackageDatabase(
      arrayBuffer,
      this.options.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
    );
    const vectorTables = listGeoPackageVectorTables(database);
    const projections = getProjections(database);
    const defaultTable = selectGeoPackageVectorTable(
      vectorTables,
      this.options.geopackage?.table || undefined
    );

    return {
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
          isDefault: vectorTable.name === defaultTable.name
        };
      })
    };
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
  const selectedColumns = options.columns ? [...options.columns] : availableColumns;
  let data: arrow.Table;

  if (options.predicate) {
    const columns = Object.fromEntries(
      availableColumns.map(name => [name, [...(table.data.getChild(name) || [])]])
    );
    const rowIndices = filterColumnarRowIndices(
      options.predicate as never,
      columns as never,
      table.data.numRows
    );
    const vectors = Object.fromEntries(
      selectedColumns.map(name => {
        const sourceVector = table.data.getChild(name);
        return [
          name,
          arrow.vectorFromArray(
            rowIndices.map(rowIndex => columns[name][rowIndex]),
            sourceVector?.type
          )
        ];
      })
    );
    const schema = new arrow.Schema(
      selectedColumns.map(name => table.data.schema.fields.find(field => field.name === name)!)
    );
    data = new arrow.Table(schema, vectors);
  } else {
    data = table.data.select(selectedColumns);
  }

  data = data.slice(0, options.limit ?? Number.POSITIVE_INFINITY);
  return {shape: 'arrow-table', schema: convertArrowToSchema(data.schema), data};
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('The operation was aborted', 'AbortError');
}
