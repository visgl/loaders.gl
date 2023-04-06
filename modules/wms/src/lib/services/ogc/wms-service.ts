// loaders.gl, MIT license

/* eslint-disable camelcase */

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import {mergeLoaderOptions} from '@loaders.gl/loader-utils';

import type {ImageSourceMetadata, GetImageParameters} from '../../sources/image-source';
import type {ImageSourceProps} from '../../sources/image-source';
import {ImageSource} from '../../sources/image-source';

import type {WMSCapabilities} from '../../../wms-capabilities-loader';
import type {WMSFeatureInfo} from '../../../wip/wms-feature-info-loader';
import type {WMSLayerDescription} from '../../../wip/wms-layer-description-loader';

import {WMSCapabilitiesLoader} from '../../../wms-capabilities-loader';
import {WMSFeatureInfoLoader} from '../../../wip/wms-feature-info-loader';
import {WMSLayerDescriptionLoader} from '../../../wip/wms-layer-description-loader';

import type {WMSLoaderOptions} from '../../../wms-error-loader';
import {WMSErrorLoader} from '../../../wms-error-loader';

type WMSCommonParameters = {
  /** In case the endpoint supports multiple services */
  service?: 'WMS';
  /** In case the endpoint supports multiple WMS versions */
  version?: '1.3.0' | '1.1.1';
};

export type WMSGetCapabilitiesParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetCapabilities';
};

export type WMSGetMapParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetMap';
  /** Layers to render */
  layers: string | string[];
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  srs?: string;
  /** Styling */
  styles?: unknown;
  /** Don't render background when no data */
  transparent?: boolean;
  /** requested format for the return image */
  format?: 'image/png';
};

// https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WMS&
export type WMSGetFeatureInfoParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetFeatureInfo';

  /** x coordinate for the feature info request */
  x: number;
  /** y coordinate for the feature info request */
  y: number;
  /** list of layers to query (could be different from rendered layers) */
  query_layers: string[];
  /** Requested MIME type of returned feature info */
  info_format?: 'text/plain' | 'application/vnd.ogc.gml';

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

export type WMSDescribeLayerParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'DescribeLayer';
};

export type WMSGetLegendGraphicParameters = WMSCommonParameters & {
  /** Request type */
  request?: 'GetLegendGraphic';
};

/** Properties for initializing a WMS service */
export type WMSServiceProps = ImageSourceProps & {
  /** Base URL to the service */
  url: string;
  /** WMS version */
  version?: '1.3.0' | '1.1.1';
  /** Layers to render */
  layers?: string[];
  /** SRS for the image (not the bounding box) */
  srs?: string;
  /** Requested format for the return image */
  format?: 'image/png';
  /** Requested MIME type of returned feature info */
  info_format?: 'text/plain' | 'application/vnd.ogc.gml';
  /** Styling - Not yet supported */
  styles?: unknown;
  /** Any additional parameters specific to this WMSService */
  vendorParameters?: Record<string, unknown>;
};

/**
 * The WMSService class provides
 * - provides type safe methods to form URLs to a WMS service
 * - provides type safe methods to query and parse results (and errors) from a WMS service
 * - implements the ImageService interface
 * @note Only the URL parameter conversion is supported. XML posts are not supported.
 */
export class WMSService extends ImageSource {
  static type: 'wms' = 'wms';
  static testURL = (url: string): boolean => url.toLowerCase().includes('wms');

  props: Required<WMSServiceProps>;
  capabilities: WMSCapabilities | null = null;

  /** A list of loaders used by the WMSService methods */
  readonly loaders = [
    ImageLoader,
    WMSErrorLoader,
    WMSCapabilitiesLoader,
    WMSFeatureInfoLoader,
    WMSLayerDescriptionLoader
  ];

  /** Create a WMSService */
  constructor(props: WMSServiceProps) {
    super(props);

    // TODO - defaults such as version, layers etc could be extracted from a base URL with parameters
    // This would make pasting in any WMS URL more likely to make this class just work.

    this.props = {
      loadOptions: undefined!,
      layers: undefined!,
      styles: undefined,
      version: '1.3.0',
      srs: 'EPSG:4326',
      format: 'image/png',
      info_format: 'text/plain',
      vendorParameters: {},
      ...props
    };
  }

  // ImageSource implementation
  async getMetadata(): Promise<ImageSourceMetadata> {
    const capabilities = await this.getCapabilities();
    return this.normalizeMetadata(capabilities);
  }

  async getImage(parameters: GetImageParameters): Promise<ImageType> {
    return await this.getMap(parameters);
  }

