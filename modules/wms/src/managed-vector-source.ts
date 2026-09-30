// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Feature, GeoJSONTable, Geometry} from '@loaders.gl/schema';
import type {
  GetFeaturesParameters,
  VectorSource,
  VectorSourceData,
  VectorSourceMetadata
} from '@loaders.gl/loader-utils';
import {
  convertFeaturesToWKBArrowTable,
  convertGeojsonToBinaryFeatureCollection
} from '@loaders.gl/gis';
import {areServiceCRSEquivalent, normalizeServiceCRS} from './crs-utils';

/** Closed extent in canonical XY order. */
type Extent = [number, number, number, number];
/** Parameters defining an independently cached layer and coordinate system. */
type ScopeParameters = Pick<GetFeaturesParameters, 'layers' | 'crs' | 'requestCrs'>;
/** One verified complete response and the area it covers. */
type CachedExtent = {
  /** Layer and CRS scope. */ scope: string;
  /** Complete request bounds. */ extent: Extent;
  /** Features owned by this cache entry. */ features: Feature[];
  /** Monotonic response-completion order for newest-ID selection. */ revision: number;
};
/** A service response carrying its completion order. */
type ExtentResponse = {
  /** Decoded service table. */ table: GeoJSONTable;
  /** Monotonic completion order. */ revision: number;
};
/** One shared request with independently cancelable consumers. */
type PendingExtent = {
  /** Fetch cancellation controller. */ controller: AbortController;
  /** Shared result. */ promise: Promise<ExtentResponse>;
  /** Number of callers still waiting. */ consumers: number;
};

/** Configuration for bounded, completeness-aware extent loading. */
export type ManagedVectorSourceOptions = {
  /** Maximum retained complete extents, in completion order. Defaults to 32. */
  maxCachedExtents?: number;
  /** Stable identifier for deduplication. Defaults to feature.id; absent IDs are not deduplicated. */
  getFeatureId?: (feature: Feature) => string | number | undefined;
  /**
   * Certifies that a response contains every matching feature for its request.
   * By default only a numeric numberMatched/totalFeatures count equal to the row count,
   * with no next link, certifies completeness. Unknown or truncated pages are never cached.
   */
  isComplete?: (table: GeoJSONTable, parameters: GetFeaturesParameters) => boolean;
};

/**
 * Wraps a GeoJSON-capable source with managed coverage, request sharing and stable-ID deduplication.
 *
 * Coverage reuse requires explicit, equivalent request and output CRSs. Other requests pass
 * through unchanged. Coordinates remain XY; no reprojection or automatic pagination is performed.
 * Treat returned feature objects as immutable. Invalidate after changing service data or options.
 */
export class ManagedVectorSource implements VectorSource {
  /** Underlying source, also accessible for protocol-specific operations. */
  readonly source: VectorSource;
  /** Fixed cache policy. */
  private readonly options: ManagedVectorSourceOptions;
  /** Complete extents ordered by completion, bounded by the cache policy. */
  private readonly cachedExtents: CachedExtent[] = [];
  /** Identical pending requests are shared within one layer/CRS scope. */
  private readonly pendingExtents = new Map<string, PendingExtent>();
  /** Prevents requests started before invalidation from repopulating the cache. */
  private generation = 0;
  /** Orders completed responses independently of request scheduling. */
  private responseRevision = 0;

  /** Creates an empty extent cache around a source supporting format: 'geojson'. */
  constructor(source: VectorSource, options: ManagedVectorSourceOptions = {}) {
    const maximum = options.maxCachedExtents ?? 32;
    if (!Number.isInteger(maximum) || maximum < 1)
      throw new Error('maxCachedExtents must be a positive integer');
    this.source = source;
    this.options = {...options, maxCachedExtents: maximum};
  }

  /** Delegates schema discovery to the underlying source. */
  getSchema(): ReturnType<VectorSource['getSchema']> {
    return this.source.getSchema();
  }

  /** Delegates metadata discovery to the underlying source. */
  getMetadata(options: {formatSpecificMetadata?: boolean} = {}): Promise<VectorSourceMetadata> {
    return this.source.getMetadata(options);
  }

