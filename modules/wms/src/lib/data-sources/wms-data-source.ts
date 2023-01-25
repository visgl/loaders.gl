// loaders.gl, MIT license

import type {WMSCapabilities, WMSFeatureInfo, WMSLayerDescription} from '@loaders.gl/wms';
import {
  WMSCapabilitiesLoader,
  WMSFeatureInfoLoader,
  WMSLayerDescriptionLoader,
  WMSErrorLoader
} from '@loaders.gl/wms';
import {ImageLoader, ImageType} from '@loaders.gl/images';
import {LoaderOptions} from '@loaders.gl/loader-utils';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

export type WMSDataSourceProps = {
  url: string;
  loadOptions?: LoaderOptions;
  fetch?: typeof fetch | FetchLike;
};

export class WMSDataSource {
  url: string;
  loadOptions: LoaderOptions;
  fetch: typeof fetch | FetchLike;

  constructor(props: WMSDataSourceProps) {
    this.url = props.url;
    this.loadOptions = props.loadOptions || {};
    this.fetch = props.fetch || fetch;
  }

  // URL creators

  getCapabilitiesURL(options: {parameters?: Record<string, unknown>}): string {
    return this.getWMSUrl({request: 'GetCapabilities', ...options});
  }

  getImageURL(options: {
    boundingBox;
    width;
    height;
    layers: string[];
    parameters?: Record<string, unknown>;
  }): string {
    return this.getWMSUrl({request: 'GetMap', ...options});
  }

  getFeatureInfoURL(options: {layers: string[]; parameters?: Record<string, unknown>}): string {
    return this.getWMSUrl({request: 'GetFeatureInfo', ...options});
  }

  getLayerInfoURL(options: {layers: string[]; parameters?: Record<string, unknown>}): string {
    return this.getWMSUrl({request: 'GetLayerInfo', ...options});
  }

  getLegendImageURL(options: {layers: string[]; parameters?: Record<string, unknown>}): string {
    return this.getWMSUrl({request: 'GetLegendImage', ...options});
  }

  // Request wrappers

  async getCapabilities(options: {parameters?: Record<string, unknown>}): Promise<WMSCapabilities> {
    const url = this.getCapabilitiesURL(options);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSCapabilitiesLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getImage(options: {
    boundingBox;
    width;
    height;
    layers: string[];
    parameters?: Record<string, unknown>;
  }): Promise<ImageType> {
    const url = this.getImageURL(options);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getFeatureInfo(options: {
    layers: string[];
    parameters?: Record<string, unknown>;
  }): Promise<WMSFeatureInfo> {
    const url = this.getFeatureInfoURL(options);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSFeatureInfoLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getLayerInfo(options: {
    layers: string[];
    parameters?: Record<string, unknown>;
  }): Promise<WMSLayerDescription> {
    const url = this.getLayerInfoURL(options);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSLayerDescriptionLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getLegendImage(options: {
    layers: string[];
    parameters?: Record<string, unknown>;
  }): Promise<ImageType> {
    const url = this.getLegendImageURL(options);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  /**
   * @note protected, since perhaps getWMSUrl may need to be overridden to handle certain backends?
   * @note if override is common, maybe add a callback prop?
   * */
  protected getWMSUrl(options: {
    request: string;
    layers?: string[];
    parameters?: Record<string, unknown>;
  }): string {
    let url = `${this.url}?REQUEST=${options.request}`;
    if (options.layers?.length) {
      url += `&LAYERS=[${options.layers.join(',')}]`;
    }
    return url;
  }

  /** Checks for and parses a WMS XML formatted ServiceError and throws an exception */
  protected async checkResponse(response: Response) {
    if (!response.ok || response.headers['content-type'] === WMSErrorLoader.mimeTypes[0]) {
      const arrayBuffer = await response.arrayBuffer();
      const error = await WMSErrorLoader.parse(arrayBuffer, this.loadOptions);
      throw new Error(error);
    }
  }
}
