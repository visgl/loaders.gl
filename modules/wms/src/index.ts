// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

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

// export type {WMTSLoaderOptions as _WMTSLoaderOptions} from './wip/wmts-capabilities-loader';
// export type {WMTSCapabilities as _WMTSCapabilities} from './wip/wmts-capabilities-loader';
// export {WMTSCapabilitiesLoader as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader';

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

// export {CSWSource} from './services/ogc/csw-service';
export {WMSSource, WMSImageSource} from './services/ogc/wms-service';

// ArcGIS SourceLoaders

export {getArcGISServices as _getArcGISServices} from './services/arcgis/arcgis-server';
export {ArcGISImageServerSource as _ArcGISImageServerSource} from './services/arcgis/arcgis-image-server';

// DEPRECATED: TODO - remove once deck.gl has been udpated
export {ImageSource} from '@loaders.gl/loader-utils';
export type {ImageType} from '@loaders.gl/images';
export type {ImageServiceType} from './lib/deprecated/create-image-source';
export {createImageSource} from './lib/deprecated/create-image-source';
