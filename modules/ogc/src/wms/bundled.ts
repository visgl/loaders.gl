// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {
  CSWCapabilitiesLoaderOptions,
  CSWCapabilities
} from './csw-capabilities-loader-with-parser';
export {CSWCapabilitiesLoaderWithParser as CSWCapabilitiesLoader} from './csw-capabilities-loader-with-parser';
export type {CSWDomain} from './csw-domain-loader-with-parser';
export {CSWDomainLoaderWithParser as CSWDomainLoader} from './csw-domain-loader-with-parser';
export type {CSWRecords} from './csw-records-loader-with-parser';
export {CSWRecordsLoaderWithParser as CSWRecordsLoader} from './csw-records-loader-with-parser';

export {WMSErrorLoaderWithParser as WMSErrorLoader} from './wms-error-loader-with-parser';
export type {WMTSCapabilitiesLoaderOptions} from './wmts-capabilities-loader';
export type {WMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
export {WMTSCapabilitiesLoaderWithParser as WMTSCapabilitiesLoader} from './wmts-capabilities-loader-with-parser';
export type {WMSCapabilitiesLoaderOptions} from './wms-capabilities-loader-with-parser';
export {WMSCapabilitiesLoaderWithParser as WMSCapabilitiesLoader} from './wms-capabilities-loader-with-parser';

export type {WFSCapabilitiesLoaderOptions as _WFSLoaderOptions} from './wfs-capabilities-loader-with-parser';
export type {WFSCapabilities as _WFSCapabilities} from './wfs-capabilities-loader-with-parser';
export {WFSCapabilitiesLoaderWithParser as WFSCapabilitiesLoader} from './wfs-capabilities-loader-with-parser';
export {WFSCapabilitiesLoaderWithParser as _WFSCapabilitiesLoader} from './wfs-capabilities-loader-with-parser';

export type {GMLLoaderOptions, GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader-types';
export {GMLLoaderWithParser as GMLLoader} from './gml-loader';
export {GMLLoaderWithParser as _GMLLoader} from './gml-loader';
export {WMSFeatureInfoLoaderWithParser as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader-with-parser';
export {WMSLayerDescriptionLoaderWithParser as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader-with-parser';
export {WMTSCapabilitiesLoaderWithParser as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader-with-parser';
export {WCSCapabilitiesLoaderWithParser as _WCSCapabilitiesLoader} from './wip/wcs-capabilities-loader-with-parser';
export {CSWLoader} from './index';
export {WMSLoader} from './index';
export {WMTSLoader} from './index';
export {WFSLoader} from './index';
export {OGCAPIFeaturesLoader} from './index';
export {OGCAPITilesLoader} from './index';
export {OGCAPIEDRLoader} from './index';
export {OGCAPICoveragesLoader} from './index';
export {WCSCoverageLoader} from './index';
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
  WMTSCapabilitiesFormat,
  type WMSCapabilities,
  type WMSLayer,
  type WMSBoundingBox,
  type WMSDimension,
  type _WMSFeatureInfo,
  type _WMSLayerDescription,
  type WMTSLayer,
  type WMTSDimension,
  type WMTSTileMatrixSetLink,
  type WMTSTileMatrixLimits,
  type WMTSTileMatrixSet,
  type WMTSTileMatrix,
  type _GeoJSON,
  type CSWCatalogQuery,
  type CSWRecord,
  type CSWLoaderOptions,
  CSWCatalogSource,
  type WMSLoaderOptions,
  WMSImageSource,
  type WMTSLoaderOptions,
  type WMTSGetFeatureInfoParameters,
  WMTSImageTileSource,
  type OGCTileMatrixSet,
  type OGCTileMatrix,
  type OGCTileMatrixSetCRS,
  type OGCTileMatrixSetOptions,
  type OGCTileMatrixLimits,
  convertOGCTileMatrixSetToTileGrid,
  type ServiceCRS,
  normalizeServiceCRS,
  areServiceCRSEquivalent,
  selectServiceCRS,
  getServiceCRSAxisOrder,
  type FeaturePaginationOptions,
  WFSVectorSource,
  type WFSVersion,
  type WFSGetFeatureParameters,
  type WFSLoaderOptions,
  type WFSFeatureType,
  type OGCAPICollection,
  type OGCAPILandingPage,
  type OGCAPILink,
  type OGCAPILoaderOptions,
  type OGCAPITileMatrixSetSummary,
  type OGCAPITileset,
  OGCAPIFeaturesSource,
  OGCAPITilesSource,
  type OGCAPIEDRQueryParameters,
  type OGCAPIEDRLoaderOptions,
  OGCAPIEDRSource,
  type OGCAPICoveragesQueryParameters,
  type OGCAPICoveragesLoaderOptions,
  OGCAPICoveragesSource,
  type WCSCoverage,
  type WCSCoverageMetadata,
  type WCSGetCoverageParameters,
  type WCSCoverageLoaderOptions,
  WCSCoverageSource,
  type GeoServiceType,
  type ServiceCapabilities,
  normalizeWMSCapabilities,
  normalizeWMTSCapabilities,
  normalizeWFSCapabilities,
  normalizeTileServiceCapabilities,
  normalizeVectorServiceCapabilities,
  type ServiceRuntimeOptions,
  type ServiceTelemetryEvent,
  type ServiceSourceLoader,
  DEFAULT_SERVICE_LOADERS,
  ServiceRequestError,
  ServiceRuntime,
  type ServiceEndpoint,
  type ServiceEndpointPreferences,
  CapabilityGraph,
  discoverServiceGraph,
  ImageSource,
  WMSSource,
  type ImageType,
  ManagedVectorSource,
  type ManagedVectorSourceOptions
} from './index';
