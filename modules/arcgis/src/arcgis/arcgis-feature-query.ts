// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable} from '@loaders.gl/schema';
import type {
  ArcGISFeatureExtent,
  ArcGISFeatureObjectIds,
  ArcGISFeatureQueryOptions,
  ArcGISFeatureQueryProgress,
  ArcGISFeatureQueryResult
} from '../arcgis-feature-query-types';
import {buildArcGISResourceURL} from './arcgis-url-utils';

/** An HTTP or ArcGIS JSON error, without retaining a credential-bearing request URL. */
export class ArcGISFeatureQueryError extends Error {
  /** ArcGIS error code, or HTTP status when the response has no ArcGIS error. */
  readonly code: number;
  /** Additional service diagnostics. */
  readonly details: string[];

  /** Creates a structured service error. */
  constructor(message: string, code: number, details: string[] = []) {
    super(message);
    this.name = 'ArcGISFeatureQueryError';
    this.code = code;
    this.details = details;
  }
}

/** Fetch signature shared by source transport and the query client. */
type QueryFetch = (url: string, options?: RequestInit) => Promise<Response>;

/** Internal query client shared by FeatureServer and MapServer layer endpoints. */
export class ArcGISFeatureQueryClient {
  /** Creates a query client with one selected layer and normalized filters. */
  constructor(
    /** Layer URL, including caller-supplied authentication parameters. */
    readonly url: string,
    /** Authenticated source transport. */
    readonly fetch: QueryFetch,
    /** Filter parameters shared by counts, IDs and data requests. */
    readonly parameters: Record<string, unknown>,
    /** Signal applied to metadata and every subsequent request. */
    readonly signal?: AbortSignal
  ) {}

  /** Reads JSON while recognizing ArcGIS errors even on HTTP 200 responses. */
  async request(path: string, parameters: Record<string, unknown> = {}): Promise<any> {
    this.signal?.throwIfAborted();
    const requestUrl = new URL(buildArcGISResourceURL(this.url, path, parameters));
    for (const [name, value] of Object.entries(parameters)) {
      if (value === undefined) requestUrl.searchParams.delete(name);
    }
    const requestOptions: RequestInit = {signal: this.signal};
    // Query is read-only and supports POST. Keep endpoint credentials in the URL so the shared
    // credential transport can still honor explicit tokens and apply its origin restrictions.
    if (path === 'query' && requestUrl.toString().length > 2000) {
      const body = new URLSearchParams();
      for (const name of Object.keys(parameters)) {
        const value = requestUrl.searchParams.get(name);
        if (value !== null) {
          body.set(name, value);
          requestUrl.searchParams.delete(name);
        }
      }
      requestOptions.method = 'POST';
      requestOptions.headers = {'Content-Type': 'application/x-www-form-urlencoded'};
      requestOptions.body = body;
    }
    const response = await this.fetch(requestUrl.toString(), requestOptions);
    let json: any;
    try {
      json = await response.json();
    } catch {
      this.signal?.throwIfAborted();
      throw new ArcGISFeatureQueryError('ArcGIS returned a non-JSON response', response.status);
    }
    this.signal?.throwIfAborted();
    if (!response.ok || json?.error) {
      throw new ArcGISFeatureQueryError(
        json?.error?.message || response.statusText || 'ArcGIS query failed',
        json?.error?.code || response.status,
        json?.error?.details || []
      );
    }
    return json;
  }

  /** Returns the count for the same filters used by data retrieval. */
  async getCount(): Promise<number> {
    const json = await this.request('query', this.getSummaryParameters({returnCountOnly: true}));
    if (!Number.isSafeInteger(json.count) || json.count < 0) {
      throw new Error('ArcGIS query did not return a safe nonnegative count');
    }
    return json.count;
  }

  /** Returns unique object IDs and preserves explicit truncation information. */
  async getObjectIds(): Promise<ArcGISFeatureObjectIds> {
    const json = await this.request('query', this.getSummaryParameters({returnIdsOnly: true}));
    if (!Array.isArray(json.objectIds) || typeof json.objectIdFieldName !== 'string') {
      throw new Error('ArcGIS query did not return object IDs and their field name');
    }
    const objectIds = json.objectIds.map(validateObjectId);
    return {
      objectIdFieldName: json.objectIdFieldName,
      objectIds: [...new Set<number | string>(objectIds)],
      exceededTransferLimit: json.exceededTransferLimit === true
    };
  }

