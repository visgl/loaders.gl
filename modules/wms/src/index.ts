// loaders.gl, MIT license

// WMS

export type {WMSCapabilities, WMSFeatureInfo, WMSLayerDescription} from './lib/wms/wms-types';
export type {WMSLoaderOptions} from './wms-capabilities-loader';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';
export {WMSFeatureInfoLoader} from './wms-feature-info-loader';
export {WMSLayerDescriptionLoader} from './wms-layer-description-loader';

export type {WMSDataSourceProps as _WMSDataSourceProps} from './lib/data-sources/wms-data-source';
export {WMSDataSource as _WMSDataSource} from './lib/data-sources/wms-data-source';

// WFS

export type {WFSCapabilities} from './lib/wfs/wfs-types';
export type {WFSLoaderOptions} from './wfs-capabilities-loader';
export {WFSCapabilitiesLoader} from './wfs-capabilities-loader';

// WMTS

export type {WMTSCapabilities} from './lib/wmts/wmts-types';
export type {WMTSLoaderOptions} from './wmts-capabilities-loader';
export {WMTSCapabilitiesLoader} from './wmts-capabilities-loader';

// GML

export type {GeoJSON} from '@loaders.gl/schema';
export type {GMLLoaderOptions} from './gml-loader';
export {GMLLoader} from './gml-loader';
