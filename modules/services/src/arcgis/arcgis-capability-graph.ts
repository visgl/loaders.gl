// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {getArcGISServices} from './arcgis-server';
import type {ServiceCapabilities} from '@loaders.gl/loader-utils';
import type {Service as ArcGISService} from './arcgis-server';

/** Normalized capabilities discovered from one ArcGIS REST service. */
export type ArcGISServiceCapabilities = ArcGISService & {
  /** Stable identifier for the discovered service. */
  id: string;
  /** Broad service family used for selection. */
  kind: 'vector' | 'image' | 'tile' | 'unknown';
  /** Shared normalized service capability contract. */
  capabilities: ServiceCapabilities;
  /** Raw service metadata for provider-specific consumers. */
  metadata: Record<string, unknown>;
};

/** A normalized graph of services discovered below an ArcGIS REST directory. */
export type ArcGISCapabilityGraph = {
  /** URL used as the discovery root. */
  rootUrl: string;
  /** Services discovered below the root, including normalized capabilities. */
  nodes: ArcGISServiceCapabilities[];
};

/** Requirements used to select the best matching service node. */
export type ArcGISServiceSelection = {
  /** Preferred service family. */
  kind?: ArcGISServiceCapabilities['kind'];
  /** Required response or source format. */
  format?: string;
  /** Preferred coordinate system. */
  crs?: string;
};

/** Options controlling ArcGIS capability discovery. */
export type ArcGISCapabilityGraphOptions = {
  /** Optional fetch implementation for hermetic tests and custom transports. */
  fetch?: typeof fetch;
};

/**
 * Discovers an ArcGIS REST directory and normalizes the capabilities of each service.
 *
 * Capability requests are explicit and independent from source loading. Applications that
 * already know the endpoint can continue using the source classes directly.
 */
export async function discoverArcGISCapabilities(
  url: string,
  options: ArcGISCapabilityGraphOptions = {}
): Promise<ArcGISCapabilityGraph | null> {
  const fetchFile = options.fetch || fetch;
  const services = await getArcGISServices(url, fetchFile);
  if (!services) return null;

  const nodes = await Promise.all(
    services.map(async service => {
      const metadata = await fetchServiceMetadata(service.url, fetchFile);
      return normalizeServiceCapabilities(service, metadata);
    })
  );

  return {rootUrl: url, nodes};
}

/** Selects the first service satisfying all supplied requirements. */
export function selectArcGISService(
  graph: ArcGISCapabilityGraph,
  requirements: ArcGISServiceSelection = {}
): ArcGISServiceCapabilities | undefined {
  return graph.nodes.find(node => {
    if (requirements.kind && node.kind !== requirements.kind) return false;
    if (
      requirements.format &&
      !node.capabilities.formats.includes(requirements.format.toLowerCase())
    )
      return false;
    if (requirements.crs && !node.capabilities.crs.includes(requirements.crs)) return false;
    return true;
  });
}

/** Fetches one service's provider-specific metadata document. */
async function fetchServiceMetadata(
  serviceUrl: string,
  fetchFile: typeof fetch
): Promise<Record<string, unknown>> {
  const url = new URL(serviceUrl);
  url.searchParams.set('f', 'pjson');
  const response = await fetchFile(url.toString());
  if (!response.ok) {
    throw new Error(`ArcGIS service metadata request failed: ${response.status}`);
  }
  return (await response.json()) as Record<string, unknown>;
}

/** Combines directory information and metadata into a normalized capability node. */
function normalizeServiceCapabilities(
  service: ArcGISService,
  metadata: Record<string, unknown>
): ArcGISServiceCapabilities {
  const serviceType = service.type;
  const kind = getServiceKind(serviceType);
  const formats = getServiceFormats(metadata);
  const crs = getServiceCrs(metadata);
  const capabilities: ServiceCapabilities = {
    url: service.url,
    type: getServiceCapabilityType(kind),
    name: service.name,
    title: typeof metadata.name === 'string' ? metadata.name : undefined,
    abstract: typeof metadata.description === 'string' ? metadata.description : undefined,
    crs,
    formats,
    layers: [],
    operations: [],
    formatSpecificMetadata: metadata
  };
  return {
    ...service,
    id: service.url,
    kind,
    capabilities,
    metadata
  };
}

/** Maps a discovered ArcGIS family to the shared service capability type. */
function getServiceCapabilityType(
  kind: ArcGISServiceCapabilities['kind']
): ServiceCapabilities['type'] {
  if (kind === 'vector') return 'arcgis-feature-server';
  if (kind === 'image') return 'arcgis-image-server';
  if (kind === 'tile') return 'arcgis-map-server';
  return 'unknown';
}

/** Maps an ArcGIS service type to the generic source family. */
function getServiceKind(serviceType: string): ArcGISServiceCapabilities['kind'] {
  if (serviceType.includes('feature')) return 'vector';
  if (serviceType.includes('image')) return 'image';
  if (serviceType.includes('map') || serviceType.includes('vector-tile')) return 'tile';
  return 'unknown';
}

/** Extracts and canonicalizes formats advertised by an ArcGIS service. */
function getServiceFormats(metadata: Record<string, unknown>): string[] {
  const formats = new Set<string>();
  const supportedFormats = metadata.supportedQueryFormats;
  if (typeof supportedFormats === 'string') {
    for (const format of supportedFormats.split(',')) formats.add(format.trim().toLowerCase());
  }
  const imageFormats = metadata.supportedImageFormatTypes;
  if (typeof imageFormats === 'string') {
    for (const format of imageFormats.split(',')) formats.add(format.trim().toLowerCase());
  }
  const tileInfo = metadata.tileInfo as {format?: string} | undefined;
  if (typeof tileInfo?.format === 'string') formats.add(tileInfo.format.toLowerCase());
  return [...formats].sort();
}

/** Extracts unique EPSG identifiers from common ArcGIS metadata locations. */
function getServiceCrs(metadata: Record<string, unknown>): string[] {
  const spatialReferences = new Set<string>();
  for (const value of [metadata.spatialReference, (metadata.fullExtent as any)?.spatialReference]) {
    const spatialReference = value as {wkid?: number; latestWkid?: number} | undefined;
    for (const wkid of [spatialReference?.wkid, spatialReference?.latestWkid]) {
      if (wkid) spatialReferences.add(`EPSG:${wkid}`);
    }
  }
  return [...spatialReferences].sort();
}
