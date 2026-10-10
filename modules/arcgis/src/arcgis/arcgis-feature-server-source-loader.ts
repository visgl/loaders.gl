// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISAuthentication} from '../authentication';
import {ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA} from '../arcgis-source-types';
import type {
  ArcGISFeatureServiceQueryOptions,
  ArcGISFeatureServerSourceLoaderOptions
} from '../arcgis-source-types';

import type {DataType, Schema} from '@loaders.gl/schema';
import {convertFeaturesToWKBArrowTable} from '@loaders.gl/arrow-geometry/feature-collection-to-arrow';
import {convertGeojsonToBinaryFeatureCollection} from '@loaders.gl/arrow-geometry/legacy-binary';
import type {
  CoreAPI,
  VectorSourceMetadata,
  GetFeaturesParameters,
  VectorSource,
  VectorSourceData
} from '@loaders.gl/loader-utils';
import type {SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {buildArcGISResourceURL} from './arcgis-url-utils';
import {ArcGISFeatureQueryClient} from './arcgis-feature-query';
import type {
  ArcGISFeatureQueryParameters,
  ArcGISFeatureQueryOptions,
  ArcGISFeatureQueryResult,
  ArcGISFeatureObjectIds,
  ArcGISFeatureExtent
} from '../arcgis-feature-query-types';
export {ArcGISFeatureQueryError} from './arcgis-feature-query';

/** Runtime service loader for synchronous construction. */
export const ArcGISFeatureServerSourceLoaderWithParser = {
  ...ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA,
  dataType: null as unknown as ArcGISVectorSource,
  batchType: null as never,
  preload: undefined,
  /** Supplies ArcGIS credentials after loading the selected implementation. */
  getAuthentications: () => [ArcGISAuthentication],
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

  /** Creates a query source for a FeatureServer or queryable MapServer layer. */
  constructor(url: string, options: ArcGISFeatureServerSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, ARCGIS_FEATURE_SERVER_SOURCE_LOADER_METADATA.defaultOptions, coreApi);
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

  /** Retrieves the complete filtered query, rejecting partial results before format conversion. */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    const result = await this.queryFeatures(parameters);
    if (!result.complete) {
      throw new Error(
        `Incomplete ArcGIS query (${result.reason}): ${result.loaded}/${result.expectedCount}. Use queryFeatures() to inspect partial results.`
      );
    }
    const features = result.data.features;
    switch (parameters.format || 'arrow') {
      case 'binary':
        if (features.some(feature => !feature.geometry)) {
          throw new Error('Binary output cannot retain null geometries; use geojson or arrow');
        }
        return convertGeojsonToBinaryFeatureCollection(features);
      case 'geojson':
        return result.data;
      default:
        return convertFeaturesToWKBArrowTable(features, {
          encodingPreference: parameters.geoarrow?.encodingPreference
        });
    }
  }

  /** Collects a bounded query and returns explicit completeness evidence alongside its data. */
  async queryFeatures(
    parameters: ArcGISFeatureQueryOptions = {}
  ): Promise<ArcGISFeatureQueryResult> {
    let result: ArcGISFeatureQueryResult | undefined;
    const features: ArcGISFeatureQueryResult['data']['features'] = [];
    for await (const page of this.queryFeaturePages(parameters)) {
      for (const feature of page.data.features) features.push(feature);
      result = page;
    }
    return {...result!, data: {shape: 'geojson-table', type: 'FeatureCollection', features}};
  }

  /** Streams unique records with cumulative progress; breaking iteration stops subsequent work. */
  queryFeaturePages(
    parameters: ArcGISFeatureQueryOptions = {}
  ): AsyncGenerator<ArcGISFeatureQueryResult> {
    return this.createQueryClient(parameters).getPages(parameters);
  }

  /** Requests one page, explicitly marked incomplete regardless of the server transfer flag. */
  queryFeaturePage(parameters: ArcGISFeatureQueryOptions = {}): Promise<ArcGISFeatureQueryResult> {
    return this.createQueryClient(parameters).getPage(parameters);
  }

  /** Returns the current count for the selected query filters. */
  queryCount(parameters: ArcGISFeatureQueryParameters = {}): Promise<number> {
    return this.createQueryClient(parameters).getCount();
  }

  /** Returns object IDs with truncation information; use queryFeatures() for complete retrieval. */
  queryObjectIds(parameters: ArcGISFeatureQueryParameters = {}): Promise<ArcGISFeatureObjectIds> {
    return this.createQueryClient(parameters).getObjectIds();
  }

  /** Returns query bounds and their explicit spatial reference. */
  queryExtent(parameters: ArcGISFeatureQueryParameters = {}): Promise<ArcGISFeatureExtent> {
    return this.createQueryClient(parameters).getExtent();
  }

  /** Shares transport and query filters across summary and data operations. */
  private createQueryClient(parameters: ArcGISFeatureQueryParameters): ArcGISFeatureQueryClient {
    return new ArcGISFeatureQueryClient(
      this.getLayerURL(parameters),
      this.fetch.bind(this),
      this.getQueryParameters(parameters),
      parameters.signal
    );
  }

  /** Requests the raw ArcGIS FeatureServer metadata document. */
  protected async _getFormatSpecificMetadata() {
    // PJSON is formatted by a bit slower than JSON
    const url = this.metadataURL();
    return await new ArcGISFeatureQueryClient(url, this.fetch.bind(this), {}).request('');
  }

  /** Loads and caches the raw ArcGIS FeatureServer metadata. */
  protected async getFormatSpecificMetadata(): Promise<any> {
    this.formatSpecificMetadata ||= this._getFormatSpecificMetadata().catch(error => {
      this.formatSpecificMetadata = null;
      throw error;
    });
    return await this.formatSpecificMetadata;
  }

  /** Builds a metadata URL for the ArcGIS FeatureServer endpoint. */
  metadataURL(options?: {parameters?: Record<string, unknown>}): string {
    return this.getUrl('', {f: 'pjson', ...options?.parameters});
  }

  /** Builds a query URL from generic vector source parameters. */
  getFeaturesURL(parameters: ArcGISFeatureQueryParameters): string {
    return buildArcGISResourceURL(
      this.getLayerURL(parameters),
      'query',
      this.getQueryParameters(parameters)
    );
  }

  /** Selects exactly one layer; service roots must not silently query an unspecified layer. */
  private getLayerURL(parameters: ArcGISFeatureQueryParameters): string {
    const url = new URL(this.url);
    const layerIdentifiers = Array.isArray(parameters.layers)
      ? parameters.layers
      : parameters.layers === undefined
        ? []
        : [parameters.layers];
    if (layerIdentifiers.length > 1)
      throw new Error('ArcGIS feature queries require exactly one layer');
    const match = /\/(?:FeatureServer|MapServer)(?:\/(\d+))?\/?$/i.exec(url.pathname);
    if (!match) throw new Error('Expected an ArcGIS FeatureServer or MapServer layer URL');
    const layer = layerIdentifiers[0];
    if (match[1]) {
      if (layer !== undefined && String(layer) !== match[1])
        throw new Error('Layer selection conflicts with the endpoint URL');
      return url.toString();
    }
    if (layer === undefined || !/^\d+$/.test(String(layer)))
      throw new Error('Select a layer ID when querying an ArcGIS service root');
    return buildArcGISResourceURL(this.url, String(layer), {});
  }

  /** Applies source defaults and per-request filters consistently across all query operations. */
  private getQueryParameters(
    parameters: ArcGISFeatureQueryParameters
  ): ArcGISFeatureServiceQueryOptions {
    const defaultParameters = this.options['arcgis-feature-server']?.queryParameters || {};
    const outputSpatialReference = normalizeArcGISSpatialReference(parameters.crs) || 4326;
    const requestSpatialReference =
      normalizeArcGISSpatialReference(parameters.requestCrs) || outputSpatialReference;
    const queryParameters: ArcGISFeatureServiceQueryOptions = {
      returnGeometry: true,
      where: '1=1',
      outFields: '*',
      outSR: outputSpatialReference,
      inSR: requestSpatialReference,
      f: 'geojson',
      ...defaultParameters,
      ...parameters.query
    };
    if (parameters.crs !== undefined) queryParameters.outSR = outputSpatialReference;
    if (parameters.requestCrs !== undefined) queryParameters.inSR = requestSpatialReference;
    if (parameters.boundingBox) {
      const coordinates = parameters.boundingBox.flat();
      if (
        !coordinates.every(Number.isFinite) ||
        coordinates[0] > coordinates[2] ||
        coordinates[1] > coordinates[3]
      ) {
        throw new Error(
          'ArcGIS boundingBox must contain finite ordered coordinates; split antimeridian queries'
        );
      }
      queryParameters.geometry = coordinates.join(',');
      queryParameters.geometryType = 'esriGeometryEnvelope';
      queryParameters.spatialRel ||= 'esriSpatialRelIntersects';
    }
    return queryParameters;
  }

  /** Builds an ArcGIS FeatureServer URL. */
  protected getUrl(
    path: string,
    options: Record<string, unknown>,
    extra?: Record<string, unknown>
  ): string {
    return buildArcGISResourceURL(this.url, path, {...options, ...extra});
  }
}

/** Normalizes layer and nonspatial table metadata. */
function parseArcGISFeatureServerMetadata(json: any): VectorSourceMetadata {
  const layers: VectorSourceMetadata['layers'] = [];
  for (const layer of [...(json.layers || []), ...(json.tables || [])]) {
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
  if (spatialReference !== undefined && !/^\d+$/.test(String(spatialReference))) {
    throw new Error('ArcGIS query CRS must be a numeric WKID or EPSG identifier');
  }
  return spatialReference;
}

/** Builds a schema from ArcGIS FeatureServer metadata fields. */
function parseArcGISFeatureServerSchema(json: any): Schema {
  const fields = Array.isArray(json.fields)
    ? json.fields.map((field: any) => ({
        name: field.name,
        type:
          field.type === 'esriFieldTypeOID' && field.length === 8
            ? 'int64'
            : getSchemaTypeFromArcGISFieldType(field.type),
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
    case 'esriFieldTypeSmallInteger':
      return 'int16';
    case 'esriFieldTypeBigInteger':
      return 'int64';
    case 'esriFieldTypeInteger':
    case 'esriFieldTypeOID':
      return 'int32';
    case 'esriFieldTypeDate':
      return 'timestamp-millisecond';
    default:
      return 'utf8';
  }
}