  /**
   * Loads only uncovered rectangles, then returns bounding-box candidates for the requested extent.
   * Failed, incomplete or aborted requests do not establish coverage and can be retried.
   * One caller's cancellation leaves a shared request alive for its other callers.
   * Returns GeoJSON by default, or the requested Arrow/binary encoding.
   */
  async getFeatures(parameters: GetFeaturesParameters): Promise<VectorSourceData> {
    throwIfAborted(parameters.signal);
    const extent = getExtent(parameters.boundingBox);
    if (
      !parameters.crs ||
      !parameters.requestCrs ||
      !areServiceCRSEquivalent(parameters.crs, parameters.requestCrs) ||
      extent[0] === extent[2] ||
      extent[1] === extent[3]
    )
      return this.source.getFeatures(parameters);
    const scope = getScope(parameters);
    const generation = this.generation;
    let uncovered = [extent];
    const existingEntries = this.cachedExtents.filter(entry => entry.scope === scope);
    for (const entry of existingEntries) {
      uncovered = uncovered.flatMap(bounds => subtractExtent(bounds, entry.extent));
    }
    const responses = await Promise.all(
      uncovered.map(bounds => this.loadExtent(scope, bounds, parameters))
    );
    throwIfAborted(parameters.signal);
    if (generation !== this.generation)
      throw new DOMException('Vector cache invalidated', 'AbortError');
    // Retain the snapshot for this query even if concurrent loads evict its entries.
    const features = mergeFeatures(
      [
        ...existingEntries,
        ...responses.map(response => ({
          features: response.table.features,
          revision: response.revision
        }))
      ]
        .sort((first, second) => first.revision - second.revision)
        .map(entry => entry.features),
      this.options.getFeatureId
    ).filter(feature => feature.geometry && intersectsGeometryBounds(feature.geometry, extent));
    switch (parameters.format || 'geojson') {
      case 'arrow':
        return convertFeaturesToWKBArrowTable(features, {
          encodingPreference: parameters.geoarrow?.encodingPreference
        });
      case 'binary':
        return convertGeojsonToBinaryFeatureCollection(features);
      default:
        return {shape: 'geojson-table', type: 'FeatureCollection', features};
    }
  }

  /** Returns copies of verified loaded extents for a layer/CRS scope, in completion order. */
  getLoadedExtents(parameters: ScopeParameters): GetFeaturesParameters['boundingBox'][] {
    const scope = getScope(parameters);
    return this.cachedExtents
      .filter(entry => entry.scope === scope)
      .map(entry => getBoundingBox(entry.extent));
  }

  /** Evicts whole cached requests intersecting this area and cancels pending loads. */
  invalidateExtent(parameters: ScopeParameters & Pick<GetFeaturesParameters, 'boundingBox'>): void {
    const extent = getExtent(parameters.boundingBox);
    const scope = getScope(parameters);
    this.cancelPending();
    for (let index = this.cachedExtents.length - 1; index >= 0; index--) {
      const entry = this.cachedExtents[index];
      if (entry.scope === scope && intersectsBounds(entry.extent, extent))
        this.cachedExtents.splice(index, 1);
    }
  }

  /** Clears all loaded coverage and aborts pending requests; the source can be reused afterwards. */
  clear(): void {
    this.cancelPending();
    this.cachedExtents.length = 0;
  }

  /** Cancels all pending work and rejects late responses even when a source ignores cancellation. */
  private cancelPending(): void {
    this.generation++;
    for (const pending of this.pendingExtents.values()) pending.controller.abort();
    this.pendingExtents.clear();
  }

  /** Loads or joins one uncovered rectangle and commits only verified complete responses. */
  private async loadExtent(
    scope: string,
    extent: Extent,
    parameters: GetFeaturesParameters
  ): Promise<ExtentResponse> {
    const key = JSON.stringify([scope, extent]);
    let pending = this.pendingExtents.get(key);
    if (!pending) {
      const controller = new AbortController();
      const generation = this.generation;
      const request = {
        ...parameters,
        layers: Array.isArray(parameters.layers) ? [...parameters.layers] : parameters.layers,
        boundingBox: getBoundingBox(extent),
        format: 'geojson' as const,
        signal: controller.signal
      };
      const shared: PendingExtent = {
        controller,
        consumers: 0,
        promise: Promise.resolve()
          .then(async () => {
            throwIfAborted(controller.signal);
            const table = await this.source.getFeatures(request);
            throwIfAborted(controller.signal);
            const revision = ++this.responseRevision;
            if (table.shape !== 'geojson-table')
              throw new Error('ManagedVectorSource requires GeoJSON responses');
            if (
              generation === this.generation &&
              (this.options.isComplete || isCompleteResponse)(table, request)
            ) {
              this.cachedExtents.push({scope, extent, features: table.features, revision});
              while (this.cachedExtents.length > this.options.maxCachedExtents!)
                this.cachedExtents.shift();
            }
            return {table, revision};
          })
          .finally(() => {
            if (this.pendingExtents.get(key) === shared) this.pendingExtents.delete(key);
          })
      };
      pending = shared;
      this.pendingExtents.set(key, shared);
    }
    pending.consumers++;
    try {
      return await waitForResponse(pending.promise, parameters.signal, pending.controller.signal);
    } finally {
      pending.consumers--;
      if (!pending.consumers && this.pendingExtents.get(key) === pending) {
        this.pendingExtents.delete(key);
        pending.controller.abort();
      }
    }
  }
}

/** Validates ordered, finite bounds and converts the public shape to an extent. */
function getExtent(bounds: GetFeaturesParameters['boundingBox']): Extent {
  const extent: Extent = [bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]];
  if (!extent.every(Number.isFinite) || extent[0] > extent[2] || extent[1] > extent[3])
    throw new Error('Bounding box must contain finite, ordered XY bounds');
  return extent;
}

/** Produces fresh coordinate arrays so callers cannot mutate cached coverage. */
function getBoundingBox(extent: Extent): GetFeaturesParameters['boundingBox'] {
  return [
    [extent[0], extent[1]],
    [extent[2], extent[3]]
  ];
}

