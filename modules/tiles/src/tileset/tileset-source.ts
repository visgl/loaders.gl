// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Vector3} from '@math.gl/core';
import type {TilesetTraverser, TilesetTraverserProps} from './tileset-traverser';
import type {Tile3D} from './tile-3d';
import type {Tileset3D} from './tileset-3d';
import type {FrameState} from './helpers/frame-state';
import type {TILESET_TYPE} from '../constants';

/**
 * Parsed top-level tileset payload consumed by {@link Tileset3D} or a {@link TilesetSource}.
 */
export type TilesetJSON = any;

/**
 * URL-based source input used when a source is responsible for fetching root metadata.
 */
export type TilesetSourceRequest = {
  /** Absolute root metadata URL. */
  url: string;
  /** Loader used to fetch and parse the root metadata. */
  loader: LoaderWithParser;
  /** Optional base path override for relative resources. */
  basePath?: string;
};

/**
 * Constructor input accepted by explicit source implementations.
 *
 * Request descriptors are the public path. Preloaded metadata remains useful for tests and
 * internal call sites that already own parsed root metadata.
 */
export type TilesetSourceInput = TilesetJSON | TilesetSourceRequest;

/**
 * Result of a source-managed tile content request.
 */
export type TileContentLoadResult = {
  /** Whether the tile content request produced usable content. */
  loaded: boolean;
  /** Nested tileset metadata to install below the loaded tile, if any. */
  nestedTileset?: TilesetJSON;
};

/**
 * Flags describing compression and texture formats observed while streaming tile content.
 */
export type TilesetContentFormats = {
  draco: boolean;
  meshopt: boolean;
  dds: boolean;
  ktx2: boolean;
};

/**
 * Optional view-state metadata exposed by a {@link TilesetSource} after initialization.
 */
export type TilesetSourceViewState = {
  cartographicCenter?: Vector3 | null;
  cartesianCenter?: Vector3 | null;
  zoom?: number;
  boundingVolume?: any;
  description?: string;
  properties?: any;
  extras?: any;
  credits?: any;
  asset?: Record<string, any>;
};

/**
 * Normalized source metadata consumed by {@link Tileset3D}.
 */
export type TilesetSourceMetadata = {
  /** Format discriminator. */
  type: TILESET_TYPE;
  /** Loader used for metadata and content requests. */
  loader: LoaderWithParser;
  /** Absolute root metadata URL. */
  url: string;
  /** Base path used for relative resource resolution. */
  basePath: string;
  /** Parsed and normalized source payload. */
  tileset: TilesetJSON;
  /** Root lod metric type used as fallback by runtime tiles. */
  lodMetricType: string;
  /** Root lod metric value used as fallback by runtime tiles. */
  lodMetricValue: number;
  /** Root refinement mode used as fallback by runtime tiles. */
  refine: string;
};

/**
 * Format-specific adapter used by {@link Tileset3D} for initialization, loading, and metadata access.
 */
export interface TilesetSource {
  /** Tileset format discriminator. */
  readonly type: TILESET_TYPE;
  /** Loader used for content and metadata requests. */
  readonly loader: LoaderWithParser;
  /** Absolute URL of the root tileset resource. */
  readonly url: string;
  /** Base directory used for relative resource resolution. */
  readonly basePath: string;
  /** Source-specific root tileset payload, when available. */
  readonly tileset?: TilesetJSON | null;
  /** Loader options forwarded to metadata and content requests. */
  readonly loadOptions: LoaderOptions;
  /** Accumulated content-format flags for the tileset. */
  readonly contentFormats: TilesetContentFormats;
  /** Format-specific asset metadata, if any. */
  asset?: Record<string, any>;
  /** Per-feature property schema, if any. */
  properties?: any;
  /** Application-specific root metadata, if any. */
  extras?: any;
  /** Attribution and credit metadata, if any. */
  credits?: any;

  /** Normalized source metadata after initialization. */
  metadata?: TilesetSourceMetadata;

  /**
   * Initializes source state before traversal begins.
   */
  initialize(): Promise<void>;

  /**
   * Returns normalized source metadata after initialization completes.
   */
  getMetadata(): TilesetSourceMetadata;

  /**
   * Returns the root tileset payload after source initialization completes.
   */
  getRootTileset(): Promise<TilesetJSON>;

  /**
   * Creates the runtime tile tree for a tileset payload or nested subtree.
   */
  initializeTileHeaders(
    tileset: Tileset3D,
    tilesetJson: TilesetJSON,
    parentTile?: Tile3D | null
  ): Tile3D;

  /**
   * Creates the traverser implementation appropriate for this source.
   */
  createTraverser(options: TilesetTraverserProps): TilesetTraverser;

  /**
   * Loads renderable content for a tile.
   */
  loadTileContent(tile: Tile3D): Promise<TileContentLoadResult>;

  /**
   * Resolves a tile-relative path to the final request URL.
   */
  getTileUrl(tilePath: string): string;

  /**
   * Returns tileset-level view metadata derived from the loaded source.
   */
  getViewState(rootTile: Tile3D | null): TilesetSourceViewState;

  /**
   * Checks whether the source declares a specific extension.
   */
  hasExtension?(extensionName: string): boolean;

  /**
   * Loads child tile metadata on demand for formats that do not expose the full tree up front.
   */
  loadChildTileHeader?(parentTile: Tile3D, childId: string, frameState: FrameState): Promise<any>;

  /**
   * Updates source-managed bookkeeping after a tile finishes loading.
   */
  onTileLoaded?(tileset: Tileset3D, tile: Tile3D, loadResult: TileContentLoadResult): void;

  /**
   * Returns the total known tile count for stats, if available.
   */
  getTilesTotalCount?(): number | null;
}

/**
 * Type guard for distinguishing a source-backed constructor input from legacy tileset JSON.
 */
export function isTilesetSource(value: unknown): value is TilesetSource {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'initialize' in value &&
      'getRootTileset' in value &&
      'initializeTileHeaders' in value &&
      'loadTileContent' in value
  );
}
