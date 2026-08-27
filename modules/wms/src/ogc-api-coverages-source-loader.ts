// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {OGCAPILandingPage, OGCAPICollection} from './ogc-api-source-loader';

/** Options for an OGC API Coverages source. */
export type OGCAPICoveragesSourceOptions = DataSourceOptions & {
  /** Coverage request defaults. */
  'ogc-api-coverages'?: {collectionId?: string; parameters?: Record<string, string>};
};

/** Parameters for a minimal OGC API Coverages query. */
export type OGCAPICoveragesQueryParameters = {
  /** Coverage collection identifier. */
  collectionId?: string;
  /** Bounding box in the requested CRS. */
  bbox?: [number, number, number, number];
  /** RFC 3339 instant or interval. */
  datetime?: string;
  /** Coverage dimension subsets, for example `Lat(40,45)`. */
  subset?: string[];
  /** Requested output media type. */
  format?: string;
  /** Additional query parameters. */
  parameters?: Record<string, string | number | boolean>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
};

/** Minimal OGC API Coverages source for discovery and coverage retrieval. */
export class OGCAPICoveragesSource extends DataSource<string, OGCAPICoveragesSourceOptions> {
  /** Creates an OGC API Coverages source. */
  constructor(url: string, options: OGCAPICoveragesSourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, OGCAPICoveragesSourceLoader.defaultOptions, coreApi);
  }

  /** Returns the OGC API landing page. */
  async getLandingPage(): Promise<OGCAPILandingPage> {
    return (await this.fetchJSON(this.url)) as OGCAPILandingPage;
  }

  /** Lists collections advertised by the service. */
  async getCollections(): Promise<OGCAPICollection[]> {
    const response = (await this.fetchJSON(`${this.url}/collections`)) as {
      collections?: OGCAPICollection[];
    };
    return response.collections || [];
  }

  /** Fetches a coverage representation from a collection. */
  async getCoverage(parameters: OGCAPICoveragesQueryParameters = {}): Promise<unknown> {
    const collectionId = parameters.collectionId || this.options['ogc-api-coverages']?.collectionId;
    if (!collectionId) throw new Error('OGC API Coverages request requires a collectionId');
    const url = new URL(`${this.url}/collections/${encodeURIComponent(collectionId)}/coverage`);
    const queryParameters = {
      ...this.options['ogc-api-coverages']?.parameters,
      ...parameters.parameters,
      bbox: parameters.bbox?.join(','),
      datetime: parameters.datetime,
      subset: parameters.subset,
      f: parameters.format
    };
    for (const [key, value] of Object.entries(queryParameters)) {
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, item);
      } else if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    const response = await this.fetch(url.toString(), {
      signal: parameters.signal,
      headers: {Accept: parameters.format || 'application/json'}
    });
    if (!response.ok) throw new Error(`OGC API Coverages request failed: ${response.status}`);
    const contentType = response.headers.get('content-type') || parameters.format || '';
    return /json/i.test(contentType) ? response.json() : response.arrayBuffer();
  }

  /** Fetches and decodes a JSON service response. */
  private async fetchJSON(url: string): Promise<unknown> {
    const response = await this.fetch(url, {headers: {Accept: 'application/json'}});
    if (!response.ok) throw new Error(`OGC API Coverages request failed: ${response.status}`);
    return response.json();
  }
}

/** Source loader for minimal OGC API Coverages support. */
export const OGCAPICoveragesSourceLoader = {
  dataType: null as unknown as OGCAPICoveragesSource,
  batchType: null as never,
  name: 'OGC API Coverages',
  id: 'ogc-api-coverages',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/json', 'image/tiff', 'application/octet-stream'],
  type: 'ogc-api-coverages',
  fromUrl: true,
  fromBlob: false,
  options: {'ogc-api-coverages': {}},
  defaultOptions: {'ogc-api-coverages': {}},
  testURL: (url: string): boolean =>
    /(?:\/coverage(?:s)?(?:\/|$)|ogc[/-]?api[/-]?coverages)/i.test(url),
  createDataSource: (url: string, options: OGCAPICoveragesSourceOptions = {}, coreApi?: CoreAPI) =>
    new OGCAPICoveragesSource(url, options, coreApi)
} as const satisfies SourceLoader<OGCAPICoveragesSource>;
