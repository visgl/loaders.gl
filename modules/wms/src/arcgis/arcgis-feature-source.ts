// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Schema, GeoJSONTable} from '@loaders.gl/schema';
import type {
  CoreAPI,
  DataSourceOptions,
  VectorSourceMetadata,
  GetFeaturesParameters,
  VectorSource
} from '@loaders.gl/loader-utils';
import type {Source} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

/** Parameters for ArcGIS FeatureServer query requests. */
export type ArcGISFeatureServiceQueryOptions = {
  /** Include feature geometries in the response. */
  returnGeometry?: boolean;
  /** SQL where clause. */
  where?: string;
  /** Output spatial reference. */
  outSR?: string | number;
  /** Output fields. */
  outFields?: string | string[];
  /** Input spatial reference for supplied geometry. */
  inSR?: string | number;
  /** Filter geometry as an ArcGIS REST geometry string. */
  geometry?: string;
  /** Filter geometry type. */
  geometryType?:
    | 'esriGeometryEnvelope'
    | 'esriGeometryPoint'
    | 'esriGeometryPolyline'
    | 'esriGeometryPolygon';
  /** Spatial relationship for geometry filters. */
  spatialRel?:
    | 'esriSpatialRelIntersects'
    | 'esriSpatialRelContains'
    | 'esriSpatialRelCrosses'
    | 'esriSpatialRelEnvelopeIntersects'
    | 'esriSpatialRelIndexIntersects'
    | 'esriSpatialRelOverlaps'
    | 'esriSpatialRelTouches'
    | 'esriSpatialRelWithin';
  /** Geometry precision. */
  geometryPrecision?: number;
  /** Query result type. */
  resultType?: 'none' | 'standard' | 'tile';
  /** ArcGIS response format. */
  f?: 'geojson' | 'json' | 'pjson';
};

/** Options for the ArcGIS FeatureServer source. */
export type ArcGISFeatureServerSourceOptions = DataSourceOptions & {
  'arcgis-feature-server'?: {
    /** Default ArcGIS query request parameters. */
    queryParameters?: Partial<ArcGISFeatureServiceQueryOptions>;
  };
};

/**
 * @ndeprecated This is a WIP, not fully implemented
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const ArcGISFeatureServerSource = {
  name: 'ArcGISFeatureServer',
  id: 'arcgis-feature-server',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-feature-server',
  fromUrl: true,
  fromBlob: false,

  defaultOptions: {
    url: undefined!,
    'arcgis-feature-server': {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('featureserver'),
  createDataSource: (
    url: string,
    options: ArcGISFeatureServerSourceOptions,
    coreApi?: CoreAPI
  ): ArcGISVectorSource => new ArcGISVectorSource(url, options, coreApi)
} as const satisfies Source<ArcGISVectorSource>;

/**
 * ArcGIS FeatureServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export class ArcGISVectorSource
  extends DataSource<string, ArcGISFeatureServerSourceOptions>
  implements VectorSource
{
  /** Cached ArcGIS FeatureServer metadata request. */
  protected formatSpecificMetadata: Promise<any> | null = null;

  constructor(url: string, options: ArcGISFeatureServerSourceOptions, coreApi?: CoreAPI) {
    super(url, options, ArcGISFeatureServerSource.defaultOptions, coreApi);
  }

  /** Returns a schema inferred from ArcGIS FeatureServer metadata fields. */
  async getSchema(): Promise<Schema> {
    const metadata = await this.getFormatSpecificMetadata();
    return parseArcGISFeatureServerSchema(metadata);
  }

  /** Returns normalized VectorSource metadata. */
  async getMetadata(
    options: {formatSpecificMetadata?: boolean} = {}
  ): Promise<VectorSourceMetadata> {
    // Wait for raw metadata to load
    const formatSpecificMetadata = await this.getFormatSpecificMetadata();

    const metadata = parseArcGISFeatureServerMetadata(formatSpecificMetadata);

    // Only add the big blob of source metadata if explicitly requested
    if (options.formatSpecificMetadata) {
      metadata.formatSpecificMetadata = formatSpecificMetadata;
    }
    return metadata;
  }

  /** Requests features from the ArcGIS FeatureServer query endpoint. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<GeoJSONTable> {
    const url = this.getFeaturesURL(parameters);
    const response = await this.fetch(
      url,
      parameters.signal ? {signal: parameters.signal} : undefined
    );
    await this.checkResponse(response);
    return parseGeoJSONTable(await response.json());
  }

  /** Requests the raw ArcGIS FeatureServer metadata document. */
  protected async _getFormatSpecificMetadata() {
    // PJSON is formatted by a bit slower than JSON
    const url = this.metadataURL();
    const response = await this.fetch(url);
    await this.checkResponse(response);
    return await response.json();
  }

  /** Loads and caches the raw ArcGIS FeatureServer metadata. */
  protected async getFormatSpecificMetadata(): Promise<any> {
    this.formatSpecificMetadata ||= this._getFormatSpecificMetadata();
    return await this.formatSpecificMetadata;
  }

  /** Builds a metadata URL for the ArcGIS FeatureServer endpoint. */
  metadataURL(options?: {parameters?: Record<string, unknown>}): string {
    return this.getUrl('', {f: 'pjson', ...options?.parameters});
  }

  /** Builds a query URL from generic vector source parameters. */
  getFeaturesURL(parameters: GetFeaturesParameters): string {
    const defaultParameters = this.options['arcgis-feature-server']?.queryParameters || {};
    const spatialReference = normalizeArcGISSpatialReference(parameters.crs) || 4326;
    const queryParameters: ArcGISFeatureServiceQueryOptions = {
      returnGeometry: true,
      where: '1=1',
      outFields: '*',
      outSR: spatialReference,
      inSR: spatialReference,
      f: 'geojson',
      ...defaultParameters
    };

    if (parameters.boundingBox) {
      queryParameters.geometry = [
        parameters.boundingBox[0][0],
        parameters.boundingBox[0][1],
        parameters.boundingBox[1][0],
        parameters.boundingBox[1][1]
      ].join(',');
      queryParameters.geometryType = 'esriGeometryEnvelope';
      queryParameters.spatialRel ||= 'esriSpatialRelIntersects';
    }

    return this.getUrl('query', queryParameters);
  }

  /** Builds an ArcGIS FeatureServer URL. */
  protected getUrl(
    path: string,
    options: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): string {
    const baseUrl = path ? `${this.url}/${path}` : this.url;
    return `${baseUrl}?${encodeArcGISParameters({...options, ...extra})}`;
  }

  /** Checks an ArcGIS FeatureServer response. */
  protected async checkResponse(response: Response): Promise<void> {
    if (!response.ok) {
      throw new Error(
        response.statusText || `ArcGIS FeatureServer request failed: ${response.status}`
      );
    }
  }
}

