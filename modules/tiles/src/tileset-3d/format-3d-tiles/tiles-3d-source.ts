// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {path, RequestCache, sliceArrayBuffer} from '@loaders.gl/loader-utils';
import {Ellipsoid} from '@math.gl/geospatial';
import {Matrix4, Vector3} from '@math.gl/core';
import type {CoreAPI, Loader, LoaderContext, LoaderOptions} from '@loaders.gl/loader-utils';
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
import {get3DTilesSpatialReference} from '../../spatial/format-spatial-reference';
import {Tiles3DSpatialTransformer} from '../../spatial/tiles-3d-spatial-transformer';
import {
  applyTilesetSpatialOptions,
  markTilesetSpatialReferenceTransformed
} from '../../spatial/spatial-types';
import type {TilesetSpatialReference} from '../../spatial/spatial-types';
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

type PackageFile = {
  name?: string;
  mimeType: string;
  uri?: string;
  originalUri?: string;
  data?: ArrayBuffer;
  byteOffset: number;
  byteLength: number;
  bufferUri?: string;
};

type PackageResource = {fileIndex: number; files: PackageFile[]};

type Tiles3DPackageLoaderContext = LoaderContext & {
  /** Parent package records available while parsing an embedded tileset or subtree. */
  _tiles3dPackageFiles: PackageFile[];
};

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
  readonly loader: Loader;
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
  /** Original content descriptors retained across {@link Tile3D.unloadContent} calls. */
  private readonly tileContentHeaders = new WeakMap<Tile3D, Record<string, any>[]>();
  /** Source-local namespaces assigned to distinct embedded glTF package file collections. */
  private readonly packageNamespaces = new WeakMap<PackageFile[], number>();
  /** Next source-local package namespace. */
  private nextPackageNamespace = 0;
  /** Parsed subtree requests keyed by final source URL for deduplication and LRU reuse. */
  private readonly implicitSubtreeCache: RequestCache<ParsedImplicitSubtree>;
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
  /** CRS transformer shared by this source's headers and decoded glTF content. */
  private spatialTransformer?: Tiles3DSpatialTransformer;
  /** Root header after composing source-frame transforms and rebuilding target bounds. */
  private preparedRootHeader?: Record<string, any>;

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
    const maximumCacheEntries = Number.isFinite(maximumCachedSubtrees)
      ? Math.max(0, Math.floor(maximumCachedSubtrees))
      : DEFAULT_MAXIMUM_CACHED_SUBTREES;
    this.implicitSubtreeCache = new RequestCache({maxEntries: maximumCacheEntries});
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
      this.rootTileset.formatVersion !== '2.0-draft' &&
      this.asset.version !== '0.0' &&
      this.asset.version !== '1.0' &&
      this.asset.version !== '1.1'
    ) {
      throw new Error('The tileset must be 3D Tiles version 0.0, 1.0, 1.1, or 2.0-draft.');
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
      refine: this.rootTileset.root?.refine,
      spatialReference: get3DTilesSpatialReference(this.rootTileset)
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

  /** Prepare nonlinear CRS state before runtime headers are materialized. */
  async prepareTileset(tileset: Tileset3D): Promise<void> {
    const spatialReference = tileset.spatialReference;
    if (spatialReference.status === 'unresolved') {
      throw new Error(
        spatialReference.warnings[0] ||
          '3D Tiles spatial operations cannot be resolved from the supplied metadata and options'
      );
    }
    if (spatialReference.status !== 'transformable' && spatialReference.status !== 'transformed') {
      return;
    }
    this.spatialTransformer ||= new Tiles3DSpatialTransformer(
      spatialReference,
      tileset.options.spatial
    );
    tileset.spatialReference = markTilesetSpatialReferenceTransformed(spatialReference);
    this.preparedRootHeader = this.transformTileHeader(
      this.getMetadata().tileset.root,
      new Matrix4()
    );
  }

  /**
   * Builds explicit runtime headers while leaving implicit subtree references lazy.
   */
  initializeTileHeaders(
    tileset: Tileset3D,
    tilesetJson: TilesetJSON,
    parentTile?: Tile3D | null
  ): Tile3D {
    const rootHeader = parentTile ? tilesetJson.root : this.preparedRootHeader || tilesetJson.root;
    const rootTile = new Tile3DNode(tileset, rootHeader, parentTile || undefined);

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
    const contentUrls = (tile.contentUrls || [tile.contentUrl]).filter(Boolean);
    const cachedContentHeaders = this.tileContentHeaders.get(tile);
    const contentHeaders: Record<string, any>[] =
      cachedContentHeaders ||
      (Array.isArray(tile.header?.content)
        ? tile.header.content
        : tile.header?.content
          ? [tile.header.content]
          : []);
    if (!cachedContentHeaders) {
      this.tileContentHeaders.set(tile, contentHeaders);
    }
    const tilesetLoaderOptions =
      (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
    const options = {
      ...this.loadOptions,
      [this.loader.id]: {
        ...tilesetLoaderOptions,
        // Content bytes, rather than URL suffixes, distinguish external tilesets from renderable
        // payloads. This is required for signed and extensionless resources.
        isTileset: 'auto',
        assetGltfUpAxis: (this.asset && this.asset.gltfUpAxis) || 'Y',
        _tilesetOptions: {
          spatialReference: tile.header?._spatialReference || tile.tileset?.spatialReference,
          spatialOptions: tile.tileset?.options.spatial,
          spatialTransform: tile.header?._spatialTransform
        }
      }
    };

    const contents = await Promise.all(
      contentUrls.map((contentUrl, contentIndex) => {
        const contentHeader = contentHeaders[contentIndex] || {};
        const vectorExtension = contentHeader.extensions?.['3DTILES_content_gltf_vector'];
        const vectorContent =
          contentHeader._vectorContent ||
          (vectorExtension?.vector === true ? {clip: vectorExtension.clip === true} : undefined);
        const contentOptions = vectorContent
          ? {
              ...options,
              [this.loader.id]: {
                ...(options[this.loader.id] as Record<string, unknown>),
                vectorContent
              }
            }
          : options;
        return this.loadContentResource(
          this.getTileUrl(contentUrl),
          contentHeader._resource,
          contentOptions
        );
      })
    );
    tile.contents = contents;
    tile.content = contents[0] || null;
    const nestedTilesets = contents.filter(content => content?.shape === 'tileset3d');

    return {
      loaded: true,
      contents,
      nestedTileset: nestedTilesets[0],
      nestedTilesets
    };
  }

  /** Transform a tile header and its eagerly declared descendants. */
  private transformTileHeader(
    header: Record<string, any>,
    parentTransform: Matrix4 = new Matrix4()
  ): Record<string, any> {
    if (!this.spatialTransformer) {
      return header;
    }
    return this.transformTileHeaderWithTransformer(
      header,
      this.spatialTransformer,
      parentTransform
    );
  }

  /** Rebuilds one header subtree using an explicitly selected CRS transformer. */
  private transformTileHeaderWithTransformer(
    header: Record<string, any>,
    transformer: Tiles3DSpatialTransformer,
    parentTransform: Matrix4,
    spatialReference?: TilesetSpatialReference
  ): Record<string, any> {
    const localTransform = header.transform ? new Matrix4(header.transform) : new Matrix4();
    const composedTransform = new Matrix4(parentTransform).multiplyRight(localTransform);
    const content = Array.isArray(header.content)
      ? header.content.map((entry: Record<string, any>) =>
          this.transformContentHeader(entry, composedTransform, transformer)
        )
      : header.content
        ? this.transformContentHeader(header.content, composedTransform, transformer)
        : header.content;
    return {
      ...header,
      transform: undefined,
      boundingVolume: header.boundingVolume
        ? transformer.transformBoundingVolume(header.boundingVolume, composedTransform)
        : header.boundingVolume,
      _spatialReference: spatialReference,
      _spatialTransform: composedTransform.toArray(),
      content,
      children: Array.isArray(header.children)
        ? header.children.map((child: Record<string, any>) =>
            this.transformTileHeaderWithTransformer(
              child,
              transformer,
              composedTransform,
              spatialReference
            )
          )
        : header.children
    };
  }

  private transformContentHeader(
    content: Record<string, any>,
    composedTransform: Matrix4,
    transformer: Tiles3DSpatialTransformer
  ): Record<string, any> {
    return {
      ...content,
      boundingVolume: content.boundingVolume
        ? transformer.transformBoundingVolume(content.boundingVolume, composedTransform)
        : content.boundingVolume
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
    const subtree = await this.loadImplicitSubtreeResource(subtreeUrl, reference.resource);
    if (this.destroyed || tile.isDestroyed()) {
      return {loaded: false, tileCount: 0, childSubtreeCount: 0};
    }
    const materializedSubtree = materializeImplicitSubtree(subtree, {
      ...reference,
      subtreeUrl
    });

    const nestedSpatialReference = tile.header._spatialReference as
      | TilesetSpatialReference
      | undefined;
    const subtreeTransformer = nestedSpatialReference
      ? new Tiles3DSpatialTransformer(nestedSpatialReference, tile.tileset.options.spatial)
      : this.spatialTransformer;
    const materializedRoot = subtreeTransformer
      ? this.transformTileHeaderWithTransformer(
          materializedSubtree.root,
          subtreeTransformer,
          new Matrix4(),
          nestedSpatialReference
        )
      : materializedSubtree.root;
    tile.applyImplicitSubtreeHeader(materializedRoot);
    const materializedTileCount = this.initializeMaterializedChildren(
      tile.tileset,
      tile,
      materializedRoot.children
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
      cachedSubtrees: this.implicitSubtreeCache.size - this.implicitSubtreeCache.pendingSize,
      pendingSubtrees: this.implicitSubtreeCache.pendingSize
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
    const contents = tile.contents.length ? tile.contents : [tile.content];
    const extensionsRemoved = contents.flatMap(content => content?.gltf?.extensionsRemoved || []);
    if (extensionsRemoved.includes('KHR_draco_mesh_compression')) {
      this.contentFormats.draco = true;
    }
    if (extensionsRemoved.includes('EXT_meshopt_compression')) {
      this.contentFormats.meshopt = true;
    }
    if (extensionsRemoved.includes('KHR_texture_basisu')) {
      this.contentFormats.ktx2 = true;
    }

    const nestedTilesets =
      loadResult.nestedTilesets || (loadResult.nestedTileset ? [loadResult.nestedTileset] : []);
    for (const nestedTileset of nestedTilesets) {
      tileset._initializeTileHeaders(this.prepareNestedTileset(tileset, nestedTileset), tile);
    }
  }

  /**
   * Resolves a nested tileset's CRS independently and adapts it to the owning tileset output frame.
   *
   * Nested resources may use a different source CRS from their parent. Their headers and glTF
   * payloads must therefore use a transformer built from the nested descriptor, while the parent
   * runtime continues to expose one requested output frame to traversal and rendering.
   */
  private prepareNestedTileset(tileset: Tileset3D, nestedTileset: TilesetJSON): TilesetJSON {
    const nestedSpatialReference = nestedTileset.spatialMetadata;
    const parentSpatialReference = tileset.spatialReference;

    if (
      nestedSpatialReference?.status === 'unresolved' ||
      nestedSpatialReference?.crs.state === 'unknown'
    ) {
      throw new Error(
        nestedSpatialReference.warnings[0] ||
          'Nested 3D Tiles CRS is explicitly unresolved and cannot be placed in the parent frame'
      );
    }

    if (!nestedSpatialReference || !nestedSpatialReference.sourceCrs) {
      if (
        this.spatialTransformer &&
        (parentSpatialReference.status === 'transformable' ||
          parentSpatialReference.status === 'transformed')
      ) {
        return {
          ...nestedTileset,
          spatialMetadata: parentSpatialReference,
          root: this.transformTileHeaderWithTransformer(
            nestedTileset.root,
            this.spatialTransformer,
            new Matrix4(),
            parentSpatialReference
          )
        };
      }
      return addNestedSpatialReference(nestedTileset, parentSpatialReference);
    }

    const parentCoordinateEpoch = parentSpatialReference.coordinateEpoch;
    const nestedCoordinateEpoch = nestedSpatialReference.coordinateEpoch;
    if (
      parentCoordinateEpoch !== undefined &&
      nestedCoordinateEpoch !== undefined &&
      parentCoordinateEpoch !== nestedCoordinateEpoch
    ) {
      throw new Error(
        `Nested 3D Tiles coordinate epoch ${nestedCoordinateEpoch} differs from parent epoch ${parentCoordinateEpoch}; epoch-aware transformation is unavailable`
      );
    }

    const outputCrs = parentSpatialReference.targetCrs || parentSpatialReference.sourceCrs;
    if (!outputCrs) {
      return addNestedSpatialReference(nestedTileset, nestedSpatialReference);
    }

    const nestedOutputReference = applyTilesetSpatialOptions(nestedSpatialReference, {
      ...tileset.options.spatial,
      outputCoordinates: 'target-crs',
      targetCrs: outputCrs
    });
    if (nestedOutputReference.status === 'unresolved') {
      throw new Error(
        nestedOutputReference.warnings[0] ||
          'Nested 3D Tiles CRS cannot be resolved in the parent output frame'
      );
    }
    if (nestedOutputReference.status === 'native') {
      return addNestedSpatialReference(nestedTileset, nestedOutputReference);
    }

    const nestedTransformer = new Tiles3DSpatialTransformer(
      nestedOutputReference,
      tileset.options.spatial
    );
    return {
      ...nestedTileset,
      spatialMetadata: nestedOutputReference,
      root: this.transformTileHeaderWithTransformer(
        nestedTileset.root,
        nestedTransformer,
        new Matrix4(),
        nestedOutputReference
      )
    };
  }

  /**
   * Loads data through injected core APIs so this module stays independent from `@loaders.gl/core`.
   */
  private async loadWithCoreApi(
    url: string,
    options: LoaderOptions,
    loader: Loader = this.loader
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
    loader: Loader = this.loader
  ): Promise<any> {
    if (this.resolver) {
      return await this.resolver.loadResource(url, loader, options);
    }

    return await this.loadWithCoreApi(url, options, loader);
  }

  /** Loads a URL content reference or parses a buffer-view file retained from a glTF package. */
  private async loadContentResource(
    url: string,
    packageResource: PackageResource | undefined,
    options: LoaderOptions
  ): Promise<any> {
    if (!packageResource) {
      return await this.loadResourceData(url, options);
    }
    const file = packageResource.files[packageResource.fileIndex];
    if (!file) {
      throw new Error(`3D Tiles package references missing file ${packageResource.fileIndex}`);
    }
    if (file.uri) {
      return await this.loadResourceData(this.getTileUrl(file.uri), options);
    }
    if (!this.coreApi) {
      throw new Error('Tiles3DSource requires an injected coreApi to parse embedded package data');
    }

    const data = await this.getPackageFileData(file);
    const packageNamespace = this.getPackageNamespace(packageResource.files);
    const packageRootUrl = `gltf-package://${packageNamespace}/${packageResource.fileIndex}`;
    const fileName = file.name || 'content';
    const directorySeparatorIndex = fileName.lastIndexOf('/');
    const packageBaseUrl =
      directorySeparatorIndex >= 0
        ? `${packageRootUrl}/${fileName.slice(0, directorySeparatorIndex)}`
        : packageRootUrl;
    return await this.coreApi.parse(data, this.loader, options, {
      url: `${packageRootUrl}/${fileName}`,
      filename: fileName,
      baseUrl: packageBaseUrl,
      loaders: [this.loader],
      coreApi: this.coreApi,
      _parse: this.coreApi.parse,
      _tiles3dPackageFiles: packageResource.files,
      fetch: async (resource: string, init?: RequestInit) => {
        const reference = resource.startsWith(`${packageRootUrl}/`)
          ? resource.slice(packageRootUrl.length + 1)
          : resource;
        const referencedFile = packageResource.files.find(
          packageFile => packageFile.name === reference || packageFile.originalUri === reference
        );
        if (!referencedFile) {
          throw new Error(`3D Tiles glTF package does not contain file ${reference}`);
        }
        if (referencedFile.uri) {
          return await this.coreApi!.fetchFile(this.getTileUrl(referencedFile.uri), init);
        }
        const referencedData = await this.getPackageFileData(referencedFile);
        return new Response(referencedData, {
          headers: {'content-type': referencedFile.mimeType}
        });
      }
    } as Tiles3DPackageLoaderContext);
  }

  /** Returns a stable source-local namespace for one embedded glTF package file collection. */
  private getPackageNamespace(files: PackageFile[]): number {
    const existingNamespace = this.packageNamespaces.get(files);
    if (existingNamespace !== undefined) {
      return existingNamespace;
    }
    const packageNamespace = this.nextPackageNamespace++;
    this.packageNamespaces.set(files, packageNamespace);
    return packageNamespace;
  }

  /** Resolves a retained package-file byte range without eagerly copying other package files. */
  private async getPackageFileData(file: PackageFile): Promise<ArrayBuffer> {
    if (file.data) {
      return sliceArrayBuffer(file.data, file.byteOffset, file.byteLength);
    }
    if (file.bufferUri && this.coreApi) {
      const response = await this.coreApi.fetchFile(this.getTileUrl(file.bufferUri));
      if (!response.ok) {
        throw new Error(`Failed to fetch 3D Tiles package buffer: HTTP ${response.status}`);
      }
      const buffer = await response.arrayBuffer();
      return sliceArrayBuffer(buffer, file.byteOffset, file.byteLength);
    }
    throw new Error('3D Tiles package file has no available byte source');
  }

  /**
   * Returns a parsed subtree from the LRU cache or starts one source-managed request.
   *
   * @param subtreeUrl - Final subtree URL after query inheritance.
   * @param packageResource - Optional glTF package file satisfying the subtree reference.
   * @returns Parsed subtree availability data.
   */
  private async loadImplicitSubtreeResource(
    subtreeUrl: string,
    packageResource?: PackageResource
  ): Promise<ParsedImplicitSubtree> {
    const cachedSubtree = this.implicitSubtreeCache.get(subtreeUrl);
    if (cachedSubtree) {
      this.implicitTilingStats.cacheHits++;
      return await cachedSubtree;
    }

    this.implicitTilingStats.requestedSubtrees++;
    const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
    return await this.implicitSubtreeCache.getOrLoad(subtreeUrl, async () => {
      const options = {
        ...this.loadOptions,
        [this.loader.id]: {
          ...loaderOptions,
          isTileset: false,
          isSubtree: true
        }
      };
      return (await (packageResource
        ? this.loadContentResource(subtreeUrl, packageResource, options)
        : this.loadResourceData(subtreeUrl, options))) as ParsedImplicitSubtree;
    });
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

/** Adds a nested CRS descriptor to each header without changing its native placement. */
function addNestedSpatialReference(
  nestedTileset: TilesetJSON,
  spatialReference: TilesetSpatialReference
): TilesetJSON {
  const addToHeader = (header: Record<string, any>): Record<string, any> => ({
    ...header,
    _spatialReference: spatialReference,
    children: Array.isArray(header.children) ? header.children.map(addToHeader) : header.children
  });
  return {
    ...nestedTileset,
    spatialMetadata: spatialReference,
    root: addToHeader(nestedTileset.root)
  };
}
