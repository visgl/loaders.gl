// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/* eslint-disable camelcase */

import type {Source, DataSourceOptions} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

import type {CSWCapabilities} from './csw-capabilities-loader';
import {CSWCapabilitiesLoader} from './csw-capabilities-loader';

import type {CSWRecords} from './csw-records-loader';
import {CSWRecordsLoader} from './csw-records-loader';

import type {CSWDomain} from './csw-domain-loader';
import {CSWDomainLoader} from './csw-domain-loader';

import {WMSErrorLoader as CSWErrorLoader} from './wms-error-loader';

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
  typenames: 'csw:Record';
};

export type CSWGetDomainParameters = CSWCommonParameters & {
  /** Request type */
  request?: 'GetDomain';
  // TBA
};

export type CSWSourceOptions = DataSourceOptions & {
  csw?: {};
};

export const CSWSource = {
  name: 'CSW',
  id: 'csw',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'csw',
  fromUrl: true,
  fromBlob: false,

  defaultOptions: {
    wfs: {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('wfs'),
  createDataSource: (url: string, options: CSWSourceOptions): CSWCatalogSource =>
    new CSWCatalogSource(url, options)
} as const satisfies Source<CSWCatalogSource>;

/**
 * The CSWCatalogSource class
 * - provides type safe methods to form URLs to a CSW service
 * - provides type safe methods to query and parse results (and errors) from a CSW service
 * @note Only the URL parameter conversion is supported. XML posts are not supported.
 */
export class CSWCatalogSource extends DataSource<string, CSWSourceOptions> {
  static readonly type = 'csw';
  static testURL = (url: string): boolean => url.toLowerCase().includes('csw');

  capabilities: CSWCapabilities | null = null;
  /** A list of loaders used by the CSWCatalogSource methods */
  readonly loaders = [CSWErrorLoader, CSWCapabilitiesLoader];

  /** Create a CSWCatalogSource */
  constructor(url: string, options: CSWSourceOptions) {
    super(url, options, CSWSource.defaultOptions);
  }

  async getMetadata(): Promise<CSWCapabilities> {
    const capabilities = await this.getCapabilities();
    return this.normalizeMetadata(capabilities);
  }

  normalizeMetadata(capabilities: CSWCapabilities): CSWCapabilities {
    return capabilities;
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
    const capabilities = await CSWCapabilitiesLoader.parse(arrayBuffer, this.options.loadOptions);
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
    return await CSWRecordsLoader.parse(arrayBuffer, this.options.loadOptions);
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
    return await CSWDomainLoader.parse(arrayBuffer, this.options.loadOptions);
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
    const contentType = response.headers['content-type'];
    if (!response.ok || CSWErrorLoader.mimeTypes.includes(contentType)) {
      const error = CSWErrorLoader.parseSync?.(arrayBuffer, this.options.loadOptions);
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = CSWErrorLoader.parseSync?.(arrayBuffer, this.options.loadOptions);
    return new Error(error);
  }
}
