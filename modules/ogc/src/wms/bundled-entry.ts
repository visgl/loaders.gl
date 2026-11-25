// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {CSWCapabilitiesLoaderWithParser as CSWCapabilitiesLoader} from './csw-capabilities-loader-with-parser';
export {CSWDomainLoaderWithParser as CSWDomainLoader} from './csw-domain-loader-with-parser';
export {CSWRecordsLoaderWithParser as CSWRecordsLoader} from './csw-records-loader-with-parser';
export {WMSErrorLoaderWithParser as WMSErrorLoader} from './wms-error-loader-with-parser';
export {WMTSCapabilitiesLoaderWithParser as WMTSCapabilitiesLoader} from './wmts-capabilities-loader-with-parser';
export {WMSCapabilitiesLoaderWithParser as WMSCapabilitiesLoader} from './wms-capabilities-loader-with-parser';
export {
  WFSCapabilitiesLoaderWithParser as WFSCapabilitiesLoader,
  WFSCapabilitiesLoaderWithParser as _WFSCapabilitiesLoader
} from './wfs-capabilities-loader-with-parser';
export {GMLLoaderWithParser as GMLLoader, GMLLoaderWithParser as _GMLLoader} from './gml-loader';
export {WMSFeatureInfoLoaderWithParser as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader-with-parser';
export {WMSLayerDescriptionLoaderWithParser as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader-with-parser';
export {WMTSCapabilitiesLoaderWithParser as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader-with-parser';
export {WCSCapabilitiesLoaderWithParser as _WCSCapabilitiesLoader} from './wip/wcs-capabilities-loader-with-parser';
export {CSWLoader, CSWCatalogSource} from './csw-loader';
export {WMSLoader, WMSImageSource, WMSLoader as WMSSource} from './wms-loader';
export {WMTSLoader, WMTSImageTileSource} from './wmts-loader';
export {WFSLoader, WFSVectorSource} from './wfs-loader';
export {
  OGCAPIFeaturesLoader,
  OGCAPITilesLoader,
  OGCAPIFeaturesSource,
  OGCAPITilesSource
} from './ogc-api-loaders';
export {OGCAPIEDRLoader, OGCAPIEDRSource} from './ogc-api-edr-loader';
export {OGCAPICoveragesLoader, OGCAPICoveragesSource} from './ogc-api-coverages-loader';
export {WCSCoverageLoader, WCSCoverageSource} from './wcs-coverage-loader';
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
export {DEFAULT_SERVICE_LOADERS} from './service-runtime';
export {ImageSource} from './lib/deprecated/image-source-compatibility';
export {ManagedVectorSource} from './managed-vector-source';
export type {
  CSWCapabilitiesLoaderOptions,
  CSWCapabilities,
  CSWDomain,
  CSWRecords,
  WMTSCapabilitiesLoaderOptions,
  WMTSCapabilities,
  WMSCapabilitiesLoaderOptions,
  _WFSLoaderOptions,
  _WFSCapabilities,
  GMLLoaderOptions,
  _GMLLoaderOptions,
  WMSCapabilities,
  WMSLayer,
  WMSBoundingBox,
  WMSDimension,
  _WMSFeatureInfo,
  _WMSLayerDescription,
  WMTSLayer,
  WMTSDimension,
  WMTSTileMatrixSetLink,
  WMTSTileMatrixLimits,
  WMTSTileMatrixSet,
  WMTSTileMatrix,
  _GeoJSON,
  CSWCatalogQuery,
  CSWRecord,
  CSWLoaderOptions,
  WMSLoaderOptions,
  WMTSLoaderOptions,
  WMTSGetFeatureInfoParameters,
  OGCTileMatrixSet,
  OGCTileMatrix,
  OGCTileMatrixSetCRS,
  OGCTileMatrixSetOptions,
  OGCTileMatrixLimits,
  ServiceCRS,
  FeaturePaginationOptions,
  WFSVersion,
  WFSGetFeatureParameters,
  WFSLoaderOptions,
  WFSFeatureType,
  OGCAPICollection,
  OGCAPILandingPage,
  OGCAPILink,
  OGCAPILoaderOptions,
  OGCAPITileMatrixSetSummary,
  OGCAPITileset,
  OGCAPIEDRQueryParameters,
  OGCAPIEDRLoaderOptions,
  OGCAPICoveragesQueryParameters,
  OGCAPICoveragesLoaderOptions,
  WCSCoverage,
  WCSCoverageMetadata,
  WCSGetCoverageParameters,
  WCSCoverageLoaderOptions,
  GeoServiceType,
  ServiceCapabilities,
  ServiceRuntimeOptions,
  ServiceTelemetryEvent,
  ServiceSourceLoader,
  ServiceEndpoint,
  ServiceEndpointPreferences,
  ImageType,
  ManagedVectorSourceOptions
} from './bundled';
