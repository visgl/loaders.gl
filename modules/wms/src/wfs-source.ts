// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, GeoJSONTable} from '@loaders.gl/schema';
import type {
  DataSourceOptions,
  VectorSourceMetadata,
  GetFeaturesParameters
} from '@loaders.gl/loader-utils';
import {Source, DataSource, VectorSource, mergeOptions} from '@loaders.gl/loader-utils';

import type {WFSCapabilities} from './wfs-capabilities-loader';
import {WFSCapabilitiesLoader} from './wfs-capabilities-loader';

import type {WMSLoaderOptions} from './wms-error-loader';
import {WMSErrorLoader} from './wms-error-loader';

/* eslint-disable camelcase */ // WFS XML parameters use snake_case

/** Properties for creating a enw WFS service */
export type WFSourceOptions = DataSourceOptions & {
  wfs?: {
    /** In 1.3.0, replaces references to EPSG:4326 with CRS:84 */
    substituteCRS84?: boolean;
    /** Default WFS parameters. If not provided here, must be provided in the various request */
    wfsParameters?: WFSParameters;
    /** Any additional service specific parameters */
    vendorParameters?: Record<string, unknown>;
  };
};

/**
 * @deprecated This is a WIP, not fully implemented
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const WFSSource = {
  name: 'WFS',
  id: 'wfs',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'wfs',
  fromUrl: true,
  fromBlob: false,

  defaultOptions: {
    wfs: {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('wfs'),
  createDataSource: (url: string, options: WFSourceOptions): WFSVectorSource =>
    new WFSVectorSource(url, options)
} as const satisfies Source<WFSVectorSource>;

// PARAMETER TYPES FOR WFS SOURCE

/**
 * "Static" WFS parameters (not viewport or selected pixel dependent)
 * These can be provided as defaults in the WFSVectorSource constructor
 */
export type WFSParameters = {
  /** WFS version (all requests) */
  version?: '1.3.0' | '1.1.1';
  /** Layers to render (GetMap, GetFeatureInfo) */
  layers?: string[];
  /** list of layers to query.. (GetFeatureInfo) */
  query_layers?: string[];

  /** Coordinate Reference System (CRS) for the image (not the bounding box) */
  crs?: string;
  /** Requested format for the return image (GetMap, GetLegendGraphic) */
  format?: 'image/png';
  /** Requested MIME type of returned feature info (GetFeatureInfo) */
  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml';
  /** Styling - Not yet supported */
  styles?: unknown;
  /** Any additional parameters specific to this WFSVectorSource (GetMap) */
  transparent?: boolean;
  /** If layer supports time dimension */
  time?: string;
  /** If layer supports elevation dimension */
  elevation?: string;
};

/** Parameters for GetCapabilities */
export type WFSGetCapabilitiesParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: '1.3.0' | '1.1.1';
};

/** Parameters for GetMap */
export type WFSGetMapParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: '1.3.0' | '1.1.1';
  /** bounding box of the requested map image `[[w, s], [e, n]]`  */
  // boundingBox: [min: [x: number, y: number], max: [x: number, y: number]];
  /** bounding box of the requested map image @deprecated Use .boundingBox */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** requested format for the return image. can be provided in service constructor */
  format?: 'image/png';
  /** Layers to render - can be provided in service constructor */
  layers?: string | string[];
  /** Coordinate Reference System for the image (not bounding box). can be provided in service constructor. */
  crs?: string;
  /** Styling. can be provided in service constructor */
  styles?: unknown;
  /** Don't render background when no data. can be provided in service constructor */
  transparent?: boolean;
  /** If layer supports time dimension */
  time?: string;
  /** If layer supports elevation dimension */
  elevation?: string;
};

// /** GetMap parameters that are specific to the current view */
// export type WFSGetMapViewParameters = {
//   /** pixel width of returned image */
//   width: number;
//   /** pixels */
//   height: number;
//   /** bounding box of the requested map image */
//   bbox: [number, number, number, number];
//   /** Coordinate Reference System for the image (not bounding box). can be provided in service constructor. */
//   crs?: string;
// };

/**
 * Parameters for GetFeatureInfo
 * @see https://imagery.pasda.psu.edu/arcgis/services/pasda/UrbanTreeCanopy_Landcover/MapServer/WmsServer?SERVICE=WFS&
 */
export type WFSGetFeatureInfoParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: '1.3.0' | '1.1.1';
  /** x coordinate for the feature info request */
  x: number;
  /** y coordinate for the feature info request */
  y: number;
  /** MIME type of returned feature info. Can be specified in service constructor */
  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml';
  /** list of layers to query. Required but can be specified in service constructor. */
  query_layers?: string[];
  /** Layers to render. Required, but can be specified in service constructor */
  layers?: string[];
  /** Styling */
  styles?: unknown;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** srs for the image (not the bounding box) */
  crs?: string;
};

/** GetMap parameters that are specific to the current view */
export type WFSGetFeatureInfoViewParameters = {
  /** x coordinate for the feature info request */
  x: number;
  /** y coordinate for the feature info request */
  y: number;
  /** pixel width of returned image */
  width: number;
  /** pixels */
  height: number;
  /** bounding box of the requested map image */
  bbox: [number, number, number, number];
  /** srs for the image (not the bounding box) */
  crs?: string;
};

/** Parameters for DescribeLayer */
export type WFSDescribeLayerParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: '1.3.0' | '1.1.1';
};

/** Parameters for GetLegendGraphic */
export type WFSGetLegendGraphicParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: '1.3.0' | '1.1.1';
};

//

/**
 * The WFSVectorSource class provides
 * - provides type safe methods to form URLs to a WFS service
 * - provides type safe methods to query and parse results (and errors) from a WFS service
 * - implements the VectorSource interface
 * @note Only the URL parameter conversion is supported. XML posts are not supported.
 */
export class WFSVectorSource extends DataSource<string, WFSourceOptions> implements VectorSource {
  /** Default static vendor parameters */
  vendorParameters?: Record<string, unknown>;

  capabilities: WFSCapabilities | null = null;

  /** Create a WFSVectorSource */
  constructor(data: string, options: WFSourceOptions) {
    super(data, options, WFSSource.defaultOptions);

    // TODO - defaults such as version, layers etc could be extracted from a base URL with parameters
    // This would make pasting in any WFS URL more likely to make this class just work.
    // const {baseUrl, parameters} = this._parseWFSUrl(options.url);
  }

  async getSchema(): Promise<Schema> {
    return {metadata: {}, fields: []};
  }

  // VectorSource implementation
  async getMetadata(): Promise<VectorSourceMetadata> {
    const capabilities = await this.getCapabilities();
    return this.normalizeMetadata(capabilities);
  }

  async getFeatures(parameters: GetFeaturesParameters): Promise<GeoJSONTable> {
    // Replace the GetImage `boundingBox` parameter with the WFS flat `bbox` parameter.
    // const {boundingBox, bbox, ...rest} = parameters;
    // const wfsParameters: WFSGetMapParameters = {
    //   bbox: boundingBox ? [...boundingBox[0], ...boundingBox[1]] : bbox!,
    //   ...rest
    // };
    return {shape: 'geojson-table', type: 'FeatureCollection', features: []};
  }

  normalizeMetadata(capabilities: WFSCapabilities): VectorSourceMetadata {
    return capabilities as any;
  }

  // WFS Service API Stubs

