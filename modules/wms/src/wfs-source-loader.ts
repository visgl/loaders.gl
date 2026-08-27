// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Schema, GeoJSONTable, Geometry} from '@loaders.gl/schema';
import {
  convertFeaturesToWKBArrowTable,
  convertGeojsonToBinaryFeatureCollection
} from '@loaders.gl/gis';
import type {
  CoreAPI,
  DataSourceOptions,
  VectorSourceMetadata,
  GetFeaturesParameters,
  VectorSourceData
} from '@loaders.gl/loader-utils';
import {SourceLoader, DataSource, VectorSource, mergeOptions} from '@loaders.gl/loader-utils';

import type {WFSCapabilities} from './wfs-capabilities-loader';
import {WFSCapabilitiesLoaderWithParser} from './wfs-capabilities-loader-with-parser';

import type {WMSLoaderOptions} from './wms-error-loader';
import {WMSErrorLoaderWithParser} from './wms-error-loader-with-parser';
import {parseGML} from './lib/parsers/gml/parse-gml';
import type {GMLFeatureCollection} from './lib/parsers/gml/parse-gml';
import type {CRSIdentifier} from '@math.gl/crs';
import {getServiceCRSAxisOrder, normalizeServiceCRS} from './crs-utils';

/* eslint-disable camelcase */ // WFS XML parameters use snake_case

/** Properties for creating a enw WFS service */
export type WFSourceOptions = DataSourceOptions & {
  wfs?: {
    /** In WFS 2.0.0, replaces references to EPSG:4326 with CRS:84. */
    substituteCRS84?: boolean;
    /** Default WFS parameters. If not provided here, must be provided in the various request */
    wfsParameters?: WFSParameters;
    /** Any additional service specific parameters */
    vendorParameters?: Record<string, unknown>;
  };
};

/** WFS protocol versions supported by the source URL builder. */
export type WFSVersion = '1.1.0' | '2.0.0';

/**
 * @deprecated This is a WIP, not fully implemented
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const WFSSourceLoader = {
  dataType: null as unknown as WFSVectorSource,
  batchType: null as never,
  name: 'WFS',
  id: 'wfs',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'wfs',
  fromUrl: true,
  fromBlob: false,

  options: {
    wfs: {}
  },

  defaultOptions: {
    wfs: {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('wfs'),
  createDataSource: (url: string, options: WFSourceOptions, coreApi?: CoreAPI): WFSVectorSource =>
    new WFSVectorSource(url, options, coreApi)
} as const satisfies SourceLoader<WFSVectorSource>;

// PARAMETER TYPES FOR WFS SOURCE

/**
 * "Static" WFS parameters (not viewport or selected pixel dependent)
 * These can be provided as defaults in the WFSVectorSource constructor
 */
export type WFSParameters = {
  /** WFS version (all requests) */
  version?: WFSVersion;
  /** Layers to render (GetMap, GetFeatureInfo) */
  layers?: string[];
  /** list of layers to query.. (GetFeatureInfo) */
  query_layers?: string[];

  /** Coordinate Reference System (CRS) for the image (not the bounding box) */
  crs?: CRSIdentifier;
  /** Output/input CRS parameter used by GetFeature requests. */
  srsName?: CRSIdentifier;
  /** Requested format for the return image (GetMap, GetLegendGraphic) */
  format?: 'image/png';
  /** Requested MIME type of returned feature info (GetFeatureInfo) */
  info_format?: 'text/plain' | 'application/geojson' | 'application/vnd.ogc.gml';
  /** Requested MIME type of WFS GetFeature responses. */
  outputFormat?:
    | 'application/json'
    | 'application/geo+json'
    | 'application/vnd.ogc.gml'
    | 'application/gml+xml';
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
  version?: WFSVersion;
};

/** Parameters for GetMap */
export type WFSGetMapParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: WFSVersion;
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
  crs?: CRSIdentifier;
  /** Styling. can be provided in service constructor */
  styles?: unknown;
  /** Don't render background when no data. can be provided in service constructor */
  transparent?: boolean;
  /** If layer supports time dimension */
  time?: string;
  /** If layer supports elevation dimension */
  elevation?: string;
};

