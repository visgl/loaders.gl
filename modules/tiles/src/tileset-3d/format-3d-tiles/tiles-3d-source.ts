// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {path} from '@loaders.gl/loader-utils';
import {Ellipsoid} from '@math.gl/geospatial';
import {Vector3} from '@math.gl/core';
import type {CoreAPI, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Tile3D} from '../common/tile-3d';
import {Tileset3DTraverser} from './tileset-3d-traverser';
import type {Tileset3D} from '../common/tileset-3d';
import type {
  TileChildrenLoadResult,
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  Tileset3DSource,
  TilesetSourceInput,
  TilesetSourceMetadata,
  TilesetSourceRequest,
  TilesetSourceResolver,
  TilesetSourceViewState
} from '../common/tileset-source';
import {Tile3D as Tile3DNode} from '../common/tile-3d';
import {getZoomFromBoundingVolume} from '../helpers/zoom';
import {TILESET_TYPE} from '../../constants';
import type {TilesetTraverser, TilesetTraverserProps} from '../common/tileset-traverser';
import type {FrameState} from '../helpers/frame-state';
import {
  materializeImplicitSubtree,
  type ImplicitSubtreeReference,
  type ParsedImplicitSubtree
} from './implicit-tiling';

const EMPTY_CONTENT_FORMATS: TilesetContentFormats = {
  draco: false,
  meshopt: false,
  dds: false,
  ktx2: false
};

const DEFAULT_MAXIMUM_CACHED_SUBTREES = 32;

/** Diagnostics for source-managed implicit subtree loading. */
export type ImplicitTilingStats = {
  /** Subtree resources requested from the resolver or core API. */
  requestedSubtrees: number;
  /** Successful subtree materializations, including parsed-cache hits. */
  loadedSubtrees: number;
  /** Requests served by the source's parsed-subtree cache. */
  cacheHits: number;
  /** Parsed subtree resources currently retained for reuse. */
  cachedSubtrees: number;
  /** Subtree resource requests currently in flight. */
  pendingSubtrees: number;
  /** Runtime headers created below already-existing subtree-root placeholders. */
  materializedTiles: number;
};

/**
 * {@link Tileset3DSource} implementation for 3D Tiles datasets.
 */
export class Tiles3DSource implements Tileset3DSource {
  /** 3D Tiles format discriminator. */
  readonly type = TILESET_TYPE.TILES3D;
  /** Loader used for tile content requests. */
  readonly loader: LoaderWithParser;
  /** Root tileset URL. */
  readonly url: string;
  /** Base path used for relative tile resource resolution. */
  readonly basePath: string;
  /** Parsed root tileset payload. */
  tileset: TilesetJSON | null = null;
  /** Loader options forwarded to content requests. */
  readonly loadOptions: LoaderOptions;
  /** Core API used for root and tile-content loads when injected by the caller. */
  coreApi?: CoreAPI;
  /** Aggregate content-format flags discovered during streaming. */
  readonly contentFormats: TilesetContentFormats = {...EMPTY_CONTENT_FORMATS};

  /** Top-level 3D Tiles asset metadata. */
  asset?: Record<string, any>;
  /** Top-level per-feature properties metadata. */
  properties?: any;
  /** Top-level application-specific metadata. */
  extras?: any;
  /** Source-provided attribution metadata. */
  credits?: any;
  /** Normalized source metadata after initialization. */
  metadata?: TilesetSourceMetadata;

  private readonly queryParams: Record<string, string> = {};
  /** Final request URLs cached by unmodified tile content URL. */
  private readonly tileUrlCache: Map<string, string> = new Map();
  /** Parsed subtree promises keyed by final source URL for request deduplication and LRU reuse. */
  private readonly implicitSubtreeCache: Map<string, Promise<ParsedImplicitSubtree>> = new Map();
  /** URLs whose subtree resource requests have not settled. */
  private readonly pendingImplicitSubtreeUrls: Set<string> = new Set();
  /** Maximum number of settled parsed subtrees retained by this source. */
  private readonly maximumCachedSubtrees: number;
  /** Mutable counters exposed as a defensive snapshot through {@link getImplicitTilingStats}. */
  private readonly implicitTilingStats: Omit<
    ImplicitTilingStats,
    'cachedSubtrees' | 'pendingSubtrees'
  > = {
    requestedSubtrees: 0,
    loadedSubtrees: 0,
    cacheHits: 0,
    materializedTiles: 0
  };
  /** Whether the owning tileset has released this source. */
  private destroyed = false;
  private readonly extensionsUsed: string[] = [];
  private readonly resolver?: TilesetSourceResolver;
  private rootTileset: TilesetJSON;

