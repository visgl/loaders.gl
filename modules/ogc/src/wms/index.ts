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

export type {CSWCapabilitiesLoaderOptions} from './csw-capabilities-loader';

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

export type {WMTSCapabilitiesLoaderOptions} from './wmts-capabilities-loader';
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

export type {WFSCapabilitiesLoaderOptions as _WFSLoaderOptions} from './wfs-capabilities-loader';
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
  CSWLoaderOptions
} from './csw-loader';
export {CSWCatalogSource, CSWLoader} from './csw-loader';
export type {WMSLoaderOptions} from './wms-loader';
export {WMSLoader, WMSImageSource} from './wms-loader';
export type {WMTSLoaderOptions, WMTSGetFeatureInfoParameters} from './wmts-loader';
export {
  WMTSLoader,
  WMTSImageTileSource
} from './wmts-loader';
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
export {WFSLoader, WFSVectorSource} from './wfs-loader';
export type {WFSVersion, WFSGetFeatureParameters, WFSLoaderOptions} from './wfs-loader';
export type {WFSFeatureType} from './lib/parsers/wfs/parse-wfs-capabilities';
export type {
  OGCAPICollection,
  OGCAPILandingPage,
  OGCAPILink,
  OGCAPILoaderOptions,
  OGCAPITileMatrixSetSummary,
  OGCAPITileset
} from './ogc-api-loaders';
export {
  OGCAPIFeaturesSource,
  OGCAPIFeaturesLoader,
  OGCAPITilesSource,
  OGCAPITilesLoader
} from './ogc-api-loaders';
export type {OGCAPIEDRQueryParameters, OGCAPIEDRLoaderOptions} from './ogc-api-edr-loader';
export {
  OGCAPIEDRSource,
  OGCAPIEDRLoader
} from './ogc-api-edr-loader';
export type {
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesLoaderOptions
} from './ogc-api-coverages-loader';
export {
  OGCAPICoveragesSource,
  OGCAPICoveragesLoader
} from './ogc-api-coverages-loader';
export type {
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSCoverageLoaderOptions
} from './wcs-coverage-loader';
export {
  WCSCoverageSource,
  WCSCoverageLoader
} from './wcs-coverage-loader';

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
