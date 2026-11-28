// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {convertOGCTileMatrixSetToTileGrid} from './lib/parsers/ogc-api/tile-matrix-set';
export {
  normalizeServiceCRS,
  areServiceCRSEquivalent,
  selectServiceCRS,
  getServiceCRSAxisOrder
} from './crs-utils';
export {
  normalizeWMSCapabilities,
  normalizeWMTSCapabilities,
  normalizeWFSCapabilities,
  normalizeTileServiceCapabilities,
  normalizeVectorServiceCapabilities
} from './service-capabilities';
export {ServiceRequestError, ServiceRuntime} from './service-runtime';
export {CapabilityGraph, discoverServiceGraph} from './capability-graph';
export type {
  CSWCapabilitiesLoaderOptions,
  CSWCapabilities
} from './csw-capabilities-loader-with-parser';
export type {CSWDomain} from './csw-domain-loader-with-parser';
export type {CSWRecords} from './csw-records-loader-with-parser';
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
export type {WMSCapabilitiesLoaderOptions} from './wms-capabilities-loader-with-parser';
export type {
  WFSCapabilitiesLoaderOptions as _WFSLoaderOptions,
  WFSCapabilities as _WFSCapabilities
} from './wfs-capabilities-loader-with-parser';
export type {GMLLoaderOptions, GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader-types';
export type {
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension
} from './lib/parsers/wms/parse-wms-capabilities';
export type {WMSFeatureInfo as _WMSFeatureInfo} from './wip/wms-feature-info-loader';
export type {WMSLayerDescription as _WMSLayerDescription} from './wip/wms-layer-description-loader';
export type {GeoJSON as _GeoJSON} from '@loaders.gl/core/schema';
export type {CSWCatalogQuery, CSWRecord, CSWLoaderOptions} from './csw-loader';
export type {WMSLoaderOptions} from './wms-loader';
export type {WMTSLoaderOptions, WMTSGetFeatureInfoParameters} from './wmts-loader';
export type {
  OGCTileMatrixSet,
  OGCTileMatrix,
  OGCTileMatrixSetCRS,
  OGCTileMatrixSetOptions
} from './lib/parsers/ogc-api/tile-matrix-set';
export type {OGCTileMatrixLimits} from './lib/parsers/ogc-api/tile-matrix-limits';
export type {ServiceCRS, ServiceCRSAxisOrder, ServiceCRSAxisOrderOptions} from './crs-utils';
export type {FeaturePaginationOptions} from './feature-pagination';
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
export type {OGCAPIEDRQueryParameters, OGCAPIEDRLoaderOptions} from './ogc-api-edr-loader';
export type {
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesLoaderOptions
} from './ogc-api-coverages-loader';
export type {
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSCoverageLoaderOptions
} from './wcs-coverage-loader';
export type {GeoServiceType, ServiceCapabilities} from '@loaders.gl/core/loader-utils';
export type {
  ServiceRuntimeOptions,
  ServiceTelemetryEvent,
  ServiceSourceLoader
} from './service-runtime';
export type {ServiceEndpoint, ServiceEndpointPreferences} from './capability-graph';
export type {ImageType} from '@loaders.gl/images/image';
export type {ManagedVectorSourceOptions} from './managed-vector-source';
