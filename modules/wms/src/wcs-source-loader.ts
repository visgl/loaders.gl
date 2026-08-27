// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LERCData} from '@loaders.gl/lerc';
import {LERCLoader} from '@loaders.gl/lerc';
import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {WCSCapabilities} from './wip/lib/wcs/parse-wcs-capabilities';
import {parseWCSCapabilities} from './wip/lib/wcs/parse-wcs-capabilities';

/** Options for WCS coverage requests. */
export type WCSSourceOptions = DataSourceOptions & {
  /** WCS request defaults. */
  wcs?: {
    /** WCS protocol version. */
    version?: string;
    /** Default coverage identifier. */
    coverageId?: string;
    /** Default response media type. */
    format?: string;
    /** Additional service-specific parameters. */
    parameters?: Record<string, string | number | boolean>;
  };
};

/** Parameters for a WCS GetCoverage request. */
export type WCSGetCoverageParameters = {
  /** Coverage identifier, if not configured on the source. */
  coverageId?: string;
  /** Bounding box in source coordinates. */
  bbox?: [number, number, number, number];
  /** CRS of the bounding box. */
  crs?: string;
  /** CRS of the returned coverage. */
  responseCRS?: string;
  /** Requested response media type. */
  format?: string;
  /** WCS 2.x subset expressions, for example `Long(10,20)`. */
  subset?: string[];
  /** Requested output width. */
  width?: number;
  /** Requested output height. */
  height?: number;
  /** Additional service-specific parameters. */
  parameters?: Record<string, string | number | boolean>;
  /** Abort signal for cancellation. */
  signal?: AbortSignal;
};

/** Response from a WCS GetCoverage request. */
export type WCSCoverage = ArrayBuffer | LERCData;

/** Minimal normalized WCS coverage metadata. */
export type WCSCoverageMetadata = {
  /** Service title. */
  title?: string;
  /** Advertised coverage identifiers. */
  coverages: Array<{
    identifier: string;
    title?: string;
    format?: string[];
    boundingBox?: [number, number, number, number];
  }>;
};

/** WCS source with capabilities and GetCoverage support. */
export class WCSCoverageSource extends DataSource<string, WCSSourceOptions> {
  /** Creates a WCS source. */
  constructor(url: string, options: WCSSourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, WCSCoverageSourceLoader.defaultOptions, coreApi);
  }

  /** Fetches and parses the WCS GetCapabilities document. */
  async getCapabilities(): Promise<WCSCapabilities> {
    const response = await this.fetch(this.getCapabilitiesURL());
    await checkResponse(response, 'WCS GetCapabilities');
    return parseWCSCapabilities(await response.text(), {});
  }

  /** Returns normalized coverage metadata from GetCapabilities. */
  async getMetadata(): Promise<WCSCoverageMetadata> {
    const capabilities = (await this.getCapabilities()) as any;
    const coverages = Array.isArray(capabilities?.contents?.layers)
      ? capabilities.contents.layers.map((coverage: any) => ({
          identifier: coverage.identifier,
          title: coverage.title,
          format: coverage.formats,
          boundingBox: coverage.bounds
            ? [
                coverage.bounds.left,
                coverage.bounds.bottom,
                coverage.bounds.right,
                coverage.bounds.top
              ]
            : undefined
        }))
      : [];
    return {title: capabilities?.serviceIdentification?.title, coverages};
  }

  /** Fetches a coverage and decodes LERC responses through the existing loader. */
  async getCoverage(parameters: WCSGetCoverageParameters = {}): Promise<WCSCoverage> {
    const response = await this.fetch(this.getCoverageURL(parameters), {
      signal: parameters.signal,
      headers: {Accept: parameters.format || this.getDefaultFormat()}
    });
    await checkResponse(response, 'WCS GetCoverage');
    const format = parameters.format || this.getDefaultFormat();
    const arrayBuffer = await response.arrayBuffer();
    if (/lerc/i.test(format)) {
      return (await this.coreApi.parse(arrayBuffer, LERCLoader, this.loadOptions)) as LERCData;
    }
    return arrayBuffer;
  }

  /** Builds a WCS GetCapabilities URL. */
  getCapabilitiesURL(): string {
    return this.createURL({
      service: 'WCS',
      request: 'GetCapabilities',
      version: this.options.wcs?.version
    });
  }

  /** Builds a WCS 2.x GetCoverage URL. */
  getCoverageURL(parameters: WCSGetCoverageParameters = {}): string {
    const defaults = this.options.wcs || {};
    const query: Record<string, string | number | boolean | readonly string[] | undefined> = {
      service: 'WCS',
      request: 'GetCoverage',
      version: defaults.version || '2.0.1',
      coverageId: parameters.coverageId || defaults.coverageId,
      format: parameters.format || defaults.format || 'image/tiff',
      bbox: parameters.bbox?.join(','),
      subset: parameters.subset
    };
    if (parameters.crs) query.subsetCRS = parameters.crs;
    if (parameters.responseCRS) query.outputCRS = parameters.responseCRS;
    if (parameters.width) query.width = parameters.width;
    if (parameters.height) query.height = parameters.height;
    return this.createURL({...defaults.parameters, ...query, ...parameters.parameters});
  }

  /** Returns the configured response format. */
  private getDefaultFormat(): string {
    return this.options.wcs?.format || 'image/tiff';
  }

  /** Adds WCS query parameters to the service URL. */
  private createURL(
    parameters: Record<string, string | number | boolean | readonly string[] | undefined>
  ): string {
    const url = new URL(this.url);
    for (const [key, value] of Object.entries(parameters)) {
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, item);
      } else if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

/** Source loader for WCS coverage services. */
export const WCSCoverageSourceLoader = {
  dataType: null as unknown as WCSCoverageSource,
  batchType: null as never,
  name: 'WCS Coverage',
  id: 'wcs-coverage',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/xml', 'image/tiff', 'image/lerc'],
  type: 'wcs-coverage',
  fromUrl: true,
  fromBlob: false,
  options: {wcs: {}},
  defaultOptions: {wcs: {}},
  testURL: (url: string): boolean => /(?:wcs|GetCapabilities.*WCS|service=WCS)/i.test(url),
  createDataSource: (url: string, options: WCSSourceOptions = {}, coreApi?: CoreAPI) =>
    new WCSCoverageSource(url, options, coreApi)
} as const satisfies SourceLoader<WCSCoverageSource>;

/** Checks a service response and reports a protocol-specific error. */
async function checkResponse(response: Response, operation: string): Promise<void> {
  if (!response.ok) throw new Error(`${operation} request failed: ${response.status}`);
}
