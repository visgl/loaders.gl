// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';

import type {GeoPackageLoaderOptions} from './geopackage-loader';
import {
  DEFAULT_SQLJS_CDN,
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
  name: string;
  identifier?: string;
  description?: string;
  srsId?: number;
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
export class GeoPackageDataSource extends DataSource<string | Blob, GeoPackageSourceOptions> {
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

  /** Loads one GeoPackage vector table as an Arrow table. */
  async getTable(tableName?: string): Promise<ArrowTable> {
    const arrayBuffer = await this.getArrayBuffer();
    return parseGeoPackageToArrow(arrayBuffer, this.getLoaderOptions(tableName));
  }

  private async loadMetadata(): Promise<GeoPackageSourceMetadata> {
    const arrayBuffer = await this.getArrayBuffer();
    const database = await loadGeoPackageDatabase(
      arrayBuffer,
      this.options.geopackage?.sqlJsCDN ?? DEFAULT_SQLJS_CDN
    );
    const vectorTables = listGeoPackageVectorTables(database);
    const defaultTable = selectGeoPackageVectorTable(
      vectorTables,
      this.options.geopackage?.table || undefined
    );

    return {
      tables: vectorTables.map(vectorTable => ({
        name: vectorTable.name,
        identifier: vectorTable.identifier,
        description: vectorTable.description,
        srsId: vectorTable.srsId,
        geometryColumnName: vectorTable.geometryColumnName,
        geometryTypeName: vectorTable.geometryTypeName,
        bounds: vectorTable.bounds
          ? [
              [vectorTable.bounds.minX, vectorTable.bounds.minY],
              [vectorTable.bounds.maxX, vectorTable.bounds.maxY]
            ]
          : undefined,
        isDefault: vectorTable.name === defaultTable.name
      }))
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