/** Parameters for GetFeature. */
export type WFSGetFeatureParameters = {
  /** In case the endpoint supports multiple WFS versions. */
  version?: WFSVersion;
  /** Requested feature types. */
  typeName?: string | string[];
  /** Bounding box filter, optionally suffixed with the bbox CRS. */
  bbox: [number, number, number, number] | [number, number, number, number, CRSIdentifier];
  /** Output CRS for returned features. */
  crs?: CRSIdentifier;
  /** Output CRS for returned features. */
  srsName?: CRSIdentifier;
  /** Requested output format. */
  outputFormat?:
    | 'application/json'
    | 'application/geo+json'
    | 'application/vnd.ogc.gml'
    | 'application/gml+xml';
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
  version?: WFSVersion;
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
  crs?: CRSIdentifier;
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
  crs?: CRSIdentifier;
};

/** Parameters for DescribeLayer */
export type WFSDescribeLayerParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: WFSVersion;
};

/** Parameters for GetLegendGraphic */
export type WFSGetLegendGraphicParameters = {
  /** In case the endpoint supports multiple WFS versions */
  version?: WFSVersion;
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
  constructor(data: string, options: WFSourceOptions, coreApi?: CoreAPI) {
    super(data, options, WFSSourceLoader.defaultOptions, coreApi);

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

  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const url = this.getFeaturesURL(parameters);
    const response = await this.fetch(
      url,
      parameters.signal ? {signal: parameters.signal} : undefined
    );
    const arrayBuffer = await response.arrayBuffer();
    this._checkResponse(response, arrayBuffer);
    const text = new TextDecoder().decode(arrayBuffer);
    const featureCollection = parseWFSFeatureCollection(
      text,
      response.headers.get('content-type'),
      this.loadOptions
    );
    const geoJsonTable = parseGeoJSONTable(featureCollection);
    const format = parameters.format || 'arrow';

    switch (format) {
      case 'binary':
        return convertGeojsonToBinaryFeatureCollection(geoJsonTable.features);
      case 'geojson':
        return geoJsonTable;
      case 'arrow':
      default:
        return convertFeaturesToWKBArrowTable(geoJsonTable.features);
    }
  }

  /**
   * Streams a WFS GetFeature response as normalized vector batches.
   *
   * GML feature members are parsed as they arrive, allowing large WFS responses
   * to be consumed without holding the complete XML document in memory.
   */
  async *getFeaturesInBatches(
    parameters: GetFeaturesParameters,
    options: {batchSize?: number} = {}
  ): AsyncIterable<VectorSourceData> {
    const url = this.getFeaturesURL(parameters, {
      outputFormat: 'application/vnd.ogc.gml'
    });
    const response = await this.fetch(
      url,
      parameters.signal ? {signal: parameters.signal} : undefined
    );
    if (!response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      this._checkResponse(response, arrayBuffer);
    }
    if (!response.body) {
      const text = await response.text();
      if (isWFSExceptionDocument(text, response.headers.get('content-type'))) {
        throw new Error('WFS GetFeature returned an exception document');
      }
      yield convertWFSFeatures(parseGML(text, this.loadOptions), parameters.format);
      return;
    }

    const reader = response.body.getReader();
    const initialChunks: Uint8Array[] = [];
    let initialText = '';
    const textDecoder = new TextDecoder();
    while (initialText.length < 4096 && !initialText.includes('>')) {
      const {done, value} = await reader.read();
      if (done) break;
      if (value) {
        initialChunks.push(value);
        initialText += textDecoder.decode(value, {stream: true});
      }
    }
    initialText += textDecoder.decode();
    if (isWFSExceptionDocument(initialText, response.headers.get('content-type'))) {
      reader.releaseLock();
      throw new Error('WFS GetFeature returned an exception document');
    }

    const chunks = readResponseChunks(reader, initialChunks);
    const {GMLLoaderWithParser} = await import('./gml-loader-with-parser');
    for await (const batch of GMLLoaderWithParser.parseInBatches!(chunks, {
      ...this.loadOptions,
      gml: {batchSize: options.batchSize || 1000}
    })) {
      yield convertWFSFeatures(batch, parameters.format);
    }
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
    const capabilities = await WFSCapabilitiesLoaderWithParser.parse(arrayBuffer, this.loadOptions);
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
    const options: Required<WFSGetCapabilitiesParameters> = {
      version: wfsParameters?.version || this.options.wfs?.wfsParameters?.version || '2.0.0',
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

  /** Generate a URL for the GetFeature request. */
  getFeaturesURL(
    parameters: GetFeaturesParameters | WFSGetFeatureParameters,
    vendorParameters?: Record<string, unknown>
  ): string {
    const requestParameters = this._normalizeGetFeatureParameters(parameters);
    const options: WFSGetFeatureParameters & {version: WFSVersion} = {
      version: requestParameters.version || '2.0.0',
      typeName: requestParameters.typeName,
      bbox: requestParameters.bbox,
      srsName: requestParameters.srsName || requestParameters.crs || 'EPSG:4326',
      outputFormat:
        requestParameters.outputFormat ||
        this.options.wfs?.wfsParameters?.outputFormat ||
        'application/json'
    };
    return this._getWFSUrl('GetFeature', options, vendorParameters);
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
    wfsParameters: {version?: WFSVersion; [key: string]: unknown},
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

  _getWFS130Parameters<ParametersT extends {crs?: CRSIdentifier; srs?: CRSIdentifier}>(
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
        // WFS 1.1.0 uses SRS; WFS 2.0.0 uses CRS.
        if (wfsParameters.version !== '2.0.0') {
          key = 'srs';
          // } else if (this.substituteCRS84 && value === 'EPSG:4326') {
          //   /** In WFS 2.0.0, replace EPSG:4326 with the backwards-compatible CRS:84. */
          //   // Substitute by value
          //   value = 'CRS:84';
        }
        break;

      case 'srs':
        // WFS 1.1.0 uses SRS; WFS 2.0.0 uses CRS.
        if (wfsParameters.version === '2.0.0') {
          key = 'crs';
        }
        break;

      case 'bbox':
        // Coordinate order is flipped for certain CRS in WFS 1.1.0 and 2.0.0.
        const bbox = this._flipBoundingBox(value, wfsParameters);
        if (bbox) {
          value = bbox;
        }
        break;

      case 'srsName':
        key = 'srsName';
        break;

      case 'x':
        // i is the parameter used in WFS 2.0.0.
        if (wfsParameters.version === '2.0.0') {
          key = 'i';
        }
        break;

      case 'y':
        // j is the parameter used in WFS 2.0.0.
        if (wfsParameters.version === '2.0.0') {
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

  /** Coordinate order is flipped for certain CRS in WFS 1.1.0 and 2.0.0. */
  _flipBoundingBox(
    bboxValue: unknown,
    wfsParameters: WFSParameters
  ): [number, number, number, number] | [number, number, number, number, string] | null {
    // Sanity checks
    if (!Array.isArray(bboxValue) || (bboxValue.length !== 4 && bboxValue.length !== 5)) {
      return null;
    }

    const normalizedCRS = normalizeServiceCRS(wfsParameters.crs || wfsParameters.srsName);
    const flipCoordinates =
      (wfsParameters.version === '1.1.0' || wfsParameters.version === '2.0.0') &&
      getServiceCRSAxisOrder(normalizedCRS) === 'yx' &&
      !(this.options.wfs?.substituteCRS84 && normalizedCRS === 'EPSG:4326');

    const bbox = bboxValue as
      | [number, number, number, number]
      | [number, number, number, number, string];
    if (!flipCoordinates) {
      return bbox;
    }

    return bbox.length === 5
      ? [bbox[1], bbox[0], bbox[3], bbox[2], bbox[4]]
      : [bbox[1], bbox[0], bbox[3], bbox[2]];
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
    const contentType = response.headers.get('content-type') || '';
    const responseText = new TextDecoder().decode(arrayBuffer);
    if (!response.ok || isWFSExceptionDocument(responseText, contentType)) {
      // We want error responses to throw exceptions, the WMSErrorLoaderWithParser can do this
      const loadOptions = mergeOptions<WMSLoaderOptions>(this.loadOptions, {
        wms: {throwOnError: true}
      });
      const error = WMSErrorLoaderWithParser.parseSync?.(arrayBuffer, loadOptions);
      throw new Error(error);
    }
  }

  /** Error situation detected */
  protected _parseError(arrayBuffer: ArrayBuffer): Error {
    const error = WMSErrorLoaderWithParser.parseSync?.(arrayBuffer, this.loadOptions);
    return new Error(error);
  }

  /** Maps generic viewport parameters onto WFS GetFeature parameters. */
  private _normalizeGetFeatureParameters(
    parameters: GetFeaturesParameters | WFSGetFeatureParameters
  ): WFSGetFeatureParameters {
    if ('boundingBox' in parameters) {
      const crs = parameters.crs || 'EPSG:4326';
      return {
        version: this.options.wfs?.wfsParameters?.version || '2.0.0',
        typeName: parameters.layers,
        bbox: [
          parameters.boundingBox[0][0],
          parameters.boundingBox[0][1],
          parameters.boundingBox[1][0],
          parameters.boundingBox[1][1],
          crs
        ],
        crs,
        srsName: crs
      };
    }

    return parameters;
  }
}

/** Parses a GeoJSON FeatureCollection into the loaders.gl GeoJSON table shape. */
function parseGeoJSONTable(json: any): GeoJSONTable {
  if (json?.type === 'FeatureCollection' && Array.isArray(json.features)) {
    return {
      shape: 'geojson-table',
      type: 'FeatureCollection',
      features: json.features
    };
  }

  throw new Error('WFS GetFeature did not return a GeoJSON FeatureCollection');
}

/** Parses a WFS response as GeoJSON or GML based on its content. */
function parseWFSFeatureCollection(
  text: string,
  contentType: string | null,
  options: Record<string, unknown>
): GMLFeatureCollection | any {
  const trimmedText = text.trimStart();
  if (contentType?.includes('xml') || trimmedText.startsWith('<')) {
    return parseGML(text, options) as GMLFeatureCollection;
  }
  return JSON.parse(text);
}

/** Detects WFS exception reports without treating ordinary XML as an error. */
function isWFSExceptionDocument(text: string, contentType: string | null): boolean {
  return (
    contentType?.includes('application/vnd.ogc.se_xml') === true ||
    /<(?:[\w-]+:)?ServiceExceptionReport\b/i.test(text) ||
    /<(?:[\w-]+:)?ExceptionReport\b/i.test(text)
  );
}

/** Converts a GML feature collection into the generic vector source result. */
function convertWFSFeatures(
  parsed: Geometry | GMLFeatureCollection | null,
  format?: string
): VectorSourceData {
  if (!parsed || parsed.type !== 'FeatureCollection') {
    throw new Error('WFS GetFeature did not return a GML FeatureCollection');
  }
  if (format === 'geojson') {
    return {shape: 'geojson-table', type: 'FeatureCollection', features: parsed.features as any};
  }
  if (format === 'binary') {
    return convertGeojsonToBinaryFeatureCollection(parsed.features as any);
  }
  return convertFeaturesToWKBArrowTable(parsed.features as any);
}

/** Adapts a browser response stream to the chunk iterator expected by GML. */
async function* readResponseChunks(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  initialChunks: Uint8Array[] = []
): AsyncIterable<Uint8Array> {
  for (const chunk of initialChunks) {
    yield chunk;
  }
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) return;
      if (value) yield value;
    }
  } finally {
    reader.releaseLock();
  }
}