  /**
   * Creates a 3D Tiles source.
   * @param input Root metadata request, or preloaded root metadata for tests and internal callers.
   * @param loadOptions Loader options forwarded to tile requests.
   */
  constructor(input: TilesetSourceInput, loadOptions: LoaderOptions = {}) {
    const request = normalizeTiles3DRequest(input);
    this.rootTileset = isTilesetRequest(input) ? null : input;
    this.tileset = this.rootTileset;
    this.loader = request.loader;
    this.url = request.url;
    this.basePath = request.basePath || path.dirname(request.url);
    this.resolver = request.resolver;
    this.coreApi = request.coreApi;
    this.loadOptions = loadOptions;
    const maximumCachedSubtrees = Number(
      (loadOptions['3d-tiles'] as Record<string, unknown> | undefined)?.maximumCachedSubtrees
    );
    this.maximumCachedSubtrees = Number.isFinite(maximumCachedSubtrees)
      ? Math.max(0, Math.floor(maximumCachedSubtrees))
      : DEFAULT_MAXIMUM_CACHED_SUBTREES;
  }

  /**
   * Releases URL and parsed-subtree caches and blocks late subtree installation.
   *
   * The injected resolver or core API remains responsible for transport-level abort signals. A
   * request that cannot be aborted may finish parsing, but it will not mutate destroyed tiles.
   */
  destroy(): void {
    this.destroyed = true;
    this.tileUrlCache.clear();
    this.implicitSubtreeCache.clear();
    this.pendingImplicitSubtreeUrls.clear();
  }

  /**
   * Fetches and validates top-level metadata, then normalizes common fields used by {@link Tileset3D}.
   */
  async initialize(): Promise<void> {
    if (!this.rootTileset) {
      const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
      this.rootTileset = await this.loadRootData(this.url, {
        ...this.loadOptions,
        [this.loader.id]: {
          ...loaderOptions,
          isTileset: true
        }
      });
    }
    this.tileset = this.rootTileset;

    if (this.rootTileset.queryString) {
      const searchParams = new URLSearchParams(this.rootTileset.queryString);
      for (const [parameterName, parameterValue] of searchParams.entries()) {
        this.setQueryParameter(parameterName, parameterValue);
      }
    }

    this.asset = this.rootTileset.asset;
    if (!this.asset) {
      throw new Error('Tileset must have an asset property.');
    }
    if (
      this.asset.version !== '0.0' &&
      this.asset.version !== '1.0' &&
      this.asset.version !== '1.1'
    ) {
      throw new Error('The tileset must be 3D Tiles version either 0.0 or 1.0 or 1.1.');
    }

    if ('tilesetVersion' in this.asset) {
      this.setQueryParameter('v', this.asset.tilesetVersion);
    }

    this.properties = this.rootTileset.properties;
    this.extras = this.rootTileset.extras;
    this.credits = {attributions: []};
    this.extensionsUsed.splice(
      0,
      this.extensionsUsed.length,
      ...(this.rootTileset.extensionsUsed || [])
    );
    this.metadata = {
      type: this.type,
      loader: this.loader,
      url: this.url,
      basePath: this.basePath,
      tileset: this.rootTileset,
      lodMetricType: this.rootTileset.lodMetricType,
      lodMetricValue: this.rootTileset.lodMetricValue,
      refine: this.rootTileset.root?.refine
    };
  }

  /**
   * Returns normalized source metadata after initialization.
   */
  getMetadata(): TilesetSourceMetadata {
    if (!this.metadata) {
      throw new Error('Tiles3DSource has not been initialized');
    }
    return this.metadata;
  }

  /**
   * Returns the root 3D Tiles payload.
   */
  async getRootTileset(): Promise<TilesetJSON> {
    return this.getMetadata().tileset;
  }

