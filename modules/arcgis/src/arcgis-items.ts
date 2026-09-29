// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {FetchLike} from '@loaders.gl/loader-utils';

/** A supported service-backed portal item, retaining the original portal metadata. */
export type ArcGISItem = {
  /** Portal item identifier. */
  id: string;
  /** Display title supplied by the publisher. */
  title: string;
  /** Portal item type, distinct from the REST service type. */
  type: string;
  /** REST service endpoint. */
  url: string;
  /** Publisher description, potentially containing HTML; do not render it unsanitized. */
  description?: string;
  /** Publisher attribution, potentially containing HTML. */
  accessInformation?: string;
  /** Geographic item extent in longitude/latitude, when published. */
  extent?: number[][];
  /** Unmodified additional portal metadata. */
  [name: string]: unknown;
};

/** An explicit service/layer choice; resolving a choice does not prove renderer support. */
export type ArcGISItemLayer = {
  /** Numeric layer identifier, or null for a single root service. */
  id: number | null;
  /** Publisher-provided layer name. */
  name: string;
  /** Endpoint to pass to an appropriate ArcGIS source loader. */
  url: string;
  /** Whether this is a spatial layer, nonspatial table, or root service. */
  kind: 'layer' | 'table' | 'service';
};

/** A resolved service item with choices and optional selected layer metadata. */
export type ArcGISItemResolution = {
  /** Canonical portal REST root, including an Enterprise web-adaptor path. */
  portalUrl: string;
  /** Original item metadata, including description, extent and attribution. */
  item: ArcGISItem;
  /** Original service metadata. */
  service: Record<string, any>;
  /** Available choices; no implicit first-layer selection is made. */
  layers: ArcGISItemLayer[];
  /** Explicitly selected layer and its raw fields, domains, extent and attribution. */
  selectedLayer?: ArcGISItemLayer & {
    /** Unmodified selected-layer metadata. */ metadata: Record<string, any>;
  };
};

/** Controls item resolution without owning authentication or OAuth state. */
export type ArcGISItemOptions = {
  /** Portal root or sharing/rest endpoint. Defaults to ArcGIS Online for bare IDs. */
  portalUrl?: string;
  /** Shared authenticated transport, also used for service and selected-layer metadata. */
  fetch?: FetchLike;
  /** Cancels all metadata requests. */
  signal?: AbortSignal;
  /** Explicit layer/table identifier to inspect, or null for a root service. */
  layerId?: number | null;
};

/** Service-backed item types supported by this resolver. */
const ITEM_SERVICES: Readonly<Record<string, string>> = {
  'Feature Service': 'FeatureServer',
  'Map Service': 'MapServer',
  'Image Service': 'ImageServer',
  'Vector Tile Service': 'VectorTileServer',
  'Scene Service': 'SceneServer'
};

/**
 * Resolves a portal item ID, item-details URL, or item REST URL into explicit service choices.
 * Fetches only item, service, and (when selected) layer metadata. Web Maps/Web Scenes are rejected.
 * URLs discovered in metadata never expand the credential's trusted origins.
 */
export async function resolveArcGISItem(
  input: string,
  options: ArcGISItemOptions = {}
): Promise<ArcGISItemResolution> {
  const {itemId, portalUrl} = parseItemReference(input, options.portalUrl);
  const fetchFile = options.fetch || fetch;
  const item = (await fetchMetadata(
    `${portalUrl}/content/items/${itemId}`,
    fetchFile,
    options.signal
  )) as ArcGISItem;
  const serviceType = Object.hasOwn(ITEM_SERVICES, item.type)
    ? ITEM_SERVICES[item.type]
    : undefined;
  if (!serviceType)
    throw new Error(
      'Unsupported ArcGIS item type. Resolve a service item, not a Web Map or Web Scene.'
    );
  if (
    typeof item.id !== 'string' ||
    item.id.toLowerCase() !== itemId ||
    typeof item.title !== 'string'
  )
    throw new Error('Invalid ArcGIS item metadata.');
  const serviceUrl = parseEndpoint(item.url);
  const serviceMatch = serviceUrl.pathname.match(
    /\/(FeatureServer|MapServer|ImageServer|VectorTileServer|SceneServer)(?:\/(?:layers\/)?(\d+))?\/?$/i
  );
  if (
    !serviceMatch ||
    serviceMatch[1].toLowerCase() !== serviceType.toLowerCase() ||
    (serviceMatch[2] !== undefined &&
      !new RegExp(
        serviceType === 'SceneServer'
          ? '/SceneServer/layers/\\d+/?$'
          : '/(FeatureServer|MapServer)/\\d+/?$',
        'i'
      ).test(serviceUrl.pathname))
  ) {
    throw new Error('ArcGIS item URL does not match its supported service type.');
  }
  const url = serviceUrl.href.replace(/\/$/, '');
  const service = await fetchMetadata(url, fetchFile, options.signal);
  const isLayer = serviceMatch[2] !== undefined;
  const layers: ArcGISItemLayer[] = isLayer
    ? [
        {
          id: Number(serviceMatch[2]),
          name: service.name || item.title,
          url,
          kind: service.type === 'Table' ? 'table' : 'layer'
        }
      ]
    : [
        ...createLayerChoices(service.layers, 'layer', url, serviceType),
        ...createLayerChoices(service.tables, 'table', url, serviceType)
      ];
  // Map roots are also useful as image sources; image/vector tile roots are single services.
  if (!isLayer && serviceType !== 'FeatureServer' && serviceType !== 'SceneServer') {
    layers.unshift({id: null, name: service.name || item.title, url, kind: 'service'});
  }
  const resolution: ArcGISItemResolution = {portalUrl, item, service, layers};
  if (options.layerId !== undefined) {
    const layer = layers.find(candidate => candidate.id === options.layerId);
    if (!layer) throw new Error('The requested ArcGIS layer or table is not present in this item.');
    const metadata =
      layer.url === url ? service : await fetchMetadata(layer.url, fetchFile, options.signal);
    resolution.selectedLayer = {...layer, metadata};
  }
  return resolution;
}

