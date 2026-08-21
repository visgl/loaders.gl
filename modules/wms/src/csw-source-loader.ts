// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {
  CatalogSource,
  CatalogSourceCapabilities,
  CoreAPI,
  SourceLoader,
  DataSourceOptions
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import type {CSWCapabilities} from './csw-capabilities-loader';
import {CSWCapabilitiesLoaderWithParser} from './csw-capabilities-loader-with-parser';

import type {CSWRecords} from './csw-records-loader';
import {CSWRecordsLoaderWithParser} from './csw-records-loader-with-parser';

import type {CSWDomain} from './csw-domain-loader';
import {CSWDomainLoaderWithParser} from './csw-domain-loader-with-parser';

import {WMSErrorLoaderWithParser} from './wms-error-loader-with-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Describes a service or resource exposed by the catalog */
export type Service = {
  /** name of service or resource */
  name: string;
  /** type of service or resource */
  type: string;
  url: string;
  params?: string;
  scheme?: string;
};

// CSW PARAMETER TYPES

type CSWCommonParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'CSW';
  /** In case the endpoint supports multiple CSW versions */
  version?: '1.1.1' | '2.0.0' | '2.0.1' | '3.0.0';
};

export type CSWGetCapabilitiesParameters = CSWCommonParameters & {
  /** Request type */
  request?: 'GetCapabilities';
};

export type CSWGetRecordsParameters = CSWCommonParameters & {
  /** Request type */
  request?: 'GetRecords';
  /** type of records */
  typenames?: 'csw:Record';
};

export type CSWGetDomainParameters = CSWCommonParameters & {
  /** Request type */
  request?: 'GetDomain';
  // TBA
};

export type CSWSourceLoaderOptions = DataSourceOptions & {
  csw?: Record<string, never>;
};

/** One catalog record returned by a CSW `GetRecords` response. */
export type CSWRecord = CSWRecords['records'][number];

/** Query accepted by the shared catalog search interface. */
export type CSWCatalogQuery = {
  /** Standard CSW `GetRecords` parameters. */
  parameters?: CSWGetRecordsParameters;
  /** Vendor-specific query parameters appended to the request. */
  vendorParameters?: Record<string, unknown>;
};

export const CSWSourceLoader = {
  dataType: null as unknown as CSWCatalogSource,
  batchType: null as never,
  name: 'CSW',
  id: 'csw',
  module: 'wms',
  version: VERSION,
  extensions: [],
  mimeTypes: [],
  type: 'csw',
  fromUrl: true,
  fromBlob: false,

  options: {csw: {}},

  defaultOptions: {csw: {}},

  testURL: (url: string): boolean => CSWCatalogSource.testURL(url),
  createDataSource: (
    url: string,
    options: CSWSourceLoaderOptions,
    coreApi?: CoreAPI
  ): CSWCatalogSource => new CSWCatalogSource(url, options, coreApi)
} as const satisfies SourceLoader<CSWCatalogSource>;

/**
 * The CSWCatalogSource class
 * - provides type safe methods to form URLs to a CSW service
 * - provides type safe methods to query and parse results (and errors) from a CSW service
 * @note Only the URL parameter conversion is supported. XML posts are not supported.
 */
