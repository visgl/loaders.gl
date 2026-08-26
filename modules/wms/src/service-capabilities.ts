// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {TileSourceMetadata, VectorSourceMetadata} from '@loaders.gl/loader-utils';
import type {WMSCapabilities} from './lib/parsers/wms/parse-wms-capabilities';
import type {WMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
import type {WFSCapabilities} from './lib/parsers/wfs/parse-wfs-capabilities';

/** Protocol-neutral service families understood by the geospatial service loaders. */
export type GeoServiceType =
  | 'wms'
  | 'wmts'
  | 'wfs'
  | 'csw'
  | 'arcgis-map-server'
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

/** Normalizes WMS capabilities into the shared service contract. */
export function normalizeWMSCapabilities(
  capabilities: WMSCapabilities,
  url?: string
): ServiceCapabilities {
  return {
    url,
    type: 'wms',
    name: capabilities.name,
    title: capabilities.title,
    abstract: capabilities.abstract,
    crs: unique(capabilities.layers.flatMap(layer => layer.crs || [])),
    formats: unique(
      Object.values(capabilities.requests || {}).flatMap(request => request.mimeTypes || [])
    ),
    layers: flattenLayers(capabilities.layers),
    operations: Object.keys(capabilities.requests || {}),
    formatSpecificMetadata: capabilities as unknown as Record<string, unknown>
  };
}

/** Normalizes WMTS capabilities into the shared service contract. */
export function normalizeWMTSCapabilities(
  capabilities: WMTSCapabilities,
  url?: string
): ServiceCapabilities {
  const layers = capabilities.contents.layers;
  return {
    url,
    type: 'wmts',
    name: layers[0]?.identifier || '',
    title: capabilities.serviceIdentification?.title,
    abstract: capabilities.serviceIdentification?.abstract,
    crs: unique(
      capabilities.contents.tileMatrixSets
        .map(tileMatrixSet => tileMatrixSet.supportedCRS)
        .filter((value): value is string => Boolean(value))
    ),
    formats: unique(layers.flatMap(layer => layer.formats)),
    layers: layers.map(layer => ({
      name: layer.identifier,
      title: layer.title,
      bounds: layer.bounds
    })),
    operations: Object.keys(capabilities.operationsMetadata || {}),
    formatSpecificMetadata: capabilities as unknown as Record<string, unknown>
  };
}

/** Normalizes WFS capabilities into the shared service contract. */
export function normalizeWFSCapabilities(
  capabilities: WFSCapabilities,
  url?: string
): ServiceCapabilities {
  const layers = capabilities.contents?.layers || [];
  return {
    url,
    type: 'wfs',
    name: capabilities.serviceIdentification?.serviceType || '',
    title: capabilities.serviceIdentification?.title,
    crs: [],
    formats: [],
    layers: layers.map(layer => ({name: layer.identifier, title: layer.title})),
    operations: Object.keys(capabilities.operationsMetadata || {}),
    formatSpecificMetadata: capabilities as unknown as Record<string, unknown>
  };
}

/** Adapts normalized tile metadata to the shared service contract. */
export function normalizeTileServiceCapabilities(
  metadata: TileSourceMetadata,
  type: Extract<GeoServiceType, 'wmts' | 'arcgis-map-server' | 'arcgis-image-server'>,
  url?: string
): ServiceCapabilities {
  return {
    url,
    type,
    name: metadata.name || '',
    title: metadata.title,
    abstract: metadata.abstract,
    crs: metadata.layer?.srs || [],
    formats: metadata.format ? [metadata.format] : [],
    layers: metadata.layer ? [{name: metadata.layer.name, title: metadata.layer.title}] : [],
    operations: ['GetTile'],
    formatSpecificMetadata: metadata as Record<string, unknown>
  };
}

/** Adapts normalized vector metadata to the shared service contract. */
export function normalizeVectorServiceCapabilities(
  metadata: VectorSourceMetadata,
  type: Extract<GeoServiceType, 'wfs' | 'arcgis-feature-server'>,
  url?: string
): ServiceCapabilities {
  return {
    url,
    type,
    name: metadata.name,
    title: metadata.title,
    abstract: metadata.abstract,
    crs: unique(metadata.layers.flatMap(layer => layer.crs || [])),
    formats: ['application/geo+json', 'application/vnd.apache.arrow.file'],
    layers: metadata.layers.map(layer => ({name: layer.name || '', title: layer.title})),
    operations: ['GetFeature'],
    formatSpecificMetadata: metadata.formatSpecificMetadata
  };
}

function flattenLayers(layers: WMSCapabilities['layers']): ServiceCapabilities['layers'] {
  return layers.flatMap(layer => [
    {
      name: layer.name || '',
      title: layer.title,
      crs: layer.crs,
      bounds: layer.geographicBoundingBox
        ? [...layer.geographicBoundingBox[0], ...layer.geographicBoundingBox[1]]
        : undefined
    },
    ...flattenLayers(layer.layers || [])
  ]);
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