  /** Get Capabilities */
  async getCapabilities(
    wfsParameters?: WFSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WFSCapabilities> {
    const url = this.getCapabilitiesURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    const capabilities = await WFSCapabilitiesLoader.parse(arrayBuffer, this.loadOptions);
    this.capabilities = capabilities;
    return capabilities;
  }

  /** Get a map image *
  async getMap(
    wfsParameters: WFSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getMapURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }

  /** Get Feature Info for a coordinate *
  async getFeatureInfo(
    wfsParameters: WFSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WFSFeatureInfo> {
    const url = this.getFeatureInfoURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WFSFeatureInfoLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get Feature Info for a coordinate *
  async getFeatureInfoText(
    wfsParameters: WFSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<string> {
    const url = this.getFeatureInfoURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return new TextDecoder().decode(arrayBuffer);
  }

  /** Get more information about a layer *
  async describeLayer(
    wfsParameters: WFSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<WFSLayerDescription> {
    const url = this.describeLayerURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return await WFSLayerDescriptionLoader.parse(arrayBuffer, this.loadOptions);
  }

  /** Get an image with a semantic legend *
  async getLegendGraphic(
    wfsParameters: WFSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): Promise<ImageType> {
    const url = this.getLegendGraphicURL(wfsParameters, vendorParameters);
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    try {
      return await ImageLoader.parse(arrayBuffer, this.loadOptions);
    } catch {
      throw this._parseError(arrayBuffer);
    }
  }
  */

  // Typed URL creators
  // For applications that want full control of fetching and parsing

  /** Generate a URL for the GetCapabilities request */
  getCapabilitiesURL(
    wfsParameters?: WFSGetCapabilitiesParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    // @ts-expect-error
    const options: Required<WFSGetCapabilitiesParameters> = {
      // version: this.wfsParameters.version,
      ...wfsParameters
    };
    return this._getWFSUrl('GetCapabilities', options, vendorParameters);
  }

  /** Generate a URL for the GetMap request */
  getMapURL(
    wfsParameters: WFSGetMapParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    wfsParameters = this._getWFS130Parameters(wfsParameters);
    // @ts-expect-error
    const options: Required<WFSGetMapParameters> = {
      // version: this.wfsParameters.version,
      // format: this.wfsParameters.format,
      // transparent: this.wfsParameters.transparent,
      // time: this.wfsParameters.time,
      // elevation: this.wfsParameters.elevation,
      // layers: this.wfsParameters.layers,
      // styles: this.wfsParameters.styles,
      // crs: this.wfsParameters.crs,
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      ...wfsParameters
    };
    return this._getWFSUrl('GetMap', options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  getFeatureInfoURL(
    wfsParameters: WFSGetFeatureInfoParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    wfsParameters = this._getWFS130Parameters(wfsParameters);

    // Replace the GetImage `boundingBox` parameter with the WFS flat `bbox` parameter.
    const {boundingBox, bbox} = wfsParameters as any;
    wfsParameters.bbox = boundingBox ? [...boundingBox[0], ...boundingBox[1]] : bbox!;

    // @ts-expect-error
    const options: Required<WFSGetFeatureInfoParameters> = {
      // version: this.wfsParameters.version,
      // // query_layers: [],
      // // format: this.wfsParameters.format,
      // info_format: this.wfsParameters.info_format,
      // layers: this.wfsParameters.layers,
      // query_layers: this.wfsParameters.query_layers,
      // styles: this.wfsParameters.styles,
      // crs: this.wfsParameters.crs,
      // bbox: [-77.87304, 40.78975, -77.85828, 40.80228],
      // width: 1200,
      // height: 900,
      // x: undefined!,
      // y: undefined!,
      ...wfsParameters
    };
    return this._getWFSUrl('GetFeatureInfo', options, vendorParameters);
  }

  /** Generate a URL for the GetFeatureInfo request */
  describeLayerURL(
    wfsParameters: WFSDescribeLayerParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    // @ts-expect-error
    const options: Required<WFSDescribeLayerParameters> = {
      // version: this.wfsParameters.version,
      ...wfsParameters
    };
    return this._getWFSUrl('DescribeLayer', options, vendorParameters);
  }

  getLegendGraphicURL(
    wfsParameters: WFSGetLegendGraphicParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    // @ts-expect-error
    const options: Required<WFSGetLegendGraphicParameters> = {
      // version: this.wfsParameters.version,
      // format?
      ...wfsParameters
    };
    return this._getWFSUrl('GetLegendGraphic', options, vendorParameters);
  }

  // INTERNAL METHODS

  _parseWFSUrl(url: string): {url: string; parameters: Record<string, unknown>} {
    const [baseUrl, search] = url.split('?');
    const searchParams = search.split('&');

    const parameters: Record<string, unknown> = {};
    for (const parameter of searchParams) {
      const [key, value] = parameter.split('=');
      parameters[key] = value;
    }

    return {url: baseUrl, parameters};
  }

  /**
   * Generate a URL with parameters
   * @note case _getWFSUrl may need to be overridden to handle certain backends?
   * @note at the moment, only URLs with parameters are supported (no XML payloads)
   * */
  protected _getWFSUrl(
    request: string,
    wfsParameters: {version?: '1.3.0' | '1.1.1'; [key: string]: unknown},
    vendorParameters?: Record<string, unknown>
  ): string {
    let url = this.url;
    let first = true;

    // Add any vendor searchParams
    const allParameters = {
      service: 'WFS',
      version: wfsParameters.version,
      request,
      ...wfsParameters,
      ...this.vendorParameters,
      ...vendorParameters
    };

    // Encode the keys
    const IGNORE_EMPTY_KEYS = ['transparent', 'time', 'elevation'];
    for (const [key, value] of Object.entries(allParameters)) {
      // hack to preserve test cases. Not super clear if keys should be included when values are undefined
      if (!IGNORE_EMPTY_KEYS.includes(key) || value) {
        url += first ? '?' : '&';
        first = false;
        url += this._getURLParameter(key, value, wfsParameters);
      }
    }

    return encodeURI(url);
  }

  _getWFS130Parameters<ParametersT extends {crs?: string; srs?: string}>(
    wfsParameters: ParametersT
  ): ParametersT {
    const newParameters = {...wfsParameters};
    if (newParameters.srs) {
      newParameters.crs = newParameters.crs || newParameters.srs;
      delete newParameters.srs;
    }
    return newParameters;
  }

  // eslint-disable-next-line complexity
  _getURLParameter(key: string, value: unknown, wfsParameters: WFSParameters): string {
    // Substitute by key
    switch (key) {
      case 'crs':
        // CRS was called SRS before WFS 1.3.0
        if (wfsParameters.version !== '1.3.0') {
          key = 'srs';
          // } else if (this.substituteCRS84 && value === 'EPSG:4326') {
          //   /** In 1.3.0, replaces references to 'EPSG:4326' with the new backwards compatible CRS:84 */
          //   // Substitute by value
          //   value = 'CRS:84';
        }
        break;

      case 'srs':
        // CRS was called SRS before WFS 1.3.0
        if (wfsParameters.version === '1.3.0') {
          key = 'crs';
        }
        break;

      case 'bbox':
        // Coordinate order is flipped for certain CRS in WFS 1.3.0
        const bbox = this._flipBoundingBox(value, wfsParameters);
        if (bbox) {
          value = bbox;
        }
        break;

      case 'x':
        // i is the parameter used in WFS 1.3
        // TODO - change parameter to `i` and convert to `x` if not 1.3
        if (wfsParameters.version === '1.3.0') {
          key = 'i';
        }
        break;

      case 'y':
        // j is the parameter used in WFS 1.3
        // TODO - change parameter to `j` and convert to `y` if not 1.3
        if (wfsParameters.version === '1.3.0') {
          key = 'j';
        }
        break;

      default:
      // do nothing
    }

    key = key.toUpperCase();

    return Array.isArray(value)
      ? `${key}=${value.join(',')}`
      : `${key}=${value ? String(value) : ''}`;
  }

  /** Coordinate order is flipped for certain CRS in WFS 1.3.0 */
  _flipBoundingBox(
    bboxValue: unknown,
    wfsParameters: WFSParameters
  ): [number, number, number, number] | null {
    // Sanity checks
    if (!Array.isArray(bboxValue) || bboxValue.length !== 4) {
      return null;
    }

    const flipCoordinates = false;
    // // Only affects WFS 1.3.0
    // wfsParameters.version === '1.3.0' &&
    // // Flip if we are dealing with a CRS that was flipped in 1.3.0
    // this.flipCRS.includes(wfsParameters.crs || '') &&
    // // Don't flip if we are substituting EPSG:4326 with CRS:84
    // !(this.substituteCRS84 && wfsParameters.crs === 'EPSG:4326');

    const bbox = bboxValue as [number, number, number, number];
    return flipCoordinates ? [bbox[1], bbox[0], bbox[3], bbox[2]] : bbox;
  }

  /** Fetches an array buffer and checks the response (boilerplate reduction) */
  protected async _fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    const response = await this.fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    return arrayBuffer;
  }

  /** Checks for and parses a WFS XML formatted ServiceError and throws an exception */
  protected _checkResponse(response: Response, arrayBuffer: ArrayBuffer): void {
    const contentType = response.headers['content-type'];
    if (!response.ok || WMSErrorLoader.mimeTypes.includes(contentType)) {
      // We want error responses to throw exceptions, the WMSErrorLoader can do this
      const loadOptions = mergeOptions<WMSLoaderOptions>(this.loadOptions, {
        wms: {throwOnError: true}
      });
      const error = WMSErrorLoader.parseSync?.(arrayBuffer, loadOptions);
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = WMSErrorLoader.parseSync?.(arrayBuffer, this.loadOptions);
    return new Error(error);
  }
}