  /** Requests an extent while retaining its spatial reference. */
  async getExtent(): Promise<ArcGISFeatureExtent> {
    const json = await this.request('query', this.getSummaryParameters({returnExtentOnly: true}));
    const extent = json.extent;
    if (
      extent !== null &&
      (!extent?.spatialReference ||
        ![extent.xmin, extent.ymin, extent.xmax, extent.ymax].every(Number.isFinite))
    ) {
      throw new Error('ArcGIS query did not return an extent with a spatial reference');
    }
    return {extent, ...(json.count === undefined ? {} : {count: json.count})};
  }

  /** Reads layer metadata and rejects response formats this client cannot safely interpret. */
  async getMetadata(): Promise<any> {
    const metadata = await this.request('', {f: 'json'});
    if (
      metadata.capabilities &&
      !metadata.capabilities
        .split(',')
        .some((capability: string) => capability.trim().toLowerCase() === 'query')
    )
      throw new Error('This ArcGIS layer does not advertise Query capability');
    if (
      metadata.type !== 'Table' &&
      metadata.supportedQueryFormats &&
      !metadata.supportedQueryFormats
        .toLowerCase()
        .split(',')
        .map((format: string) => format.trim())
        .includes('geojson')
    ) {
      throw new Error('This spatial layer does not support GeoJSON queries');
    }
    return metadata;
  }

  /** Reads one page without implying that it represents a complete query. */
  async getPage(options: ArcGISFeatureQueryOptions): Promise<ArcGISFeatureQueryResult> {
    const metadata = await this.getMetadata();
    const pageSize = getPageSize(options, metadata);
    const offset = this.parameters.resultOffset ?? 0;
    if (!Number.isSafeInteger(offset) || Number(offset) < 0)
      throw new Error('resultOffset must be a nonnegative safe integer');
    const page = await this.readPage(metadata, {
      resultRecordCount: Math.min(
        pageSize,
        positiveInteger(Number(this.parameters.resultRecordCount ?? pageSize), 'resultRecordCount')
      )
    });
    return {
      data: page.data,
      loaded: page.data.features.length,
      pages: 1,
      duplicates: 0,
      complete: false,
      scope: options.boundingBox ? 'viewport' : 'query',
      strategy: 'page',
      reason: 'single-page'
    };
  }

