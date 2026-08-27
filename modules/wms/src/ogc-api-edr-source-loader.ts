// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {OGCAPILandingPage, OGCAPICollection} from './ogc-api-source-loader';

/** Options for an OGC API EDR source. */
export type OGCAPIEDRSourceOptions = DataSourceOptions & {
  /** EDR request defaults. */
  'ogc-api-edr'?: {collectionId?: string; parameters?: Record<string, string>};
};

/** Parameters shared by OGC API EDR query endpoints. */
export type OGCAPIEDRQueryParameters = {
  /** Collection identifier. */
  collectionId?: string;
  /** EDR query path, such as `position`, `area`, or `cube`. */
  queryType: 'position' | 'radius' | 'area' | 'cube' | 'trajectory' | 'corridor';
  /** Position or geometry encoded as required by the EDR server. */
  coords?: string;
  /** Bounding box in source coordinates. */
  bbox?: [number, number, number, number];
  /** RFC 3339 time or interval. */
  datetime?: string;
  /** Requested parameter identifiers. */
  parameterName?: string | string[];
  /** Vertical range or level. */
  z?: string;
  /** Requested CRS. */
  crs?: string;
  /** Response format. */
  format?: string;
  /** Additional query parameters. */
  parameters?: Record<string, string | number | boolean>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
};

/** Minimal OGC API EDR source for discovery and spatiotemporal queries. */
export class OGCAPIEDRSource extends DataSource<string, OGCAPIEDRSourceOptions> {
  /** Creates an EDR source. */
  constructor(url: string, options: OGCAPIEDRSourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, OGCAPIEDRSourceLoader.defaultOptions, coreApi);
  }

  /** Returns the EDR landing page. */
  async getLandingPage(): Promise<OGCAPILandingPage> {
    return (await this.fetchJSON(this.url)) as OGCAPILandingPage;
  }

  /** Lists collections advertised by the EDR service. */
  async getCollections(): Promise<OGCAPICollection[]> {
    const response = (await this.fetchJSON(`${this.url}/collections`)) as {
      collections?: OGCAPICollection[];
    };
    return response.collections || [];
  }

  /** Executes a focused EDR spatiotemporal query and returns the advertised representation. */
  async query(parameters: OGCAPIEDRQueryParameters): Promise<unknown> {
    const collectionId = parameters.collectionId || this.options['ogc-api-edr']?.collectionId;
    if (!collectionId) throw new Error('OGC API EDR query requires a collectionId');
    const url = new URL(
      `${this.url}/collections/${encodeURIComponent(collectionId)}/${parameters.queryType}`
    );
    const queryParameters = {
      ...this.options['ogc-api-edr']?.parameters,
      ...parameters.parameters,
      coords: parameters.coords,
      bbox: parameters.bbox?.join(','),
      datetime: parameters.datetime,
      'parameter-name': Array.isArray(parameters.parameterName)
        ? parameters.parameterName.join(',')
        : parameters.parameterName,
      z: parameters.z,
      crs: parameters.crs,
      f: parameters.format
    };
    for (const [key, value] of Object.entries(queryParameters)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
    const response = await this.fetch(url.toString(), {
      signal: parameters.signal,
      headers: {Accept: parameters.format || 'application/geo+json, application/json;q=0.9'}
    });
    if (!response.ok) throw new Error(`OGC API EDR request failed: ${response.status}`);
    return readResponse(response, parameters.format);
  }

  /** Fetches and decodes a JSON service response. */
  private async fetchJSON(url: string): Promise<unknown> {
    const response = await this.fetch(url, {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`OGC API EDR request failed: ${response.status}`);
    return response.json();
  }
}

/** Source loader for OGC API EDR services. */
export const OGCAPIEDRSourceLoader = {
  dataType: null as unknown as OGCAPIEDRSource,
  batchType: null as never,
  name: 'OGC API EDR',
  id: 'ogc-api-edr',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/json', 'application/geo+json'],
  type: 'ogc-api-edr',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api-edr': {}},
  defaultOptions: {'ogc-api-edr': {}},
  testURL: (url: string): boolean => /(?:\/edr(?:\/|$)|ogc[/-]?api[/-]?edr)/i.test(url),
  createDataSource: (url: string, options: OGCAPIEDRSourceOptions = {}, coreApi?: CoreAPI) =>
    new OGCAPIEDRSource(url, options, coreApi)
} as const satisfies SourceLoader<OGCAPIEDRSource>;

/** Reads JSON or binary content according to the response headers. */
async function readResponse(response: Response, format?: string): Promise<unknown> {
  const contentType = response.headers.get('content-type') || format || '';
  return /json/i.test(contentType) ? response.json() : response.arrayBuffer();
}
