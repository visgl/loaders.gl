// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {IcebergTableSource} from './iceberg-table-source';
import type {IcebergSourceOptions} from './iceberg-table-source';
import type {IcebergTableMetadata} from './iceberg-types';
import type {RequestScheduler} from '@loaders.gl/loader-utils';

/** Configuration for the minimal Iceberg REST Catalog adapter. */
export type IcebergRestCatalogOptions = {
  /** Catalog base URL, for example `https://catalog.example.com`. */
  readonly endpoint: string;
  /** Headers sent to catalog and metadata requests. */
  readonly headers?: HeadersInit;
  /** Fetch implementation, useful for browser auth and deterministic tests. */
  readonly fetch?: (url: string, options?: RequestInit) => Promise<Response>;
  /** Optional shared request gate for catalog metadata calls. */
  readonly requestScheduler?: RequestScheduler;
};

/** Fully qualified Iceberg REST table identifier. */
export type IcebergRestTableIdentifier = {
  /** Namespace components in catalog order. */
  readonly namespace: readonly string[];
  /** Table name within the namespace. */
  readonly table: string;
};

/** A table source returned by the REST Catalog adapter. */
export type IcebergRestTable = {
  /** Inline metadata returned by the catalog, when available. */
  readonly metadata?: IcebergTableMetadata;
  /** Metadata location returned by the catalog, when available. */
  readonly metadataLocation?: string;
  /** Read-only source that plans and scans the table. */
  readonly source: IcebergTableSource;
};

/**
 * Minimal read-only Iceberg REST Catalog client.
 *
 * This deliberately stops at table loading. Scan planning and file access remain in
 * `IcebergTableSource`, so catalog authentication and table-format decoding stay separate.
 */
export class IcebergRestCatalog {
  private readonly options: IcebergRestCatalogOptions;

  constructor(options: IcebergRestCatalogOptions) {
    this.options = options;
  }

  /** Loads one table's metadata through the Iceberg REST Catalog `/v1` endpoint. */
  async loadTable(
    identifier: IcebergRestTableIdentifier,
    signal?: AbortSignal
  ): Promise<IcebergRestTable> {
    const tableUrl = this.getTableUrl(identifier);
    const response = await this.fetchJson(tableUrl, signal);
    if (!response.ok) {
      throw new Error(
        `Iceberg REST Catalog request failed: ${response.status} ${response.statusText}`
      );
    }
    const responseJson = (await response.json()) as Record<string, unknown>;
    const metadataLocation = getString(responseJson['metadata-location']);
    const metadata = isIcebergMetadata(responseJson.metadata) ? responseJson.metadata : undefined;
    if (!metadataLocation && !metadata) {
      throw new Error('Iceberg REST Catalog response did not include table metadata');
    }
    const source = metadata
      ? new IcebergTableSource(createMetadataUrl(metadata), this.getSourceOptions())
      : new IcebergTableSource(metadataLocation as string, this.getSourceOptions());
    return {metadata, metadataLocation, source};
  }

  /** Fetches one catalog response through the optional shared request scheduler. */
  private async fetchJson(url: string, signal?: AbortSignal): Promise<Response> {
    const scheduler = this.options.requestScheduler;
    const request = scheduler
      ? await scheduler.scheduleRequest(url, () => (signal?.aborted ? -1 : 0))
      : {done: () => {}};
    if (!request) throw new DOMException('The operation was aborted', 'AbortError');
    try {
      return await (this.options.fetch ?? fetch)(url, {
        headers: this.options.headers,
        signal
      });
    } finally {
      request.done();
    }
  }

  /** Builds the standard REST Catalog table endpoint. */
  private getTableUrl(identifier: IcebergRestTableIdentifier): string {
    const namespace = identifier.namespace.map(encodeURIComponent).join('%1F');
    return `${this.options.endpoint.replace(/\/$/, '')}/v1/namespaces/${namespace}/tables/${encodeURIComponent(identifier.table)}`;
  }

  /** Carries catalog headers and fetch through to the metadata/data source. */
  private getSourceOptions(): IcebergSourceOptions {
    const options: IcebergSourceOptions = {iceberg: {headers: this.options.headers}};
    if (this.options.fetch) {
      options.core = {loadOptions: {core: {fetch: this.options.fetch}}};
    }
    return options;
  }
}

function getString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function isIcebergMetadata(value: unknown): value is IcebergTableMetadata {
  if (!value || typeof value !== 'object') return false;
  const metadata = value as Record<string, unknown>;
  return typeof metadata['format-version'] === 'number' && typeof metadata.location === 'string';
}

function createMetadataUrl(metadata: IcebergTableMetadata): string {
  return `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
}