  /** Streams bounded pages and assesses completeness using the initial count and stable IDs. */
  async *getPages(options: ArcGISFeatureQueryOptions): AsyncGenerator<ArcGISFeatureQueryResult> {
    const controller = new AbortController();
    const abort = () => controller.abort(this.signal?.reason);
    this.signal?.throwIfAborted();
    this.signal?.addEventListener('abort', abort, {once: true});
    const client = new ArcGISFeatureQueryClient(
      this.url,
      this.fetch,
      this.parameters,
      controller.signal
    );
    try {
      const metadata = await client.getMetadata();
      const pageSize = getPageSize(options, metadata);
      const maximumFeatures = positiveInteger(options.maxFeatures ?? 100000, 'maxFeatures');
      const concurrency = positiveInteger(options.concurrency ?? 4, 'concurrency');
      if (concurrency > 8) throw new Error('concurrency must not exceed 8');
      if (
        this.parameters.resultOffset ||
        this.parameters.resultRecordCount ||
        this.parameters.orderByFields
      ) {
        throw new Error(
          'Complete queries manage paging and ordering; use queryFeaturePage() for explicit pages'
        );
      }
      const objectIdField =
        metadata.objectIdField ||
        metadata.objectIdFieldName ||
        metadata.fields?.find((field: any) => field.type === 'esriFieldTypeOID')?.name;
      if (!objectIdField) throw new Error('Complete queries require a stable object ID field');
      const supportsOffset =
        metadata.advancedQueryCapabilities?.supportsPagination === true &&
        metadata.advancedQueryCapabilities?.supportsOrderBy === true;
      const strategy =
        options.strategy === 'auto' || !options.strategy
          ? supportsOffset
            ? 'offset'
            : 'object-ids'
          : options.strategy;
      if (strategy === 'offset' && !supportsOffset) {
        throw new Error('This ArcGIS layer does not advertise ordered pagination; use object-ids');
      }
      const expectedCount = await client.getCount();
      const progress: ArcGISFeatureQueryProgress = {
        loaded: 0,
        expectedCount,
        pages: 0,
        duplicates: 0,
        complete: false,
        scope: options.boundingBox ? 'viewport' : 'query',
        strategy,
        reason: 'loading'
      };
      const seen = new Set<number | string>();
      /** Snapshots progress so previously yielded pages never mutate. */
      const result = (features: Feature[]): ArcGISFeatureQueryResult => {
        progress.loaded = seen.size;
        options.onProgress?.({...progress});
        controller.signal.throwIfAborted();
        return {...progress, data: makeTable(features)};
      };
      /** Retains each safe identity once and applies the application memory bound. */
      const retain = (features: Feature[]): Feature[] => {
        const retained: Feature[] = [];
        for (const feature of features) {
          const identifier = validateObjectId(feature.properties?.[objectIdField] ?? feature.id);
          if (seen.has(identifier)) {
            progress.duplicates++;
            continue;
          }
          if (seen.size >= maximumFeatures) break;
          seen.add(identifier);
          retained.push({...feature, id: identifier});
        }
        return retained;
      };
      const fields = this.parameters.outFields;
      const outFields =
        fields === '*' || !fields
          ? '*'
          : [
              ...new Set([
                ...(Array.isArray(fields) ? fields : String(fields).split(',')),
                objectIdField
              ])
            ];
      if (strategy === 'offset') {
        let offset = 0;
        // Bound requests even when a service repeats pages or emits empty transfer-limited pages.
        while (true) {
          const requestCount = Math.min(pageSize, maximumFeatures - seen.size);
          const page = await client.readPage(metadata, {
            outFields,
            orderByFields: `${objectIdField} ASC`,
            resultOffset: offset,
            resultRecordCount: requestCount
          });
          progress.pages++;
          const retained = retain(page.data.features);
          offset += page.data.features.length;
          const ended =
            page.exceededTransferLimit === false ||
            (page.exceededTransferLimit !== true &&
              (page.data.features.length < requestCount || seen.size === expectedCount));
          if (ended) {
            progress.complete = seen.size === expectedCount;
            progress.reason = progress.complete ? 'complete' : 'count-mismatch';
          } else if (seen.size >= maximumFeatures) progress.reason = 'feature-limit';
          else if (!retained.length) progress.reason = 'no-progress';
          yield result(retained);
          if (progress.reason !== 'loading') return;
        }
      }
      const identifiers = await client.getObjectIds();
      if (identifiers.objectIdFieldName !== objectIdField) {
        throw new Error('ArcGIS changed the object ID field during the query');
      }
      const identifiersComplete =
        !identifiers.exceededTransferLimit && identifiers.objectIds.length === expectedCount;
      const selectedIds = identifiers.objectIds.slice(0, maximumFeatures);
      let missingRecords = false;
      for (let offset = 0; offset < selectedIds.length; offset += pageSize * concurrency) {
        const batches: (number | string)[][] = [];
        for (
          let index = offset;
          index < Math.min(offset + pageSize * concurrency, selectedIds.length);
          index += pageSize
        ) {
          batches.push(selectedIds.slice(index, index + pageSize));
        }
        const pages = await Promise.all(
          batches.map(async objectIds => {
            const page = await client.readPage(metadata, {outFields, objectIds});
            const returnedIds = new Set(
              page.data.features.map(feature =>
                validateObjectId(feature.properties?.[objectIdField] ?? feature.id)
              )
            );
            if (
              page.exceededTransferLimit === true ||
              objectIds.some(identifier => !returnedIds.has(identifier)) ||
              [...returnedIds].some(identifier => !objectIds.includes(identifier))
            )
              missingRecords = true;
            return page;
          })
        );
        for (let index = 0; index < pages.length; index++) {
          const retained = retain(pages[index].data.features);
          progress.pages++;
          if (offset + (index + 1) * pageSize >= selectedIds.length) {
            progress.complete =
              identifiersComplete && !missingRecords && seen.size === expectedCount;
            progress.reason = progress.complete
              ? 'complete'
              : !identifiersComplete
                ? 'id-limit'
                : selectedIds.length < expectedCount
                  ? 'feature-limit'
                  : 'count-mismatch';
          }
          yield result(retained);
        }
      }
      if (!selectedIds.length) {
        progress.complete = identifiersComplete;
        progress.reason = identifiersComplete ? 'complete' : 'id-limit';
        yield result([]);
      }
    } finally {
      controller.abort();
      this.signal?.removeEventListener('abort', abort);
    }
  }

