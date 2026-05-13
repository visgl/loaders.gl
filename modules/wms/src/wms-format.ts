// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

const xml = (name: string, id: string, format: string): Format => ({
  name,
  id,
  module: 'wms',
  encoding: 'xml',
  format,
  extensions: ['xml'],
  mimeTypes: ['application/xml', 'text/xml'],
  text: true
});

export const GMLFormat = xml('GML', 'gml', 'gml');
export const WMSCapabilitiesFormat = xml(
  'WMS Capabilities',
  'wms-capabilities',
  'wms-capabilities'
);
export const WFSCapabilitiesFormat = xml(
  'WFS Capabilities',
  'wfs-capabilities',
  'wfs-capabilities'
);
export const WMSErrorFormat = xml('WMS Error', 'wms-error', 'wms-error');
export const CSWCapabilitiesFormat = xml(
  'CSW Capabilities',
  'csw-capabilities',
  'csw-capabilities'
);
export const CSWDomainFormat = xml('CSW Domain', 'csw-domain', 'csw-domain');
export const CSWRecordsFormat = xml('CSW Records', 'csw-records', 'csw-records');
export const WCSCapabilitiesFormat = xml(
  'WCS Capabilities',
  'wcs-capabilities',
  'wcs-capabilities'
);
export const WMTSCapabilitiesFormat = xml(
  'WMTS Capabilities',
  'wmts-capabilities',
  'wmts-capabilities'
);
export const WMSFeatureInfoFormat = xml('WMS Feature Info', 'wms-feature-info', 'wms-feature-info');
export const WMSLayerDescriptionFormat = xml(
  'WMS Layer Description',
  'wms-layer-description',
  'wms-layer-description'
);
