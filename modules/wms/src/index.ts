// loaders.gl, MIT license

// WMS

export {WMSErrorLoader} from './wms-error-loader';

export type {WMSLoaderOptions} from './wms-capabilities-loader';

export type {WMSCapabilities} from './lib/wms/wms-types';
export {WMSCapabilitiesLoader} from './wms-capabilities-loader';

// NOTE: Will likely move to tiles module
export type {ImageSourceMetadata} from './lib/data-sources/image-source';
export type {ImageType} from '@loaders.gl/images';
export {ImageSource} from './lib/data-sources/image-source';

export type {ImageServiceType} from './lib/data-sources/create-image-source';
export {createImageSource} from './lib/data-sources/create-image-source';

export type {ImageServiceProps} from './lib/data-sources/image-services/image-service';
export {ImageService} from './lib/data-sources/image-services/image-service';
export {WMSService} from './lib/data-sources/image-services/wms-service';
export {ArcGISImageService as _ArcGISImageService} from './lib/data-sources/image-services/arcgis-image-service';

// WIP /////////////////////////////////////////////////////////////////
// Plumbing set up but details of parsing and typing not yet completed

// WMS

export type {WMSFeatureInfo as _WMSFeatureInfo} from './lib/wms/wms-types';
export {WMSFeatureInfoLoader as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader';

export type {WMSLayerDescription as _WMSLayerDescription} from './lib/wms/wms-types';
export {WMSLayerDescriptionLoader as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader';

// WMTS

export type {WMTSCapabilities as _WMTSCapabilities} from './lib/wmts/wmts-types';
export type {WMTSLoaderOptions as _WMTSLoaderOptions} from './wip/wmts-capabilities-loader';
export {WMTSCapabilitiesLoader as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader';

// WFS

export type {WFSCapabilities as _WFSCapabilities} from './lib/wfs/wfs-types';
export type {WFSLoaderOptions as _WFSLoaderOptions} from './wip/wfs-capabilities-loader';
export {WFSCapabilitiesLoader as _WFSCapabilitiesLoader} from './wip/wfs-capabilities-loader';

// GML

export type {GeoJSON as _GeoJSON} from '@loaders.gl/schema';
export type {GMLLoaderOptions as _GMLLoaderOptions} from './wip/gml-loader';
export {GMLLoader as _GMLLoader} from './wip/gml-loader';

// LERC

// TODO - restore once esbuild bundling issues have been resolved
// export type {LERCData} from './lib/lerc/lerc-types';
// export {LERCLoader} from './lerc-loader';
