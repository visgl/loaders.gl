// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {getArcGISServices, type Service as ArcGISService} from './arcgis/arcgis-server';
export {
  type ArcGISServiceCapabilities,
  type ArcGISCapabilityGraph,
  type ArcGISServiceSelection,
  type ArcGISCapabilityGraphOptions,
  discoverArcGISCapabilities,
  selectArcGISService
} from './arcgis/arcgis-capability-graph';
export {ARCGIS_LOADERS, getArcGISLoader} from './service-registry';
export type {ArcGISLoader} from './service-registry';