  normalizeMetadata(capabilities: WMSCapabilities): ImageSourceMetadata {
    return capabilities;
  }

  // WMS Service API Stubs

  /** Get Capabilities */
  async getCapabilities(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSCapabilities> {
    const url = this.getCapabilitiesURL(wmsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    const capabilities = await WMSCapabilitiesLoader.parse(arrayBuffer, this.props.loadOptions);
    this.capabilities = capabilities;
    return capabilities;
  }

  /** Get a map image */
  async getMap(
    options: WMSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getMapURL(options, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.props.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }

  /** Get Feature Info for a coordinate */
  async getFeatureInfo(
    options: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSFeatureInfo> {
    const url = this.getFeatureInfoURL(options, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WMSFeatureInfoLoader.parse(arrayBuffer, this.props.loadOptions);
  }

  /** Get Feature Info for a coordinate */
  async getFeatureInfoText(
    options: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<string> {
    const url = this.getFeatureInfoURL(options, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return new TextDecoder().decode(arrayBuffer);
  }

  /** Get more information about a layer */
  async describeLayer(
    options: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WMSLayerDescription> {
    const url = this.describeLayerURL(options, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WMSLayerDescriptionLoader.parse(arrayBuffer, this.props.loadOptions);
  }

  /** Get an image with a semantic legend */
  async getLegendGraphic(
    options: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getLegendGraphicURL(options, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.props.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }

  // Typed URL creators
  // For applications that want full control of fetching and parsing

  /** Generate a URL for the GetCapabilities request */
  getCapabilitiesURL(
    wmsParameters?: WMSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetCapabilitiesParameters> = {
      service: 'WMS',
      version: this.props.version,
      request: 'GetCapabilities',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetMap request */
  getMapURL(
    wmsParameters: WMSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetMapParameters> = {
      service: 'WMS',
      version: this.props.version,
      request: 'GetMap',
      // layers: [],
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      styles: this.props.styles,
      srs: this.props.srs,
      format: this.props.format,
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  getFeatureInfoURL(
    wmsParameters: WMSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetFeatureInfoParameters> = {
      service: 'WMS',
      version: this.props.version,
      request: 'GetFeatureInfo',
      // layers: this.props.layers,
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      // x: undefined!,
      // y: undefined!,
      // query_layers: [],
      srs: this.props.srs,
      format: this.props.format,
      info_format: this.props.info_format,
      styles: this.props.styles,
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  describeLayerURL(
    wmsParameters: WMSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSDescribeLayerParameters> = {
      service: 'WMS',
      version: this.props.version,
      request: 'DescribeLayer',
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  getLegendGraphicURL(
    wmsParameters: WMSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const options: Required<WMSGetLegendGraphicParameters> = {
      service: 'WMS',
      version: this.props.version,
      request: 'GetLegendGraphic',
      // format?
      ...wmsParameters,
      ...vendorParameters
    };
    return this._getWMSUrl(options, vendorParameters);
  }

  // INTERNAL METHODS

  _parseWMSUrl(url: string): {url: string, parameters: Record<string, unknown>} {
    const [baseUrl, search] = '' = url.split('?');
    const searchParams = search.split('&');
    
    const parameters: Record<string, unknown> = {};
    for (const parameter of searchParams) {
      const [key, value] = parameter.split('=');
      parameters[key] = value;
    }

    return {url: baseUrl, parameters};
  }

  /**
   * @note case _getWMSUrl may need to be overridden to handle certain backends?
   * */
  protected _getWMSUrl(
    options: Record<string, unknown>,
    vendorParameters?: Record<string, unknown>
  ): string {
    let url = this.props.url;
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

    // Add any vendor searchParams
    const additionalParameters = {...this.vendorParameters, ...vendorParameters};
    for (const [key, value] of Object.entries(additionalParameters)) {
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

  /** Checks for and parses a WMS XML formatted ServiceError and throws an exception */
  protected _checkResponse(response: Response, arrayBuffer: ArrayBuffer): void {
    const contentType = response.headers['content-type'];
    if (!response.ok || WMSErrorLoader.mimeTypes.includes(contentType)) {
      // We want error responses to throw exceptions, the WMSErrorLoader can do this
      const loadOptions = mergeLoaderOptions<WMSLoaderOptions>(this.props.loadOptions, {
        wms: {throwOnError: true}
      });
      const error = WMSErrorLoader.parseSync(arrayBuffer, loadOptions);
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = WMSErrorLoader.parseSync(arrayBuffer, this.props.loadOptions);
    return new Error(error);
  }
}
