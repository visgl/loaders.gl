// loaders.gl, MIT license

// WMS

export {WMSErrorLoader} from './wms-error-loader';

export type {WMSCapabilities, WMSFeatureInfo, WMSLayerDescription} from './lib/wms/wms-types';
export type {WMSLoaderOptions} from './wms-capabilities-loader';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';
export {WMSFeatureInfoLoader} from './wms-feature-info-loader';
export {WMSLayerDescriptionLoader} from './wms-layer-description-loader';

export type {WMSServiceProps} from './lib/data-sources/wms-service';
export {WMSService} from './lib/data-sources/wms-service';

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

// LERC

export type {LERCData} from './lib/lerc/lerc-types';
export {LERCLoader} from './lerc-loader';
