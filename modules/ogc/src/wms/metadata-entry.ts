// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {CSWCapabilitiesLoader} from './csw-capabilities-loader';
export {CSWDomainLoader} from './csw-domain-loader';
export {CSWRecordsLoader} from './csw-records-loader';
export {WMSErrorLoader} from './wms-error-loader';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';
export {WMSFeatureInfoLoader as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader';
export {WMSLayerDescriptionLoader as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader';
export {WMTSCapabilitiesLoader} from './wmts-capabilities-loader';
export {WFSCapabilitiesLoader as _WFSCapabilitiesLoader} from './wfs-capabilities-loader';
export {GMLLoader} from './gml-loader-types';
export {GMLLoader as _GMLLoader} from './gml-loader-types';
export {CSWCapabilitiesFormat} from './wms-format';
export {CSWDomainFormat} from './wms-format';
export {CSWRecordsFormat} from './wms-format';
export {GMLFormat} from './wms-format';
export {WCSCapabilitiesFormat} from './wms-format';
export {WFSCapabilitiesFormat} from './wms-format';
export {WMSCapabilitiesFormat} from './wms-format';
export {WMSErrorFormat} from './wms-format';
export {WMSFeatureInfoFormat} from './wms-format';
export {WMSLayerDescriptionFormat} from './wms-format';
export {WMTSCapabilitiesFormat} from './wms-format';
export type {CSWCapabilitiesLoaderOptions, CSWCapabilities} from './csw-capabilities-loader';
export type {CSWDomain} from './csw-domain-loader';
export type {CSWRecords} from './csw-records-loader';
export type {
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension
} from './lib/parsers/wms/parse-wms-capabilities';
export type {WMSCapabilitiesLoaderOptions} from './wms-capabilities-loader';
export type {WMSFeatureInfo as _WMSFeatureInfo} from './wip/wms-feature-info-loader';
export type {WMSLayerDescription as _WMSLayerDescription} from './wip/wms-layer-description-loader';
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
export type {
  WFSCapabilitiesLoaderOptions as _WFSLoaderOptions,
  WFSCapabilities as _WFSCapabilities
} from './wfs-capabilities-loader';
export type {GeoJSON as _GeoJSON} from '@loaders.gl/core/schema';
export type {GMLLoaderOptions, GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader-types';
export type {CSWCatalogQuery, CSWRecord, CSWLoaderOptions, CSWCatalogSource} from './csw-loader';
export type {WMSLoaderOptions, WMSImageSource, WMSLoader as WMSSource} from './wms-loader';
export type {
  WMTSLoaderOptions,
  WMTSGetFeatureInfoParameters,
  WMTSImageTileSource
} from './wmts-loader';
export type {
  OGCTileMatrixSet,
  OGCTileMatrix,
  OGCTileMatrixSetCRS,
  OGCTileMatrixSetOptions,
  convertOGCTileMatrixSetToTileGrid
} from './lib/parsers/ogc-api/tile-matrix-set';
export type {OGCTileMatrixLimits} from './lib/parsers/ogc-api/tile-matrix-limits';
export type {
  ServiceCRS,
  normalizeServiceCRS,
  areServiceCRSEquivalent,
  selectServiceCRS,
  getServiceCRSAxisOrder
} from './crs-utils';
export type {FeaturePaginationOptions} from './feature-pagination';
export type {
  WFSVectorSource,
  WFSVersion,
  WFSGetFeatureParameters,
  WFSLoaderOptions
} from './wfs-loader';
export type {WFSFeatureType} from './lib/parsers/wfs/parse-wfs-capabilities';
export type {
  OGCAPICollection,
  OGCAPILandingPage,
  OGCAPILink,
  OGCAPILoaderOptions,
  OGCAPITileMatrixSetSummary,
  OGCAPITileset,
  OGCAPIFeaturesSource,
  OGCAPITilesSource
} from './ogc-api-loaders';
export type {
  OGCAPIEDRQueryParameters,
  OGCAPIEDRLoaderOptions,
  OGCAPIEDRSource
} from './ogc-api-edr-loader';
export type {
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesLoaderOptions,
  OGCAPICoveragesSource
} from './ogc-api-coverages-loader';
export type {
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSCoverageLoaderOptions,
  WCSCoverageSource
} from './wcs-coverage-loader';
export type {GeoServiceType, ServiceCapabilities} from '@loaders.gl/core/loader-utils';
export type {
  normalizeWMSCapabilities,
  normalizeWMTSCapabilities,
  normalizeWFSCapabilities,
  normalizeTileServiceCapabilities,
  normalizeVectorServiceCapabilities
} from './service-capabilities';
export type {
  ServiceRuntimeOptions,
  ServiceTelemetryEvent,
  ServiceSourceLoader,
  DEFAULT_SERVICE_LOADERS,
  ServiceRequestError,
  ServiceRuntime
} from './service-runtime';
export type {
  ServiceEndpoint,
  ServiceEndpointPreferences,
  CapabilityGraph,
  discoverServiceGraph
} from './capability-graph';
export type {ImageSource} from './lib/deprecated/image-source-compatibility';
export type {ImageType} from '@loaders.gl/images/image';
export type {ManagedVectorSource, ManagedVectorSourceOptions} from './managed-vector-source';
export {CSWLoader} from './csw-loader-metadata';
export {WMSLoader} from './wms-loader-metadata';
export {WMTSLoader} from './wmts-loader-metadata';
export {WFSLoader} from './wfs-loader-metadata';
export {OGCAPIFeaturesLoader} from './ogc-api-loaders-metadata';
export {OGCAPITilesLoader} from './ogc-api-loaders-metadata';
export {OGCAPIEDRLoader} from './ogc-api-edr-loader-metadata';
export {OGCAPICoveragesLoader} from './ogc-api-coverages-loader-metadata';
export {WCSCoverageLoader} from './wcs-coverage-loader-metadata';