/** Builds choices from advertised numeric layer IDs without recursively fetching sublayers. */
function createLayerChoices(
  entries: any,
  kind: 'layer' | 'table',
  url: string,
  serviceType: string
): ArcGISItemLayer[] {
  if (!Array.isArray(entries)) return [];
  return entries
    .filter(entry => Number.isSafeInteger(entry?.id) && entry.id >= 0)
    .map(entry => ({
      id: entry.id,
      name: typeof entry.name === 'string' ? entry.name : String(entry.id),
      url: `${url}/${serviceType === 'SceneServer' ? 'layers/' : ''}${entry.id}`,
      kind
    }));
}

/** Parses only documented item URL shapes, retaining Enterprise portal prefixes. */
function parseItemReference(
  input: string,
  configuredPortal?: string
): {itemId: string; portalUrl: string} {
  let itemId = input;
  let inferredPortal: string | undefined;
  if (!/^[a-f\d]{32}$/i.test(input)) {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash)
      throw new Error('Invalid ArcGIS item URL.');
    const details = url.pathname.match(/^(.*)\/home\/item\.html$/);
    const rest = url.pathname.match(/^(.*)\/sharing\/rest\/content\/items\/([a-f\d]{32})\/?$/i);
    if (details) {
      itemId = url.searchParams.get('id') || '';
      inferredPortal = `${url.origin}${details[1]}/sharing/rest`;
    } else if (rest) {
      itemId = rest[2];
      inferredPortal = `${url.origin}${rest[1]}/sharing/rest`;
    } else throw new Error('Expected an ArcGIS item ID or item-details/REST URL.');
    if ([...url.searchParams.keys()].some(key => !['id', 'f'].includes(key)))
      throw new Error('Item URLs must not contain credentials or extra parameters.');
  }
  if (!/^[a-f\d]{32}$/i.test(itemId))
    throw new Error('ArcGIS item IDs must contain 32 hexadecimal characters.');
  const portal = parseEndpoint(configuredPortal || inferredPortal || 'https://www.arcgis.com');
  const portalUrl = `${portal.href.replace(/\/$/, '').replace(/\/sharing\/rest$/i, '')}/sharing/rest`;
  if (inferredPortal && portalUrl !== inferredPortal)
    throw new Error('Item URL does not belong to the configured portal.');
  return {itemId: itemId.toLowerCase(), portalUrl};
}

/** Rejects credential-bearing or non-HTTP metadata endpoints. */
function parseEndpoint(value: string): URL {
  const url = new URL(value);
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'ArcGIS endpoints must be HTTP(S) URLs without credentials, query parameters or fragments.'
    );
  }
  return url;
}

/** Reads JSON metadata and rejects ArcGIS error envelopes even with HTTP 200. */
async function fetchMetadata(
  url: string,
  fetchFile: FetchLike,
  signal?: AbortSignal
): Promise<Record<string, any>> {
  const response = await fetchFile(`${url}?f=json`, {signal});
  if (!response.ok) throw new Error(`ArcGIS metadata request failed (HTTP ${response.status}).`);
  const metadata = await response.json();
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata) || metadata.error) {
    throw new Error('ArcGIS metadata is unavailable or access was denied.');
  }
  return metadata;
}
