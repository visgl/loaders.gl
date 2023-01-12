// loaders.gl, MIT license

import type {WMSCapabilities, WMSFeatureInfo, WMSLayerDescription} from '@loaders.gl/wms';
import {WMSCapabilitiesLoader, WMSFeatureInfoLoader, WMSLayerDescriptionLoader} from '@loaders.gl/wms';
import {ImageLoader, ImageType} from '@loaders.gl/images';
import {LoaderOptions} from '@loaders.gl/loader-utils';

// import {ImageDataSource} from './image-data-sources';

type FetchLike = (url: string, options?: RequestInit) => Promise<Response>;

export type WMSDataSourceProps = {
  url: string;
  loadOptions?: LoaderOptions;
  fetch?: typeof fetch | FetchLike;
};

export class WMSDataSource { // implements ImageDataSource {
  url: string;
  loadOptions: LoaderOptions;
  fetch: typeof fetch | FetchLike;

  constructor(props: WMSDataSourceProps) {
    this.url = props.url;
    this.loadOptions = props.loadOptions || {};
    this.fetch = props.fetch || fetch;
  }

  async getCapabilities(options: {parameters?: Record<string, unknown>}): Promise<WMSCapabilities> {
    const url = this.getUrl({request: 'GetCapabilities', ...options});
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSCapabilitiesLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getImage(options: {boundingBox, width, height, layers: string[], parameters?: Record<string, unknown>}): Promise<ImageType> {
    const url = this.getUrl({request: 'GetMap', ...options});
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getFeatureInfo(options: {layers: string[], parameters?: Record<string, unknown>}): Promise<WMSFeatureInfo> {
    const url = this.getUrl({request: 'GetFeatureInfo', ...options});
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSFeatureInfoLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getLayerInfo(options: {layers: string[], parameters?: Record<string, unknown>}): Promise<WMSLayerDescription> {
    const url = this.getUrl({request: 'GetLayerInfo', ...options})
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSLayerDescriptionLoader.parse(arrayBuffer, this.loadOptions);
  }

  async getLegendImage(options: {layers: string[], parameters?: Record<string, unknown>}): Promise<ImageType> {
    const url = this.getUrl({request: 'GetLegendImage', ...options});
    const response = await this.fetch(url, this.loadOptions);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** 
   * @note protected, since perhaps getUrl may need to be overridden to handle certain backends? 
   * @note if override is common, maybe add a callback prop?
   * */
  protected getUrl(options: {request: string; layers?: string[], parameters?: Record<string, unknown>}): string {
    let url = `${this.url}?REQUEST=${options.request}`;
    if (options.layers?.length) {
      url += `&LAYERS=[${options.layers.join(',')}]`;
    }
    return url;
  }
}