function parseArcGISFeatureServerMetadata(json: any): VectorSourceMetadata {
  const layers: VectorSourceMetadata['layers'] = [];
  for (const layer of json.layers || []) {
    layers.push({
      // id: layer.id,
      name: layer.name
    });
  }

  return {
    // version: json.currentVersion || '',
    title: json.serviceDescription || '',
    name: json.serviceDescription || '',
    abstract: json.description || '',
    keywords: [],
    // attrribution: json.copyrightText || ''.
    // crs: 'EPSG:4326',
    layers
  };
}

/** Normalizes EPSG-prefixed CRS strings to ArcGIS WKID values. */
function normalizeArcGISSpatialReference(
  spatialReference: string | number | undefined
): string | number | undefined {
  if (typeof spatialReference === 'string') {
    const match = /^EPSG:(\d+)$/i.exec(spatialReference);
    if (match) {
      return match[1];
    }
  }
  return spatialReference;
}

/** Builds a schema from ArcGIS FeatureServer metadata fields. */
function parseArcGISFeatureServerSchema(json: any): Schema {
  const fields = Array.isArray(json.fields)
    ? json.fields.map((field: any) => ({
        name: field.name,
        type: getSchemaTypeFromArcGISFieldType(field.type),
        nullable: field.nullable
      }))
    : [];

  return {metadata: {}, fields};
}

/** Maps common ArcGIS field types to loaders.gl schema type strings. */
function getSchemaTypeFromArcGISFieldType(type: string): DataType {
  switch (type) {
    case 'esriFieldTypeDouble':
      return 'float64';
    case 'esriFieldTypeSingle':
      return 'float32';
    case 'esriFieldTypeInteger':
    case 'esriFieldTypeSmallInteger':
    case 'esriFieldTypeOID':
      return 'int32';
    case 'esriFieldTypeDate':
      return 'timestamp-millisecond';
    default:
      return 'utf8';
  }
}

/** Encodes ArcGIS REST query parameters. */
function encodeArcGISParameters(parameters: Record<string, unknown>): string {
  const searchParameters = new URLSearchParams();
  for (const [key, value] of Object.entries(parameters)) {
    if (value === undefined || value === null) {
      continue;
    }
    const encodedValue = Array.isArray(value) ? value.join(',') : String(value);
    searchParameters.set(key, encodedValue);
  }
  return searchParameters.toString();
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

  throw new Error('ArcGIS FeatureServer query did not return a GeoJSON FeatureCollection');
}
