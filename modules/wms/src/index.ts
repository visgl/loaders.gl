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
export type {WMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
export {WMTSCapabilitiesLoader} from './wmts-capabilities-loader';

// WFS - Web Feature Service

export type {WFSLoaderOptions as _WFSLoaderOptions} from './wfs-capabilities-loader';
export type {WFSCapabilities as _WFSCapabilities} from './wfs-capabilities-loader';
export {WFSCapabilitiesLoader as _WFSCapabilitiesLoader} from './wfs-capabilities-loader';

// GML - Geographic Markup Language

export type {GeoJSON as _GeoJSON} from '@loaders.gl/schema';
export type {GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader';
export {GMLLoader as _GMLLoader} from './gml-loader';

// EXPERIMENTAL: DATA SOURCES

// OGC Services

export type {
  CSWCatalogQuery,
  CSWRecord,
  CSWSourceLoaderOptions
} from './csw-source-loader';
export {CSWCatalogSource, CSWSourceLoader} from './csw-source-loader';
export {WMSSourceLoader, WMSImageSource} from './wms-source-loader';
export type {WMTSSourceLoaderOptions} from './wmts-source-loader';
export {WMTSSourceLoader, WMTSImageTileSource} from './wmts-source-loader';
export type {ServiceCRS} from './crs-utils';
export {
  normalizeServiceCRS,
  areServiceCRSEquivalent,
  selectServiceCRS,
  getServiceCRSAxisOrder
} from './crs-utils';
export {WFSSourceLoader, WFSVectorSource} from './wfs-source-loader';
export type {WFSVersion} from './wfs-source-loader';
export type {
  OGCAPICollection,
  OGCAPILandingPage,
  OGCAPILink,
  OGCAPISourceOptions
} from './ogc-api-source-loader';
export {
  OGCAPIFeaturesSource,
  OGCAPIFeaturesSourceLoader,
  OGCAPITilesSource,
  OGCAPITilesSourceLoader
} from './ogc-api-source-loader';
export type {OGCAPIEDRQueryParameters, OGCAPIEDRSourceOptions} from './ogc-api-edr-source-loader';
export {
  OGCAPIEDRSource,
  OGCAPIEDRSourceLoader
} from './ogc-api-edr-source-loader';
export type {
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesSourceOptions
} from './ogc-api-coverages-source-loader';
export {
  OGCAPICoveragesSource,
  OGCAPICoveragesSourceLoader
} from './ogc-api-coverages-source-loader';
export type {
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSSourceOptions
} from './wcs-source-loader';
export {WCSCoverageSource, WCSCoverageSourceLoader} from './wcs-source-loader';

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

export {ImageSource} from './lib/deprecated/image-source-compatibility';
export type {ImageType} from '@loaders.gl/images';
export {createImageSource} from './lib/deprecated/create-image-source';

// DEPRECATED EXPORTS
/** @deprecated Use `WMSSourceLoader`. Kept for deck.gl compatibility. */
export {WMSSourceLoader as WMSSource} from './wms-source-loader';
