// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Protocol-neutral service families understood by geospatial service sources. */
export type GeoServiceType =
  | 'wms'
  | 'wmts'
  | 'wfs'
  | 'csw'
  | 'arcgis-map-server'
  | 'arcgis-vector-tile-server'
  | 'arcgis-image-server'
  | 'arcgis-feature-server'
  | 'unknown';

/** A normalized description of a discoverable geospatial service. */
export type ServiceCapabilities = {
  /** Stable service URL. */
  url?: string;
  /** Protocol or vendor service family. */
  type: GeoServiceType;
  /** Machine-readable service identifier. */
  name: string;
  /** Human-readable service title. */
  title?: string;
  /** Service description. */
  abstract?: string;
  /** Supported coordinate reference systems. */
  crs: string[];
  /** Advertised response formats. */
  formats: string[];
  /** Named layers or feature types. */
  layers: Array<{name: string; title?: string; crs?: string[]; bounds?: number[]}>;
  /** Supported request names, when advertised. */
  operations: string[];
  /** Original protocol-specific capability document. */
  formatSpecificMetadata?: Record<string, unknown>;
};
