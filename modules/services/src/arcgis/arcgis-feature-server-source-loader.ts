// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataType, Schema, GeoJSONTable} from '@loaders.gl/schema';
import {
  convertFeaturesToWKBArrowTable,
  convertGeojsonToBinaryFeatureCollection
} from '@loaders.gl/gis';
import type {
  CoreAPI,
  DataSourceOptions,
  VectorSourceMetadata,
  GetFeaturesParameters,
  VectorSource,
  VectorSourceData
} from '@loaders.gl/loader-utils';
import type {SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {buildArcGISResourceURL} from './arcgis-url-utils';

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
export type ArcGISFeatureServerSourceLoaderOptions = DataSourceOptions & {
  'arcgis-feature-server'?: {
    /** Default ArcGIS query request parameters. */
    queryParameters?: Partial<ArcGISFeatureServiceQueryOptions>;
  };
};

/**
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export const ArcGISFeatureServerSourceLoader = {
  dataType: null as unknown as ArcGISVectorSource,
  batchType: null as never,
  name: 'ArcGISFeatureServer',
  id: 'arcgis-feature-server',
  module: 'services',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'arcgis-feature-server',
  fromUrl: true,
  fromBlob: false,

  options: {
    url: undefined!,
    'arcgis-feature-server': {}
  },

  defaultOptions: {
    url: undefined!,
    'arcgis-feature-server': {}
  },

  testURL: (url: string): boolean => url.toLowerCase().includes('featureserver'),
  createDataSource: (
    url: string,
    options: ArcGISFeatureServerSourceLoaderOptions,
    coreApi?: CoreAPI
  ): ArcGISVectorSource => new ArcGISVectorSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISVectorSource>;

/**
 * ArcGIS FeatureServer
 * Note - exports a big API, that could be exposed here if there is a use case
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/feature-service.htm
 */
export class ArcGISVectorSource
  extends DataSource<string, ArcGISFeatureServerSourceLoaderOptions>
  implements VectorSource
{
  /** Cached ArcGIS FeatureServer metadata request. */
  protected formatSpecificMetadata: Promise<any> | null = null;

  constructor(url: string, options: ArcGISFeatureServerSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, ArcGISFeatureServerSourceLoader.defaultOptions, coreApi);
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
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const url = this.getFeaturesURL(parameters);
    const response = await this.fetch(
      url,
      parameters.signal ? {signal: parameters.signal} : undefined
    );
    await this.checkResponse(response);
    const geoJsonTable = parseGeoJSONTable(await response.json());
    const format = parameters.format || 'arrow';

    switch (format) {
      case 'binary':
        return convertGeojsonToBinaryFeatureCollection(geoJsonTable.features);
      case 'geojson':
        return geoJsonTable;
      case 'arrow':
      default:
        return convertFeaturesToWKBArrowTable(geoJsonTable.features, {
          encodingPreference: parameters.geoarrow?.encodingPreference
        });
    }
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

    const layer = Array.isArray(parameters.layers) ? parameters.layers[0] : parameters.layers;
    const isLayerEndpoint = /\/FeatureServer\/\d+\/?(?:\?|$)/i.test(this.url);
    const resourcePath = isLayerEndpoint || !layer ? 'query' : `${layer}/query`;
    return this.getUrl(resourcePath, queryParameters);
  }

  /** Builds an ArcGIS FeatureServer URL. */
  protected getUrl(
    path: string,
    options: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): string {
    return buildArcGISResourceURL(this.url, path, {...options, ...extra});
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
    const extent = layer.extent;
    const spatialReference = layer.spatialReference || extent?.spatialReference;
    layers.push({
      name: layer.id === undefined ? layer.name : String(layer.id),
      title: layer.name,
      crs: getArcGISCoordinateReferenceSystems(spatialReference),
      boundingBox: normalizeArcGISExtent(extent)
    });
  }

  if (!layers.length && (json.id !== undefined || json.name)) {
    const extent = json.extent;
    layers.push({
      name: json.id === undefined ? json.name : String(json.id),
      title: json.name,
      crs: getArcGISCoordinateReferenceSystems(json.spatialReference || extent?.spatialReference),
      boundingBox: normalizeArcGISExtent(extent)
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

/** Normalizes an ArcGIS spatial reference to a one-element CRS list. */
function getArcGISCoordinateReferenceSystems(
  spatialReference: {wkid?: number; latestWkid?: number} | undefined
): string[] | undefined {
  const wellKnownIdentifier = spatialReference?.latestWkid || spatialReference?.wkid;
  return wellKnownIdentifier ? [`EPSG:${wellKnownIdentifier}`] : undefined;
}

/** Normalizes an ArcGIS extent to the loaders.gl two-corner shape. */
function normalizeArcGISExtent(
  extent: {xmin?: number; ymin?: number; xmax?: number; ymax?: number} | undefined
): [[number, number], [number, number]] | undefined {
  return extent && [extent.xmin, extent.ymin, extent.xmax, extent.ymax].every(Number.isFinite)
    ? [
        [extent.xmin!, extent.ymin!],
        [extent.xmax!, extent.ymax!]
      ]
    : undefined;
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