  /**
   * Builds explicit runtime headers while leaving implicit subtree references lazy.
   */
  initializeTileHeaders(
    tileset: Tileset3D,
    tilesetJson: TilesetJSON,
    parentTile?: Tile3D | null
  ): Tile3D {
    const rootTile = new Tile3DNode(tileset, tilesetJson.root, parentTile || undefined);

    if (parentTile) {
      parentTile.children.push(rootTile);
      rootTile.depth = parentTile.depth + 1;
    }

    const stack: Tile3D[] = [rootTile];
    while (stack.length > 0) {
      const tile = stack.pop() as Tile3D;
      tileset.stats.get('Tiles In Tileset(s)').incrementCount();
      const children = tile.header.children || [];
      for (const childHeader of children) {
        const childTile = new Tile3DNode(tileset, childHeader, tile);
        if (childTile.contentUrl?.includes('?session=')) {
          const url = new URL(childTile.contentUrl);
          const session = url.searchParams.get('session');
          if (session) {
            this.setQueryParameter('session', session);
          }
        }
        tile.children.push(childTile);
        childTile.depth = tile.depth + 1;
        stack.push(childTile);
      }
    }

    return rootTile;
  }

  /**
   * Creates the standard 3D Tiles traverser.
   */
  createTraverser(options: TilesetTraverserProps): TilesetTraverser {
    return new Tileset3DTraverser(options);
  }