  /** Removes data-only controls from a count, IDs or extent request. */
  private getSummaryParameters(operation: Record<string, unknown>): Record<string, unknown> {
    return {
      ...this.parameters,
      outFields: undefined,
      orderByFields: undefined,
      resultOffset: undefined,
      resultRecordCount: undefined,
      f: 'json',
      returnGeometry: false,
      returnCountOnly: false,
      returnIdsOnly: false,
      returnExtentOnly: false,
      ...operation
    };
  }

  /** Normalizes GeoJSON or nonspatial ArcGIS records without discarding null attributes. */
  private async readPage(
    metadata: any,
    parameters: Record<string, unknown>
  ): Promise<{
    /** Normalized records. */
    data: GeoJSONTable;
    /** Explicit server indication of remaining records, when present. */
    exceededTransferLimit?: boolean;
  }> {
    const isTable = metadata.type === 'Table';
    if (!isTable && String(this.parameters.outSR ?? 4326) !== '4326') {
      throw new Error(
        'ArcGIS GeoJSON output requires EPSG:4326; use requestCrs for projected query bounds'
      );
    }
    const json = await this.request('query', {
      ...this.parameters,
      ...parameters,
      returnCountOnly: false,
      returnIdsOnly: false,
      returnExtentOnly: false,
      f: isTable ? 'json' : 'geojson'
    });
    let features: Feature[];
    if (isTable && Array.isArray(json.features)) {
      features = json.features.map((record: any) => {
        if (!record.attributes || record.geometry)
          throw new Error('Invalid ArcGIS nonspatial table record');
        return {type: 'Feature', geometry: null, properties: record.attributes};
      });
    } else if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
      features = json.features;
      if (features.some(feature => feature.type !== 'Feature' || feature.geometry === undefined)) {
        throw new Error('Invalid ArcGIS GeoJSON feature');
      }
    } else throw new Error('ArcGIS query did not return a GeoJSON FeatureCollection');
    return {
      data: makeTable(features),
      exceededTransferLimit: json.exceededTransferLimit ?? json.properties?.exceededTransferLimit
    };
  }
}

/** Makes the normalized table shared by spatial and nonspatial query results. */
function makeTable(features: Feature[]): GeoJSONTable {
  return {shape: 'geojson-table', type: 'FeatureCollection', features};
}

/** Rejects missing or lossy numeric identities before deduplication. */
function validateObjectId(identifier: unknown): number | string {
  if (
    (typeof identifier === 'number' && Number.isSafeInteger(identifier)) ||
    (typeof identifier === 'string' && identifier.length > 0)
  )
    return identifier;
  throw new Error('ArcGIS query requires nonempty string or safe-integer object IDs');
}

/** Validates finite positive retrieval bounds. */
function positiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new Error(`${name} must be a positive safe integer`);
  return value;
}

/** Caps requests by the service limit without trusting invalid metadata. */
function getPageSize(options: ArcGISFeatureQueryOptions, metadata: any): number {
  return Math.min(
    positiveInteger(options.pageSize ?? 1000, 'pageSize'),
    positiveInteger(metadata.maxRecordCount ?? 1000, 'maxRecordCount')
  );
}
