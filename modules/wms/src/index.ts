// loaders.gl, MIT license

// CSW - Catalog Service for the Web

export type {CSWLoaderOptions} from './csw-capabilities-loader';

export type {CSWCapabilities} from './csw-capabilities-loader';
export {CSWCapabilitiesLoader} from './csw-capabilities-loader';

export type {CSWDomain} from './csw-domain-loader';
export {CSWDomainLoader} from './csw-domain-loader';

export type {CSWRecords} from './csw-records-loader';
export {CSWRecordsLoader} from './csw-records-loader';

// WMS - Web Map Service

export {WMSErrorLoader} from './wms-error-loader';

export type {WMSLoaderOptions} from './wms-capabilities-loader';

export type {WMSCapabilities} from './wms-capabilities-loader';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';

export type {WMSFeatureInfo as _WMSFeatureInfo} from './wip/wms-feature-info-loader';
export {WMSFeatureInfoLoader as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader';

export type {WMSLayerDescription as _WMSLayerDescription} from './wip/wms-layer-description-loader';
export {WMSLayerDescriptionLoader as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader';

// WMTS - Web Map Tile Service

export type {WMTSLoaderOptions as _WMTSLoaderOptions} from './wip/wmts-capabilities-loader';

export type {WMTSCapabilities as _WMTSCapabilities} from './wip/wmts-capabilities-loader';
export {WMTSCapabilitiesLoader as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader';

// WFS - Web Feature Service

export type {WFSLoaderOptions as _WFSLoaderOptions} from './wip/wfs-capabilities-loader';

export type {WFSCapabilities as _WFSCapabilities} from './wip/wfs-capabilities-loader';
export {WFSCapabilitiesLoader as _WFSCapabilitiesLoader} from './wip/wfs-capabilities-loader';

// GML - Geographic Markup Language

export type {GeoJSON as _GeoJSON} from '@loaders.gl/schema';
export type {GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader';
export {GMLLoader as _GMLLoader} from './gml-loader';

// EXPERIMENTAL: DATA SOURCES

// NOTE: Will likely move to tiles module
export type {ImageSourceMetadata} from './lib/data-sources/sources/image-source';
export type {ImageType} from '@loaders.gl/images';
export {ImageSource} from './lib/data-sources/sources/image-source';

export type {ImageServiceType} from './lib/data-sources/create-image-source';
export {createImageSource} from './lib/data-sources/create-image-source';

export type {ImageServiceProps} from './lib/data-sources/sources/image-service';
export {ImageService} from './lib/data-sources/sources/image-service';

// OGC Services
export {CSWService} from './lib/data-sources/ogc/csw-service';
export {WMSService} from './lib/data-sources/ogc/wms-service';

// ArcGIS Services

export {getArcGISServices as _getArcGISServices} from './lib/data-sources/arcgis/arcgis-server';
export {ArcGISImageServer as _ArcGISImageServer} from './lib/data-sources/arcgis/arcgis-image-service';

// LERC - Limited Error Raster Compression

// TODO - restore once esbuild bundling issues have been resolved
// export type {LERCData} from './lib/lerc/lerc-types';
// export {LERCLoader} from './lerc-loader';