  /**
   * Loads binary content or nested tileset JSON for a runtime tile.
   */
  async loadTileContent(tile: Tile3D): Promise<TileContentLoadResult> {
    const contentUrl = this.getTileUrl(tile.contentUrl);
    const tilesetLoaderOptions =
      (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
    const options = {
      ...this.loadOptions,
      [this.loader.id]: {
        ...tilesetLoaderOptions,
        // Content bytes, rather than URL suffixes, distinguish external tilesets from renderable
        // payloads. This is required for signed and extensionless resources.
        isTileset: 'auto',
        assetGltfUpAxis: (this.asset && this.asset.gltfUpAxis) || 'Y'
      }
    };

    const content = await this.loadResourceData(contentUrl, options);
    tile.content = content;

    return {
      loaded: true,
      nestedTileset: content?.shape === 'tileset3d' ? content : undefined
    };
  }

  /**
   * Loads, materializes, and installs exactly one implicit subtree.
   *
   * Final URLs pass through the same query inheritance and archive/custom resolver path as render
   * content. Parsed resources are deduplicated by final URL, while the pure materializer creates
   * lazy placeholders for every available child subtree instead of recursively fetching them.
   *
   * @param tile - Existing contentless subtree-root placeholder.
   * @param frameState - View state that made this request eligible; priority is consumed earlier.
   * @returns Counts describing the installed subtree.
   */
  async loadTileChildren(tile: Tile3D, frameState: FrameState): Promise<TileChildrenLoadResult> {
    void frameState;
    const reference = tile.header.implicitSubtree as ImplicitSubtreeReference | undefined;
    if (!reference) {
      return {loaded: false, tileCount: 0, childSubtreeCount: 0};
    }

    const subtreeUrl = this.getTileUrl(reference.subtreeUrl);
    const subtree = await this.loadImplicitSubtreeResource(subtreeUrl);
    if (this.destroyed || tile.isDestroyed()) {
      return {loaded: false, tileCount: 0, childSubtreeCount: 0};
    }
    const materializedSubtree = materializeImplicitSubtree(subtree, {
      ...reference,
      subtreeUrl
    });

    tile.applyImplicitSubtreeHeader(materializedSubtree.root);
    const materializedTileCount = this.initializeMaterializedChildren(
      tile.tileset,
      tile,
      materializedSubtree.root.children
    );
    this.implicitTilingStats.loadedSubtrees++;
    this.implicitTilingStats.materializedTiles += materializedTileCount;

    return {
      loaded: true,
      tileCount: materializedSubtree.tileCount,
      childSubtreeCount: materializedSubtree.childSubtreeCount
    };
  }

  /**
   * Returns a snapshot of implicit-subtree request, cache, and materialization counters.
   *
   * @returns Immutable-by-convention diagnostic values for runtime inspection.
   */
  getImplicitTilingStats(): ImplicitTilingStats {
    return {
      ...this.implicitTilingStats,
      cachedSubtrees: this.implicitSubtreeCache.size - this.pendingImplicitSubtreeUrls.size,
      pendingSubtrees: this.pendingImplicitSubtreeUrls.size
    };
  }

  /**
   * Resolves a tile content URL with source-managed query parameters.
   *
   * Existing per-resource parameters take precedence over inherited root, version, and session
   * values. Completed URLs are cached by the original tile path; {@link setQueryParameter}
   * invalidates the cache before changed source state can be observed.
   *
   * @param tilePath - Unmodified absolute content URL or data URL from the tile header.
   * @returns Content URL with any missing source parameters appended.
   */
  getTileUrl(tilePath: string): string {
    if (tilePath.startsWith('data:')) {
      return tilePath;
    }

    const cachedTileUrl = this.tileUrlCache.get(tilePath);
    if (cachedTileUrl) {
      return cachedTileUrl;
    }

    if (!Object.keys(this.queryParams).length) {
      this.tileUrlCache.set(tilePath, tilePath);
      return tilePath;
    }

    const [pathWithoutQuery, existingQuery = ''] = tilePath.split('?');
    const mergedQueryParams = new URLSearchParams(existingQuery);

    for (const [key, value] of Object.entries(this.queryParams)) {
      if (!mergedQueryParams.has(key)) {
        mergedQueryParams.set(key, value);
      }
    }

    const queryParams = mergedQueryParams.toString();
    const tileUrl = queryParams ? `${pathWithoutQuery}?${queryParams}` : pathWithoutQuery;
    this.tileUrlCache.set(tilePath, tileUrl);
    return tileUrl;
  }

  /**
   * Updates an inherited source query parameter and invalidates derived request URLs.
   *
   * Root tokens and tileset versions normally settle during initialization. Some providers expose
   * a session parameter on a child URL, so invalidation is required to prevent URLs cached earlier
   * in header construction from retaining stale authentication state.
   *
   * @param parameterName - Query parameter name.
   * @param parameterValue - Query parameter value.
   */
  private setQueryParameter(parameterName: string, parameterValue: string): void {
    if (this.queryParams[parameterName] === parameterValue) {
      return;
    }
    this.queryParams[parameterName] = parameterValue;
    this.tileUrlCache.clear();
  }

  /**
   * Derives the default view state from the root bounding volume.
   */
  getViewState(rootTile: Tile3D | null): TilesetSourceViewState {
    if (!rootTile) {
      return {
        asset: this.asset,
        properties: this.properties,
        extras: this.extras,
        credits: this.credits
      };
    }

    const {center} = rootTile.boundingVolume;
    let cartographicCenter: Vector3;
    if (center && (center[0] !== 0 || center[1] !== 0 || center[2] !== 0)) {
      cartographicCenter = new Vector3();
      Ellipsoid.WGS84.cartesianToCartographic(center, cartographicCenter);
    } else {
      cartographicCenter = new Vector3(0, 0, -Ellipsoid.WGS84.radii[0]);
    }

    return {
      asset: this.asset,
      properties: this.properties,
      extras: this.extras,
      credits: this.credits,
      boundingVolume: rootTile.boundingVolume,
      cartographicCenter,
      cartesianCenter: center,
      zoom: getZoomFromBoundingVolume(rootTile.boundingVolume, cartographicCenter)
    };
  }

  /**
   * Checks whether the root tileset declares the given extension.
   */
  hasExtension(extensionName: string): boolean {
    return this.extensionsUsed.includes(extensionName);
  }

  /**
   * Updates content-format flags and installs nested tileset subtrees.
   */
  onTileLoaded(tileset: Tileset3D, tile: Tile3D, loadResult: TileContentLoadResult): void {
    const {extensionsRemoved = []} = tile.content?.gltf || {};
    if (extensionsRemoved.includes('KHR_draco_mesh_compression')) {
      this.contentFormats.draco = true;
    }
    if (extensionsRemoved.includes('EXT_meshopt_compression')) {
      this.contentFormats.meshopt = true;
    }
    if (extensionsRemoved.includes('KHR_texture_basisu')) {
      this.contentFormats.ktx2 = true;
    }

    if (loadResult.nestedTileset) {
      tileset._initializeTileHeaders(loadResult.nestedTileset, tile);
    }
  }

  /**
   * Loads data through injected core APIs so this module stays independent from `@loaders.gl/core`.
   */
  private async loadWithCoreApi(
    url: string,
    options: LoaderOptions,
    loader: LoaderWithParser = this.loader
  ): Promise<any> {
    if (!this.coreApi) {
      throw new Error('Tiles3DSource requires an injected coreApi to load tileset data');
    }

    return await this.coreApi.load(url, loader, options);
  }

  /**
   * Loads data through an injected resolver when present, otherwise through the injected core API.
   */
  private async loadRootData(url: string, options: LoaderOptions): Promise<any> {
    if (this.resolver) {
      return await this.resolver.loadRoot(url, this.loader, options);
    }

    return await this.loadWithCoreApi(url, options);
  }

  /**
   * Loads an arbitrary source resource through an injected resolver or core API.
   */
  private async loadResourceData(
    url: string,
    options: LoaderOptions,
    loader: LoaderWithParser = this.loader
  ): Promise<any> {
    if (this.resolver) {
      return await this.resolver.loadResource(url, loader, options);
    }

    return await this.loadWithCoreApi(url, options, loader);
  }

  /**
   * Returns a parsed subtree from the LRU cache or starts one source-managed request.
   *
   * @param subtreeUrl - Final subtree URL after query inheritance.
   * @returns Parsed subtree availability data.
   */
  private async loadImplicitSubtreeResource(subtreeUrl: string): Promise<ParsedImplicitSubtree> {
    const cachedSubtree = this.implicitSubtreeCache.get(subtreeUrl);
    if (cachedSubtree) {
      this.implicitTilingStats.cacheHits++;
      this.implicitSubtreeCache.delete(subtreeUrl);
      this.implicitSubtreeCache.set(subtreeUrl, cachedSubtree);
      return await cachedSubtree;
    }

    this.implicitTilingStats.requestedSubtrees++;
    this.pendingImplicitSubtreeUrls.add(subtreeUrl);
    const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
    const subtreePromise = this.loadResourceData(subtreeUrl, {
      ...this.loadOptions,
      [this.loader.id]: {
        ...loaderOptions,
        isTileset: false,
        isSubtree: true
      }
    }) as Promise<ParsedImplicitSubtree>;
    this.implicitSubtreeCache.set(subtreeUrl, subtreePromise);

    try {
      return await subtreePromise;
    } catch (error) {
      this.implicitSubtreeCache.delete(subtreeUrl);
      throw error;
    } finally {
      this.pendingImplicitSubtreeUrls.delete(subtreeUrl);
      this.trimImplicitSubtreeCache();
    }
  }

  /**
   * Instantiates every header represented by one materialized subtree.
   *
   * @param tileset - Owning runtime tileset.
   * @param parentTile - Existing materialized parent.
   * @param childHeaders - Headers to install below the parent.
   * @returns Number of newly allocated runtime tile nodes.
   */
  private initializeMaterializedChildren(
    tileset: Tileset3D,
    parentTile: Tile3D,
    childHeaders: Record<string, any>[]
  ): number {
    let materializedTileCount = 0;
    const stack: Array<{parentTile: Tile3D; childHeaders: Record<string, any>[]}> = [
      {parentTile, childHeaders}
    ];
    while (stack.length > 0) {
      const entry = stack.pop()!;
      for (const childHeader of entry.childHeaders) {
        const childTile = new Tile3DNode(tileset, childHeader, entry.parentTile);
        entry.parentTile.children.push(childTile);
        childTile.depth = entry.parentTile.depth + 1;
        tileset.stats.get('Tiles In Tileset(s)').incrementCount();
        materializedTileCount++;
        if (childHeader.children?.length) {
          stack.push({parentTile: childTile, childHeaders: childHeader.children});
        }
      }
    }
    return materializedTileCount;
  }

  /** Evicts least-recently-used settled subtree entries until the configured bound is met. */
  private trimImplicitSubtreeCache(): void {
    if (this.implicitSubtreeCache.size <= this.maximumCachedSubtrees) {
      return;
    }
    for (const subtreeUrl of this.implicitSubtreeCache.keys()) {
      if (!this.pendingImplicitSubtreeUrls.has(subtreeUrl)) {
        this.implicitSubtreeCache.delete(subtreeUrl);
      }
      if (this.implicitSubtreeCache.size <= this.maximumCachedSubtrees) {
        break;
      }
    }
  }
}

function isTilesetRequest(input: TilesetSourceInput): input is TilesetSourceRequest {
  return Boolean(
    input && typeof input === 'object' && 'url' in input && 'loader' in input && !('type' in input)
  );
}

/**
 * Normalizes constructor input into a URL request descriptor.
 * @param input Constructor input for {@link Tiles3DSource}.
 * @returns A normalized request with a resolved base path.
 */
function normalizeTiles3DRequest(input: TilesetSourceInput): TilesetSourceRequest {
  if (isTilesetRequest(input)) {
    return {
      ...input,
      basePath: input.basePath || path.dirname(input.url)
    };
  }

  return {
    url: input.url,
    loader: input.loader,
    basePath: input.basePath || path.dirname(input.url),
    resolver: (input as TilesetSourceRequest).resolver,
    coreApi: (input as TilesetSourceRequest).coreApi
  };
}
