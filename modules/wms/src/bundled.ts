// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {CSWLoaderOptions, CSWCapabilities} from './csw-capabilities-loader-with-parser';
export {CSWCapabilitiesLoaderWithParser as CSWCapabilitiesLoader} from './csw-capabilities-loader-with-parser';
export type {CSWDomain} from './csw-domain-loader-with-parser';
export {CSWDomainLoaderWithParser as CSWDomainLoader} from './csw-domain-loader-with-parser';
export type {CSWRecords} from './csw-records-loader-with-parser';
export {CSWRecordsLoaderWithParser as CSWRecordsLoader} from './csw-records-loader-with-parser';

export {WMSErrorLoaderWithParser as WMSErrorLoader} from './wms-error-loader-with-parser';
export type {WMSCapabilitiesLoaderOptions} from './wms-capabilities-loader-with-parser';
export {WMSCapabilitiesLoaderWithParser as WMSCapabilitiesLoader} from './wms-capabilities-loader-with-parser';

export type {WFSLoaderOptions as _WFSLoaderOptions} from './wfs-capabilities-loader-with-parser';
export type {WFSCapabilities as _WFSCapabilities} from './wfs-capabilities-loader-with-parser';
export {WFSCapabilitiesLoaderWithParser as WFSCapabilitiesLoader} from './wfs-capabilities-loader-with-parser';
export {WFSCapabilitiesLoaderWithParser as _WFSCapabilitiesLoader} from './wfs-capabilities-loader-with-parser';

export type {GMLLoaderOptions as _GMLLoaderOptions} from './gml-loader-with-parser';
export {GMLLoaderWithParser as GMLLoader} from './gml-loader-with-parser';
export {GMLLoaderWithParser as _GMLLoader} from './gml-loader-with-parser';
export {WMSFeatureInfoLoaderWithParser as _WMSFeatureInfoLoader} from './wip/wms-feature-info-loader-with-parser';
export {WMSLayerDescriptionLoaderWithParser as _WMSLayerDescriptionLoader} from './wip/wms-layer-description-loader-with-parser';
export {WMTSCapabilitiesLoaderWithParser as _WMTSCapabilitiesLoader} from './wip/wmts-capabilities-loader-with-parser';
export {WCSCapabilitiesLoaderWithParser as _WCSCapabilitiesLoader} from './wip/wcs-capabilities-loader-with-parser';
