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
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  Tileset3DSource,
  TilesetSourceInput,
  TilesetSourceMetadata,
  TilesetSourceRequest,
  TilesetSourceViewState
} from '../common/tileset-source';
import {Tile3D as Tile3DNode} from '../common/tile-3d';
import {getZoomFromBoundingVolume} from '../helpers/zoom';
import {TILESET_TYPE} from '../../constants';
import type {TilesetTraverser, TilesetTraverserProps} from '../common/tileset-traverser';

const EMPTY_CONTENT_FORMATS: TilesetContentFormats = {
  draco: false,
  meshopt: false,
  dds: false,
  ktx2: false
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
  private readonly extensionsUsed: string[] = [];
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
    this.coreApi = request.coreApi;
    this.loadOptions = loadOptions;
  }

  /**
   * Fetches and validates top-level metadata, then normalizes common fields used by {@link Tileset3D}.
   */
  async initialize(): Promise<void> {
    if (!this.rootTileset) {
      const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};
      this.rootTileset = await this.loadWithCoreApi(this.url, {
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
      Object.assign(this.queryParams, Object.fromEntries(searchParams.entries()));
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
      this.queryParams.v = this.asset.tilesetVersion;
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
   * Builds the eager runtime tile tree for a 3D Tiles subtree.
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
            this.queryParams.session = session;
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
        isTileset: tile.type === 'json',
        assetGltfUpAxis: (this.asset && this.asset.gltfUpAxis) || 'Y'
      }
    };

    const content = await this.loadWithCoreApi(contentUrl, options);
    tile.content = content;

    return {
      loaded: true,
      nestedTileset: tile.contentUrl.includes('.json') ? content : undefined
    };
  }

  /**
   * Resolves a tile content URL with source-managed query parameters.
   */
  getTileUrl(tilePath: string): string {
    if (tilePath.startsWith('data:')) {
      return tilePath;
    }

    if (!Object.keys(this.queryParams).length) {
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
    return queryParams ? `${pathWithoutQuery}?${queryParams}` : pathWithoutQuery;
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
  private async loadWithCoreApi(url: string, options: LoaderOptions): Promise<any> {
    if (!this.coreApi) {
      throw new Error('Tiles3DSource requires an injected coreApi to load tileset data');
    }

    return await this.coreApi.load(url, this.loader, options);
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
    basePath: input.basePath || path.dirname(input.url)
  };
}
