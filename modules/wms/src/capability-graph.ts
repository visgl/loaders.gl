// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GeoServiceType, ServiceCapabilities} from './service-capabilities';
import {ServiceRuntime, type ServiceRuntimeOptions} from './service-runtime';

/** A discovered endpoint related to a service or catalog landing page. */
export type ServiceEndpoint = {
  /** Endpoint URL. */
  url: string;
  /** Detected service family. */
  type: GeoServiceType;
  /** Relationship from the parent resource. */
  relation: string;
  /** Optional capability summary. */
  capabilities?: ServiceCapabilities;
  /** Measured request latency in milliseconds. */
  latency?: number;
};

/** Preferences used to rank service endpoints. */
export type ServiceEndpointPreferences = {
  /** Preferred response formats. */
  formats?: readonly string[];
  /** Preferred coordinate reference systems. */
  crs?: readonly string[];
  /** Preferred service families. */
  types?: readonly GeoServiceType[];
};

/** A capability graph containing discovered service endpoints. */
export class CapabilityGraph {
  /** Discovered endpoints. */
  readonly endpoints: ServiceEndpoint[];

  /** Creates a capability graph. */
  constructor(endpoints: readonly ServiceEndpoint[] = []) {
    this.endpoints = [...endpoints];
  }

  /** Adds endpoints and returns this graph for fluent discovery pipelines. */
  add(endpoints: readonly ServiceEndpoint[]): this {
    this.endpoints.push(...endpoints);
    return this;
  }

  /** Ranks endpoints by type, format, CRS, and measured latency. */
  rank(preferences: ServiceEndpointPreferences = {}): ServiceEndpoint[] {
    return [...this.endpoints].sort(
      (first, second) => scoreEndpoint(second, preferences) - scoreEndpoint(first, preferences)
    );
  }

  /** Returns a serializable snapshot suitable for persistence. */
  toJSON(): {endpoints: ServiceEndpoint[]} {
    return {endpoints: this.endpoints};
  }
}

/** Discovers ArcGIS directories and OGC landing-page relationships into a graph. */
export async function discoverServiceGraph(
  url: string,
  options: ServiceRuntimeOptions = {}
): Promise<CapabilityGraph> {
  const runtime = new ServiceRuntime(options);
  const response = await runtime.request(url, {
    headers: {accept: 'application/json, application/xml, text/html'}
  });
  const contentType = response.headers.get('content-type') || '';
  const text = await response.text();
  const endpoints =
    contentType.includes('json') || text.trim().startsWith('{')
      ? discoverJSONEndpoints(url, JSON.parse(text))
      : discoverHTMLEndpoints(url, text);
  return new CapabilityGraph(endpoints);
}

function discoverJSONEndpoints(url: string, document: any): ServiceEndpoint[] {
  const endpoints: ServiceEndpoint[] = [];
  for (const service of document.services || []) {
    const endpointURL = service.url || `${url.replace(/\/$/, '')}/${service.name}`;
    endpoints.push({
      url: endpointURL,
      type: detectServiceType(service.type, endpointURL),
      relation: 'service'
    });
  }
  for (const link of document.links || []) {
    if (!link.href) continue;
    const endpointURL = new URL(link.href, url).toString();
    endpoints.push({
      url: endpointURL,
      type: detectServiceType(link.type || '', endpointURL),
      relation: link.rel || 'related'
    });
  }
  return endpoints;
}

function discoverHTMLEndpoints(url: string, document: string): ServiceEndpoint[] {
  const endpoints: ServiceEndpoint[] = [];
  const linkPattern = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  for (const match of document.matchAll(linkPattern)) {
    const endpointURL = new URL(match[1], url).toString();
    endpoints.push({
      url: endpointURL,
      type: detectServiceType('', endpointURL),
      relation: 'related'
    });
  }
  return endpoints;
}

function detectServiceType(value: string, url: string): GeoServiceType {
  const text = `${value} ${url}`.toLowerCase();
  if (text.includes('imageserver')) return 'arcgis-image-server';
  if (text.includes('featureserver')) return 'arcgis-feature-server';
  if (text.includes('mapserver')) return 'arcgis-map-server';
  if (text.includes('wmts')) return 'wmts';
  if (text.includes('wms')) return 'wms';
  if (text.includes('wfs')) return 'wfs';
  if (text.includes('csw')) return 'csw';
  return 'unknown';
}

function scoreEndpoint(endpoint: ServiceEndpoint, preferences: ServiceEndpointPreferences): number {
  const capabilities = endpoint.capabilities;
  let score = endpoint.type === 'unknown' ? 0 : 1;
  if (preferences.types?.includes(endpoint.type)) score += 100;
  score += matches(preferences.formats, capabilities?.formats) * 20;
  score += matches(preferences.crs, capabilities?.crs) * 20;
  if (endpoint.latency !== undefined) score += Math.max(0, 10 - endpoint.latency / 100);
  return score;
}

function matches(
  preferred: readonly string[] | undefined,
  advertised: readonly string[] | undefined
): number {
  if (!preferred?.length || !advertised?.length) return 0;
  return preferred.filter(value =>
    advertised.some(candidate => candidate.toLowerCase() === value.toLowerCase())
  ).length;
}
