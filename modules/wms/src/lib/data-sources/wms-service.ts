// loaders.gl, MIT license

/* eslint-disable camelcase */

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

export type WMSGetCapabilitiesParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
  /** Request type */
  request?: 'GetCapabilities';
};

export type WMSGetMapParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
  /** Request type */
  request?: 'GetMap';
  /** Layers to render */
  layers: string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
  /** Request type */
  request?: 'GetFeatureInfo';

  /** x coordinate for the feature info request */
  x: number;
  /** y coordinate for the feature info request */
  y: number;
  /** list of layers to query (could be different from rendered layers) */
  query_layers: string[];
  /** MIME type of returned feature info */
  info_format: 'text/plain';

  /** Layers to render */
  layers: string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** requested format for the return image */
  format?: 'image/png';
};

export type WMSDescribeLayerParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
  /** Request type */
  request?: 'DescribeLayer';
};

export type WMSGetLegendGraphicParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.1.1' | '1.3.0';
  /** Request type */
  request?: 'GetLegendGraphic';
};

const WMS_GET_CAPABILITIES_DEFAULT_PARAMETERS: Required<WMSGetCapabilitiesParameters> = {
  service: 'WMS',
  version: '1.1.1',
  request: 'GetCapabilities'
};

const WMS_GET_MAP_DEFAULT_PARAMETERS: Required<WMSGetMapParameters> = {
  service: 'WMS',
  version: '1.1.1',
  request: 'GetMap',
  layers: [],
  styles: undefined,
  bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
  width: 1200,
  height: 900,
  srs: 'EPSG:4326',
  format: 'image/png'
};

const WMS_GET_FEATURE_INFO_DEFAULT_PARAMETERS: Required<WMSGetFeatureInfoParameters> = {
  service: 'WMS',
  version: '1.1.1',
  request: 'GetFeatureInfo',
  layers: [],
  styles: undefined,
  bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
  width: 1200,
  height: 900,
  srs: 'EPSG:4326',
  format: 'image/png',

  x: undefined!,
  y: undefined!,
  query_layers: [],
  info_format: 'text/plain'
};

const WMS_DESCRIBE_LAYER_DEFAULT_PARAMETERS: Required<WMSDescribeLayerParameters> = {
  service: 'WMS',
  version: '1.1.1',
  request: 'DescribeLayer'
};

const WMS_GET_LEGEND_GRAPHIC_DEFAULT_PARAMETERS: Required<WMSGetLegendGraphicParameters> = {
  service: 'WMS',
  version: '1.1.1',
  request: 'GetLegendGraphic'
};

export type WMSServiceProps = {
  url: string;
  loadOptions?: LoaderOptions;
  fetch?: typeof fetch | FetchLike;
};

export class WMSService {
  url: string;
  loadOptions: LoaderOptions;
  fetch: typeof fetch | FetchLike;

  constructor(props: WMSServiceProps) {
    this.url = props.url;
    this.loadOptions = props.loadOptions || {};
    this.fetch = props.fetch || fetch;
  }

  // Typed URL creators

  getCapabilitiesURL(
    parameters?: WMSGetCapabilitiesParameters,
    extra?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetCapabilitiesParameters> = {
      ...WMS_GET_CAPABILITIES_DEFAULT_PARAMETERS,
      ...parameters,
      ...extra
    };
    return this.getWMSUrl(options, extra);
  }

  getMapURL(parameters: WMSGetMapParameters, extra?: Record<string, unknown>): string {
    const options: Required<WMSGetMapParameters> = {
      ...WMS_GET_MAP_DEFAULT_PARAMETERS,
      ...parameters,
      ...extra
    };
    return this.getWMSUrl(options, extra);
  }

  getFeatureInfoURL(
    parameters: WMSGetFeatureInfoParameters,
    extra?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetFeatureInfoParameters> = {
      ...WMS_GET_FEATURE_INFO_DEFAULT_PARAMETERS,
      ...parameters,
      ...extra
    };
    return this.getWMSUrl(options, extra);
  }

  describeLayerURL(
    parameters: WMSDescribeLayerParameters,
    extra?: Record<string, unknown>
  ): string {
    const options: Required<WMSDescribeLayerParameters> = {
      ...WMS_DESCRIBE_LAYER_DEFAULT_PARAMETERS,
      ...parameters,
      ...extra
    };
    return this.getWMSUrl(options, extra);
  }

  getLegendGraphicURL(
    parameters: WMSGetLegendGraphicParameters,
    extra?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetLegendGraphicParameters> = {
      ...WMS_GET_LEGEND_GRAPHIC_DEFAULT_PARAMETERS,
      ...parameters,
      ...extra
    };
    return this.getWMSUrl(options, extra);
  }

  // WMS Service API Stubs

  /** Get Capabilities */
  async getCapabilities(
    parameters?: WMSGetCapabilitiesParameters,
    extra?: Record<string, unknown>
  ): Promise<WMSCapabilities> {
    const url = this.getCapabilitiesURL(parameters, extra);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSCapabilitiesLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get a map image */
  async getMap(options: WMSGetMapParameters, extra?: Record<string, unknown>): Promise<ImageType> {
    const url = this.getMapURL(options, extra);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get Feature Info for a coordinate */
  async getFeatureInfo(
    options: WMSGetFeatureInfoParameters,
    extra?: Record<string, unknown>
  ): Promise<WMSFeatureInfo> {
    const url = this.getFeatureInfoURL(options, extra);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSFeatureInfoLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get more information about a layer */
  async describeLayer(
    options: WMSDescribeLayerParameters,
    extra?: Record<string, unknown>
  ): Promise<WMSLayerDescription> {
    const url = this.describeLayerURL(options, extra);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await WMSLayerDescriptionLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get an image with a semantic legend */
  async getLegendGraphic(
    options: WMSGetLegendGraphicParameters,
    extra?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getLegendGraphicURL(options, extra);
    const response = await this.fetch(url, this.loadOptions);
    await this.checkResponse(response);
    const arrayBuffer = await response.arrayBuffer();
    return await ImageLoader.parse(arrayBuffer, this.loadOptions);
  }

  // INTERNAL METHODS

  /**
   * @note protected, since perhaps getWMSUrl may need to be overridden to handle certain backends?
   * @note if override is common, maybe add a callback prop?
   * */
  protected getWMSUrl(
    options: {
      request: string;
      layers?: string[];
    },
    extra?: Record<string, unknown>
  ): string {
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
