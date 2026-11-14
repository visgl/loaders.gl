// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// CSW - Catalog Service for the Web

export {
  CSWCapabilitiesFormat,
  CSWDomainFormat,
  CSWRecordsFormat,
  GMLFormat,
  WCSCapabilitiesFormat,
  WFSCapabilitiesFormat,
  WMSCapabilitiesFormat,
  WMSErrorFormat,
  WMSFeatureInfoFormat,
  WMSLayerDescriptionFormat,
  WMTSCapabilitiesFormat
} from './wms-format';

export type {CSWLoaderOptions} from './csw-capabilities-loader';

export type {CSWCapabilities} from './csw-capabilities-loader';
export {CSWCapabilitiesLoader} from './csw-capabilities-loader';

export type {CSWDomain} from './csw-domain-loader';
export {CSWDomainLoader} from './csw-domain-loader';

export type {CSWRecords} from './csw-records-loader';
export {CSWRecordsLoader} from './csw-records-loader';

// WMS - Web Map Service

export {WMSErrorLoader} from './wms-error-loader';

export type {
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension
} from './wms-capabilities-loader';
export type {WMSCapabilitiesLoaderOptions} from './wms-capabilities-loader';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';

export type {WMSFeatureInfo as _WMSFeatureInfo} from './wip/wms-feature-info-loader';
export {WMSFeatureInfoLoader as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader';

export type {WMSLayerDescription as _WMSLayerDescription} from './wip/wms-layer-description-loader';
export {WMSLayerDescriptionLoader as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader';

// WMTS - Web Map Tile Service

export type {WMTSLoaderOptions} from './wmts-capabilities-loader';
export type {
  WMTSCapabilities,
  WMTSLayer,
  WMTSDimension,
  WMTSTileMatrixSetLink,
  WMTSTileMatrixLimits,
  WMTSTileMatrixSet,
  WMTSTileMatrix
} from './lib/parsers/wmts/parse-wmts-capabilities';
export {WMTSCapabilitiesLoader} from './wmts-capabilities-loader';

// WFS - Web Feature Service

export type {WFSLoaderOptions as _WFSLoaderOptions} from './wfs-capabilities-loader';
export type {WFSCapabilities as _WFSCapabilities} from './wfs-capabilities-loader';
export {WFSCapabilitiesLoader as _WFSCapabilitiesLoader} from './wfs-capabilities-loader';

// GML - Geographic Markup Language

export type {GeoJSON as _GeoJSON} from '@loaders.gl/core/schema';
export type {GMLLoaderOptions, GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader-types';
export {GMLLoader, GMLLoader as _GMLLoader} from './gml-loader-types';

// EXPERIMENTAL: DATA SOURCES

// OGC Services

export type {
  CSWCatalogQuery,
  CSWRecord,
  CSWSourceLoaderOptions
} from './csw-source-loader';
export {CSWCatalogSource, CSWLoader} from './csw-source-loader';
export {WMSLoader, WMSImageSource} from './wms-source-loader';
export type {WMTSSourceLoaderOptions, WMTSGetFeatureInfoParameters} from './wmts-source-loader';
export {
  WMTSLoader,
  WMTSImageTileSource
} from './wmts-source-loader';
export type {
  OGCTileMatrixSet,
  OGCTileMatrix,
  OGCTileMatrixSetCRS,
  OGCTileMatrixSetOptions
} from './lib/parsers/ogc-api/tile-matrix-set';
export type {OGCTileMatrixLimits} from './lib/parsers/ogc-api/tile-matrix-limits';
export {convertOGCTileMatrixSetToTileGrid} from './lib/parsers/ogc-api/tile-matrix-set';
export type {ServiceCRS} from './crs-utils';
export {
  normalizeServiceCRS,
  areServiceCRSEquivalent,
  selectServiceCRS,
  getServiceCRSAxisOrder
} from './crs-utils';
export type {FeaturePaginationOptions} from './feature-pagination';
export {WFSLoader, WFSVectorSource} from './wfs-source-loader';
export type {WFSVersion, WFSGetFeatureParameters, WFSourceOptions} from './wfs-source-loader';
export type {WFSFeatureType} from './lib/parsers/wfs/parse-wfs-capabilities';
export type {
  OGCAPICollection,
  OGCAPILandingPage,
  OGCAPILink,
  OGCAPISourceOptions,
  OGCAPITileMatrixSetSummary,
  OGCAPITileset
} from './ogc-api-source-loader';
export {
  OGCAPIFeaturesSource,
  OGCAPIFeaturesLoader,
  OGCAPITilesSource,
  OGCAPITilesLoader
} from './ogc-api-source-loader';
export type {OGCAPIEDRQueryParameters, OGCAPIEDRSourceOptions} from './ogc-api-edr-source-loader';
export {
  OGCAPIEDRSource,
  OGCAPIEDRLoader
} from './ogc-api-edr-source-loader';
export type {
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesSourceOptions
} from './ogc-api-coverages-source-loader';
export {
  OGCAPICoveragesSource,
  OGCAPICoveragesLoader
} from './ogc-api-coverages-source-loader';
export type {
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSSourceOptions
} from './wcs-source-loader';
export {
  WCSCoverageSource,
  WCSCoverageLoader
} from './wcs-source-loader';

export type {GeoServiceType, ServiceCapabilities} from './service-capabilities';
export {
  normalizeWMSCapabilities,
  normalizeWMTSCapabilities,
  normalizeWFSCapabilities,
  normalizeTileServiceCapabilities,
  normalizeVectorServiceCapabilities
} from './service-capabilities';

export type {
  ServiceRuntimeOptions,
  ServiceTelemetryEvent,
  ServiceSourceLoader
} from './service-runtime';
export {DEFAULT_SERVICE_LOADERS, ServiceRequestError, ServiceRuntime} from './service-runtime';
export type {ServiceEndpoint, ServiceEndpointPreferences} from './capability-graph';
export {CapabilityGraph, discoverServiceGraph} from './capability-graph';

export type {ImageSource} from '@loaders.gl/core/loader-utils';
export type {ImageType} from '@loaders.gl/images';

export {ManagedVectorSource} from './managed-vector-source';
export type {ManagedVectorSourceOptions} from './managed-vector-source';
