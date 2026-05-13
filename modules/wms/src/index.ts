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

// export type {WMTSLoaderOptions as _WMTSLoaderOptions} from './wip/wmts-capabilities-loader';
// export type {WMTSCapabilities as _WMTSCapabilities} from './wip/wmts-capabilities-loader';

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

// export {CSWSourceLoader} from './csw-source-loader';
export {WMSSourceLoader, WMSImageSource} from './wms-source-loader';
export {WFSSourceLoader, WFSVectorSource} from './wfs-source-loader';

// ArcGIS SourceLoaders

export {getArcGISServices as _getArcGISServices} from './arcgis/arcgis-server';
export {ArcGISFeatureServerSourceLoader as _ArcGISFeatureServerSourceLoader} from './arcgis/arcgis-feature-server-source-loader';
export {ArcGISImageServerSourceLoader as _ArcGISImageServerSourceLoader} from './arcgis/arcgis-image-server-source-loader';

export {ImageSource} from '@loaders.gl/loader-utils';
export type {ImageType} from '@loaders.gl/images';
export {createImageSource} from './lib/deprecated/create-image-source';

// DEPRECATED EXPORTS
/** @deprecated Use `WMSSourceLoader`. Kept for deck.gl compatibility. */
export {WMSSourceLoader as WMSSource} from './wms-source-loader';
