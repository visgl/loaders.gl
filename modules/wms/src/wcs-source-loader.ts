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
  /** Axis names used when converting bbox to WCS 2.x subset expressions. */
  subsetAxes?: [string, string];
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
    return normalizeWCSMetadata(await this.getCapabilities());
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
    const version = defaults.version || '2.0.1';
    const query: Record<string, string | number | boolean | readonly string[] | undefined> = {
      service: 'WCS',
      request: 'GetCoverage',
      version,
      coverageId: parameters.coverageId || defaults.coverageId,
      format: parameters.format || defaults.format || 'image/tiff',
      subset: parameters.subset
    };
    if (version.startsWith('2')) {
      const [firstAxis, secondAxis] = parameters.subsetAxes || ['Long', 'Lat'];
      if (parameters.bbox) {
        query.subset = [
          `${firstAxis}(${parameters.bbox[0]},${parameters.bbox[2]})`,
          `${secondAxis}(${parameters.bbox[1]},${parameters.bbox[3]})`,
          ...(parameters.subset || [])
        ];
      }
      if (parameters.crs) query.subsetCRS = parameters.crs;
      if (parameters.responseCRS) query.outputCRS = parameters.responseCRS;
    } else {
      query.bbox = parameters.bbox?.join(',');
      if (parameters.crs) query.crs = parameters.crs;
      if (parameters.responseCRS) query.responseCRS = parameters.responseCRS;
    }
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

/** Normalizes both legacy and case-preserving WCS capability trees. */
function normalizeWCSMetadata(capabilities: WCSCapabilities): WCSCoverageMetadata {
  const rawCapabilities = capabilities as any;
  const serviceIdentification = getProperty(
    rawCapabilities,
    'serviceIdentification',
    'ServiceIdentification'
  );
  const contents = getProperty(rawCapabilities, 'contents', 'Contents') || {};
  const rawCoverages = getProperty(
    contents,
    'layers',
    'layer',
    'CoverageSummary',
    'coverageSummary'
  );
  const coverages = asArray(rawCoverages)
    .map(coverage => {
      const bounds = getProperty(coverage, 'bounds', 'BoundingBox', 'WGS84BoundingBox');
      const lowerCorner = parseNumbers(getProperty(bounds, 'lowerCorner', 'LowerCorner'));
      const upperCorner = parseNumbers(getProperty(bounds, 'upperCorner', 'UpperCorner'));
      return {
        identifier: readText(getProperty(coverage, 'identifier', 'Identifier')),
        title: readText(getProperty(coverage, 'title', 'Title')) || undefined,
        format: asArray(getProperty(coverage, 'formats', 'format', 'Format')).map(readText),
        boundingBox:
          lowerCorner.length >= 2 && upperCorner.length >= 2
            ? ([lowerCorner[0], lowerCorner[1], upperCorner[0], upperCorner[1]] as [
                number,
                number,
                number,
                number
              ])
            : undefined
      };
    })
    .filter(coverage => coverage.identifier);
  return {
    title: readText(getProperty(serviceIdentification, 'title', 'Title')) || undefined,
    coverages
  };
}

/** Reads a property using the key casing used by a WCS version. */
function getProperty(value: any, ...names: string[]): any {
  if (!value) return undefined;
  for (const name of names) {
    if (value[name] !== undefined) return value[name];
  }
  return undefined;
}

/** Converts a parser value into a list. */
function asArray(value: any): any[] {
  return value === undefined || value === null ? [] : Array.isArray(value) ? value : [value];
}

/** Extracts text from the XML parser's scalar or `#text` representation. */
function readText(value: any): string {
  return value === undefined || value === null
    ? ''
    : typeof value === 'object'
      ? String(value['#text'] || '')
      : String(value);
}

/** Parses an XML corner value into numeric coordinates. */
function parseNumbers(value: any): number[] {
  return readText(value).trim().split(/\s+/).map(Number).filter(Number.isFinite);
}