/** Keys ordered layer selections and normalized coordinate systems independently of output encoding. */
function getScope(parameters: ScopeParameters): string {
  return JSON.stringify([
    Array.isArray(parameters.layers) ? parameters.layers : [parameters.layers],
    normalizeServiceCRS(parameters.requestCrs),
    normalizeServiceCRS(parameters.crs)
  ]);
}

/** Tests closed bounding-box intersection. */
function intersectsBounds(first: Extent, second: Extent): boolean {
  return (
    first[0] <= second[2] && first[2] >= second[0] && first[1] <= second[3] && first[3] >= second[1]
  );
}

/** Subtracts positive-area coverage into at most four disjoint rectangles. */
function subtractExtent(request: Extent, covered: Extent): Extent[] {
  const minimumX = Math.max(request[0], covered[0]);
  const minimumY = Math.max(request[1], covered[1]);
  const maximumX = Math.min(request[2], covered[2]);
  const maximumY = Math.min(request[3], covered[3]);
  if (minimumX >= maximumX || minimumY >= maximumY) return [request];
  const rectangles: Extent[] = [];
  if (request[0] < minimumX) rectangles.push([request[0], request[1], minimumX, request[3]]);
  if (maximumX < request[2]) rectangles.push([maximumX, request[1], request[2], request[3]]);
  if (request[1] < minimumY) rectangles.push([minimumX, request[1], maximumX, minimumY]);
  if (maximumY < request[3]) rectangles.push([minimumX, maximumY, maximumX, request[3]]);
  return rectangles;
}

/** Requires explicit matching counts and refuses an advertised next page. */
function isCompleteResponse(table: GeoJSONTable): boolean {
  const metadata = table as GeoJSONTable & {
    numberMatched?: unknown;
    totalFeatures?: unknown;
    links?: {rel?: string}[];
  };
  const count = metadata.numberMatched ?? metadata.totalFeatures;
  return (
    typeof count === 'number' &&
    Number.isInteger(count) &&
    count === table.features.length &&
    !metadata.links?.some(link => link.rel === 'next')
  );
}

/** Keeps the newest feature for each typed ID, retaining all unidentified features. */
function mergeFeatures(
  groups: Feature[][],
  getFeatureId: ManagedVectorSourceOptions['getFeatureId'] = feature => feature.id
): Feature[] {
  const features: Feature[] = [];
  const rowsById = new Map<string | number, number>();
  for (const group of groups)
    for (const feature of group) {
      const identifier = getFeatureId(feature);
      const row = identifier === undefined ? undefined : rowsById.get(identifier);
      if (row !== undefined) features[row] = feature;
      else {
        if (identifier !== undefined) rowsById.set(identifier, features.length);
        features.push(feature);
      }
    }
  return features;
}

/** Computes geometry bounds in output XY; null and empty geometries cannot match. */
function intersectsGeometryBounds(geometry: Geometry, extent: Extent): boolean {
  const bounds: Extent = [Infinity, Infinity, -Infinity, -Infinity];
  /** Visits coordinate nesting without depending on an Arrow runtime. */
  const visitCoordinates = (
    coordinates: number[] | number[][] | number[][][] | number[][][][]
  ): void => {
    if (typeof coordinates[0] === 'number') {
      const position = coordinates as number[];
      if (!Number.isFinite(position[0]) || !Number.isFinite(position[1])) return;
      bounds[0] = Math.min(bounds[0], position[0]);
      bounds[1] = Math.min(bounds[1], position[1]);
      bounds[2] = Math.max(bounds[2], position[0]);
      bounds[3] = Math.max(bounds[3], position[1]);
    } else for (const child of coordinates as number[][][]) visitCoordinates(child);
  };
  /** Includes every member of a collection in its overall bounds. */
  const visitGeometry = (child: Geometry): void => {
    if (child.type === 'GeometryCollection') child.geometries.forEach(visitGeometry);
    else visitCoordinates(child.coordinates);
  };
  visitGeometry(geometry);
  return bounds.every(Number.isFinite) && intersectsBounds(bounds, extent);
}

/** Throws the standard cancellation error for an already aborted request. */
function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new DOMException('Vector request aborted', 'AbortError');
}

/** Cancels a caller's wait independently and always removes abort listeners. */
function waitForResponse<T>(
  promise: Promise<T>,
  ...signals: (AbortSignal | undefined)[]
): Promise<T> {
  return new Promise((resolve, reject) => {
    /** Releases every listener when the wait settles. */
    const cleanup = (): void => {
      for (const signal of signals) signal?.removeEventListener('abort', abort);
    };
    /** Rejects on caller cancellation or cache invalidation. */
    const abort = (): void => {
      cleanup();
      reject(new DOMException('Vector request aborted', 'AbortError'));
    };
    for (const signal of signals) signal?.addEventListener('abort', abort, {once: true});
    if (signals.some(signal => signal?.aborted)) abort();
    promise.then(
      value => {
        cleanup();
        resolve(value);
      },
      error => {
        cleanup();
        reject(error);
      }
    );
  });
}
