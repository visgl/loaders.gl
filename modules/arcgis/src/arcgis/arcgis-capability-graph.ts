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
  kind: 'vector' | 'image' | 'tile' | 'scene' | 'unknown';
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
  /** Required I3S layer profile for SceneServer nodes. */
  profile?: string;
  /** Required layer identifier for SceneServer nodes. */
  layerId?: string | number;
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
      let metadata = await fetchServiceMetadata(service.url, fetchFile);
      if (service.type.toLowerCase().includes('scene')) {
        metadata = await enrichSceneServerMetadata(service.url, metadata, fetchFile);
      }
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
    if (
      requirements.profile &&
      node.metadata.profile !== requirements.profile &&
      !node.capabilities.layers.some(layer => layer.profile === requirements.profile)
    )
      return false;
    if (
      requirements.layerId !== undefined &&
      !node.capabilities.layers.some(
        layer =>
          layer.id === String(requirements.layerId) || layer.name === String(requirements.layerId)
      )
    )
      return false;
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

/** Fetches layer documents so SceneServer profile selection uses authoritative store metadata. */
async function enrichSceneServerMetadata(
  serviceUrl: string,
  metadata: Record<string, unknown>,
  fetchFile: typeof fetch
): Promise<Record<string, unknown>> {
  const layers = Array.isArray(metadata.layers) ? metadata.layers : [];
  if (!layers.length) return metadata;
  const enrichedLayers = await Promise.all(
    layers.map(async value => {
      if (!value || typeof value !== 'object') return value;
      const layer = value as Record<string, unknown>;
      if (layer.id === undefined) return value;
      const layerURL = `${serviceUrl.replace(/\/$/, '')}/layers/${encodeURIComponent(String(layer.id))}`;
      try {
        const layerMetadata = await fetchServiceMetadata(layerURL, fetchFile);
        return {...layer, ...layerMetadata, id: layer.id, name: layer.name ?? layerMetadata.name};
      } catch {
        // Keep directory metadata when an individual layer is unavailable.
        return value;
      }
    })
  );
  return {...metadata, layers: enrichedLayers};
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
  const layers = getServiceLayers(metadata).map(layer => ({
    ...layer,
    url:
      layer.url ||
      (serviceType.includes('scene') && layer.id
        ? `${service.url.replace(/\/$/, '')}/layers/${encodeURIComponent(layer.id)}`
        : undefined)
  }));
  const capabilities: ServiceCapabilities = {
    url: service.url,
    type: getServiceCapabilityType(serviceType),
    name: service.name,
    title: typeof metadata.name === 'string' ? metadata.name : undefined,
    abstract: typeof metadata.description === 'string' ? metadata.description : undefined,
    crs,
    formats,
    layers,
    operations: getServiceOperations(metadata),
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

/** Extracts normalized layer entries from SceneServer and other service metadata. */
function getServiceLayers(metadata: Record<string, unknown>): ServiceCapabilities['layers'] {
  const layerValues = Array.isArray(metadata.layers) ? metadata.layers : [];
  return layerValues.flatMap(value => {
    if (!value || typeof value !== 'object') return [];
    const layer = value as Record<string, unknown>;
    const spatialReference = layer.spatialReference as
      | {wkid?: number; latestWkid?: number}
      | undefined;
    const wkid = spatialReference?.latestWkid || spatialReference?.wkid;
    const extent = layer.extent as
      | {xmin?: number; ymin?: number; xmax?: number; ymax?: number}
      | undefined;
    const bounds =
      extent && [extent.xmin, extent.ymin, extent.xmax, extent.ymax].every(Number.isFinite)
        ? [extent.xmin!, extent.ymin!, extent.xmax!, extent.ymax!]
        : undefined;
    return [
      {
        name: layer.id === undefined ? String(layer.name || '') : String(layer.id),
        id: layer.id === undefined ? undefined : String(layer.id),
        url: typeof layer.url === 'string' ? layer.url : undefined,
        title: typeof layer.name === 'string' ? layer.name : undefined,
        crs: wkid ? [`EPSG:${wkid}`] : undefined,
        bounds,
        profile:
          typeof layer.profile === 'string'
            ? layer.profile
            : layer.store &&
                typeof layer.store === 'object' &&
                typeof (layer.store as Record<string, unknown>).profile === 'string'
              ? ((layer.store as Record<string, unknown>).profile as string)
              : undefined,
        layerType: typeof layer.layerType === 'string' ? layer.layerType : undefined,
        version:
          typeof layer.version === 'string'
            ? layer.version
            : layer.store &&
                typeof layer.store === 'object' &&
                typeof (layer.store as Record<string, unknown>).version === 'string'
              ? ((layer.store as Record<string, unknown>).version as string)
              : undefined
      }
    ];
  });
}

/** Extracts operation names when a service advertises them. */
function getServiceOperations(metadata: Record<string, unknown>): string[] {
  const capabilities = metadata.capabilities;
  return typeof capabilities === 'string'
    ? capabilities
        .split(',')
        .map(value => value.trim())
        .filter(Boolean)
    : [];
}

/** Maps a discovered ArcGIS family to the shared service capability type. */
function getServiceCapabilityType(serviceType: string): ServiceCapabilities['type'] {
  if (serviceType.includes('vectortile') || serviceType.includes('vector-tile')) {
    return 'arcgis-vector-tile-server';
  }
  if (serviceType.includes('feature')) return 'arcgis-feature-server';
  if (serviceType.includes('image')) return 'arcgis-image-server';
  if (serviceType.includes('scene')) return 'arcgis-scene-server';
  if (serviceType.includes('map')) return 'arcgis-map-server';
  return 'unknown';
}

/** Maps an ArcGIS service type to the generic source family. */
function getServiceKind(serviceType: string): ArcGISServiceCapabilities['kind'] {
  if (serviceType.includes('feature')) return 'vector';
  if (serviceType.includes('image')) return 'image';
  if (serviceType.includes('scene')) return 'scene';
  if (
    serviceType.includes('map') ||
    serviceType.includes('vectortile') ||
    serviceType.includes('vector-tile')
  )
    return 'tile';
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