export class CSWCatalogSource
  extends DataSource<string, CSWSourceLoaderOptions>
  implements CatalogSource<CSWRecord, CSWCatalogQuery, CSWCapabilities>
{
  static readonly type = 'csw';
  static testURL = (url: string): boolean => url.toLowerCase().includes('csw');

  /** Features exposed through the protocol-neutral catalog interface. */
  readonly capabilities: CatalogSourceCapabilities = Object.freeze({
    search: true,
    pagination: false,
    hierarchy: false,
    spatialFilter: false,
    temporalFilter: false,
    textFilter: false,
    cql2Filter: false,
    collections: false,
    assets: false
  });

  /** A list of loaders used by the CSWCatalogSource methods */
  readonly loaders = [WMSErrorLoaderWithParser, CSWCapabilitiesLoaderWithParser];

  /** Create a CSWCatalogSource */
  constructor(url: string, options: CSWSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, CSWSourceLoader.defaultOptions, coreApi);
  }

  async getMetadata(): Promise<CSWCapabilities> {
    const capabilities = await this.getCapabilities();
    return this.normalizeMetadata(capabilities);
  }

  normalizeMetadata(capabilities: CSWCapabilities): CSWCapabilities {
    return capabilities;
  }

  /** Searches one page of CSW records through the shared catalog interface. */
  async *search(query: CSWCatalogQuery = {}): AsyncIterable<CSWRecord> {
    const records = await this.getRecords(query.parameters, query.vendorParameters);
    yield* records.records;
  }

  async getServiceDirectory(options?: {includeUnknown?: boolean}): Promise<Service[]> {
    const services: Service[] = [];
    const unknownServices: Service[] = [];

    const records = await this.getRecords();
    for (const record of records.records) {
      for (const reference of record.references) {
        const url = reference.value;
        switch (reference.scheme) {
          case 'OGC:WMS':
            services.push({name: record.title, type: 'ogc-wms-service', ...this._parseOGCUrl(url)});
            break;
          case 'OGC:WMTS':
            services.push({
              name: record.title,
              type: 'ogc-wmts-service',
              ...this._parseOGCUrl(url)
            });
            break;
          case 'OGC:WFS':
            services.push({name: record.title, type: 'ogc-wfs-service', ...this._parseOGCUrl(url)});
            break;
          default:
            unknownServices.push({
              name: record.title,
              type: 'unknown',
              url: reference.value,
              scheme: reference.scheme
            });
        }
      }
    }

    return options?.includeUnknown ? services.concat(unknownServices) : services;
  }

  _parseOGCUrl(url: string): {url: string; params: string} {
    const parts = url.split('?');
    return {
      url: parts[0],
      params: parts[1] || ''
    };
  }

  // CSW Service API Stubs

  /** Get Capabilities */
  async getCapabilities(
    cswParameters?: CSWGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<CSWCapabilities> {
    const url = this.getCapabilitiesURL(cswParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    const capabilities = await CSWCapabilitiesLoaderWithParser.parse(
      arrayBuffer,
      this.options.core.loadOptions
    );
    return capabilities;
  }

  /** Get Records */
  async getRecords(
    cswParameters?: CSWGetRecordsParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<CSWRecords> {
    const url = this.getRecordsURL(cswParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await CSWRecordsLoaderWithParser.parse(arrayBuffer, this.options.core.loadOptions);
  }

  /** Get Domain */
  async getDomain(
    cswParameters?: CSWGetDomainParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<CSWDomain> {
    const url = this.getDomainURL(cswParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await CSWDomainLoaderWithParser.parse(arrayBuffer, this.options.core.loadOptions);
  }

  // Typed URL creators
  // For applications that want full control of fetching and parsing

  /** Generate a URL for the GetCapabilities request */
  getCapabilitiesURL(
    cswParameters?: CSWGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<CSWGetCapabilitiesParameters> = {
      version: '3.0.0',
      ...cswParameters,
      ...vendorParameters,
      service: 'CSW',
      request: 'GetCapabilities'
    };
    return this._getCSWUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetCapabilities request */
  getRecordsURL(
    cswParameters?: CSWGetRecordsParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<CSWGetRecordsParameters> = {
      version: '3.0.0',
      typenames: 'csw:Record',
      ...cswParameters,
      ...vendorParameters,
      service: 'CSW',
      request: 'GetRecords'
    };
    return this._getCSWUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetCapabilities request */
  getDomainURL(
    cswParameters?: CSWGetDomainParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<CSWGetDomainParameters> = {
      version: '3.0.0',
      ...cswParameters,
      ...vendorParameters,
      service: 'CSW',
      request: 'GetDomain'
    };
    return this._getCSWUrl(options, vendorParameters);
  }

  // INTERNAL METHODS

  /**
   * @note case _getCSWUrl may need to be overridden to handle certain backends?
   * */
  protected _getCSWUrl(
    options: Record<string, unknown>,
    vendorParameters?: Record<string, unknown>
  ): string {
    let url = this.url;
    let first = true;
    for (const [key, value] of Object.entries(options)) {
      url += first ? '?' : '&';
      first = false;
      if (Array.isArray(value)) {
        url += `${key.toUpperCase()}=${value.join(',')}`;
      } else {
        url += `${key.toUpperCase()}=${value ? String(value) : ''}`;
      }
    }
    return encodeURI(url);
  }

  /** Checks for and parses a CSW XML formatted ServiceError and throws an exception */
  protected _checkResponse(response: Response, arrayBuffer: ArrayBuffer): void {
    const contentType = response.headers.get('content-type') || '';
    if (!response.ok || WMSErrorLoaderWithParser.mimeTypes.some(type => type === contentType)) {
      const error = WMSErrorLoaderWithParser.parseSync?.(
        arrayBuffer,
        this.options.core.loadOptions
      );
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = WMSErrorLoaderWithParser.parseSync?.(arrayBuffer, this.options.core.loadOptions);
    return new Error(error);
  }
}
