// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {path} from '@loaders.gl/loader-utils';
import {Ellipsoid} from '@math.gl/geospatial';
import {Vector3} from '@math.gl/core';
import type {CoreAPI, LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import type {Tile3D} from '../common/tile-3d';
import {Tile3D as Tile3DNode} from '../common/tile-3d';
import {I3STilesetTraverser} from './i3s-tileset-traverser';
import type {Tileset3D} from '../common/tileset-3d';
import type {FrameState} from '../helpers/frame-state';
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
import {getZoomFromExtent, getZoomFromFullExtent} from '../helpers/zoom';
import {TILESET_TYPE} from '../../constants';
import type {TilesetTraverser, TilesetTraverserProps} from '../common/tileset-traverser';

const EMPTY_CONTENT_FORMATS: TilesetContentFormats = {
  draco: false,
  meshopt: false,
  dds: false,
  ktx2: false
};

/**
 * {@link Tileset3DSource} implementation for I3S datasets.
 */
export class I3SSource implements Tileset3DSource {
  /** I3S format discriminator. */
  readonly type = TILESET_TYPE.I3S;
  /** Loader used for tile metadata and content requests. */
  readonly loader: LoaderWithParser;
  /** Root I3S layer URL. */
  readonly url: string;
  /** Base path used for relative tile resource resolution. */
  readonly basePath: string;
  /** Parsed I3S layer metadata. */
  tileset: TilesetJSON | null = null;
  /** Loader options forwarded to tile requests. */
  readonly loadOptions: LoaderOptions;
  /** Core API used for metadata and tile-content loads when injected by the caller. */
  coreApi?: CoreAPI;
  /** Aggregate content-format flags discovered during streaming. */
  readonly contentFormats: TilesetContentFormats = {...EMPTY_CONTENT_FORMATS};

  asset?: Record<string, any>;
  properties?: any;
  extras?: any;
  credits?: any;
  metadata?: TilesetSourceMetadata;

  private readonly queryParams: Record<string, string> = {};
  private rootTileset: TilesetJSON;

  /**
   * Creates an I3S source.
   * @param input Root metadata request, or preloaded root metadata for tests and internal callers.
   * @param loadOptions Loader options forwarded to tile requests.
   */
  constructor(input: TilesetSourceInput, loadOptions: LoaderOptions = {}) {
    const request = normalizeI3SRequest(input);
    this.rootTileset = isTilesetRequest(input) ? null : input;
    this.tileset = this.rootTileset;
    this.loader = request.loader;
    this.url = request.url;
    this.basePath = request.basePath || path.dirname(request.url);
    this.coreApi = request.coreApi;
    this.loadOptions = loadOptions;
  }

  /**
   * Fetches and normalizes root I3S metadata for runtime consumption.
   */
  async initialize(): Promise<void> {
    if (!this.rootTileset) {
      this.rootTileset = await this.loadWithCoreApi(this.url, this.loadOptions);
    }
    this.tileset = this.rootTileset;

    if (this.rootTileset.root && typeof this.rootTileset.root.then === 'function') {
      this.rootTileset.root = await this.rootTileset.root;
    }

    const i3sOptions = this.loadOptions.i3s;
    if (i3sOptions && typeof i3sOptions === 'object' && 'token' in i3sOptions) {
      const token = (i3sOptions as Record<string, unknown>).token;
      if (typeof token === 'string') {
        this.queryParams.token = token;
      }
    }

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
      throw new Error('I3SSource has not been initialized');
    }
    return this.metadata;
  }

  /**
   * Returns the initialized I3S root metadata.
   */
  async getRootTileset(): Promise<TilesetJSON> {
    return this.getMetadata().tileset;
  }

  /**
   * Creates the runtime root tile for an I3S subtree.
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
    return rootTile;
  }

  /**
   * Creates the standard I3S traverser.
   */
  createTraverser(options: TilesetTraverserProps): TilesetTraverser {
    return new I3STilesetTraverser(options);
  }

  /**
   * Loads renderable content for an I3S tile.
   */
  async loadTileContent(tile: Tile3D): Promise<TileContentLoadResult> {
    const contentUrl = this.getTileUrl(tile.contentUrl);
    const loaderId = this.loader.id;
    const loaderOptions = (this.loadOptions[loaderId] as Record<string, unknown>) || {};
    const metadata = this.getMetadata();
    const options = {
      ...this.loadOptions,
      [loaderId]: {
        ...loaderOptions,
        ...tile.tileset.options.i3s,
        _tileOptions: {
          attributeUrls: tile.header.attributeUrls,
          textureUrl: tile.header.textureUrl,
          textureFormat: tile.header.textureFormat,
          textureLoaderOptions: tile.header.textureLoaderOptions,
          materialDefinition: tile.header.materialDefinition,
          isDracoGeometry: tile.header.isDracoGeometry,
          mbs: tile.header.mbs
        },
        _tilesetOptions: {
          store: metadata.tileset.store,
          attributeStorageInfo: metadata.tileset.attributeStorageInfo,
          fields: metadata.tileset.fields
        },
        isTileHeader: false
      }
    };

    tile.content = await this.loadWithCoreApi(contentUrl, options);
    return {loaded: true};
  }

  /**
   * Loads child tile metadata on demand from node pages or `/nodes/{id}` resources.
   */
  async loadChildTileHeader(
    _parentTile: Tile3D,
    childId: string,
    _frameState: FrameState
  ): Promise<any> {
    const metadata = this.getMetadata();
    if (metadata.tileset.nodePages) {
      return await metadata.tileset.nodePagesTile.formTileFromNodePages(childId);
    }

    const nodeUrl = this.getTileUrl(`${this.url}/nodes/${childId}`);
    const i3sLoaderOptions =
      this.loadOptions.i3s && typeof this.loadOptions.i3s === 'object'
        ? (this.loadOptions.i3s as Record<string, unknown>)
        : {};
    const options = {
      ...this.loadOptions,
      i3s: {
        ...i3sLoaderOptions,
        isTileHeader: true
      }
    };

    return await this.loadWithCoreApi(nodeUrl, options);
  }

  /**
   * Loads data through injected core APIs so this module stays independent from `@loaders.gl/core`.
   */
  private async loadWithCoreApi(url: string, options: LoaderOptions): Promise<any> {
    if (!this.coreApi) {
      throw new Error('I3SSource requires an injected coreApi to load tileset data');
    }

    return await this.coreApi.load(url, this.loader, options);
  }

  /**
   * Resolves an I3S request URL with source-managed query parameters.
   */
  getTileUrl(tilePath: string): string {
    if (tilePath.startsWith('data:')) {
      return tilePath;
    }

    if (!Object.keys(this.queryParams).length) {
      return tilePath;
    }

    const queryParams = new URLSearchParams(this.queryParams).toString();
    return `${tilePath}${tilePath.includes('?') ? '&' : '?'}${queryParams}`;
  }

  /**
   * Derives the default view state from full extent or store extent metadata.
   */
  getViewState(_rootTile: Tile3D | null): TilesetSourceViewState {
    const metadata = this.getMetadata();
    const fullExtent = metadata.tileset.fullExtent;
    if (fullExtent) {
      const {xmin, xmax, ymin, ymax, zmin, zmax} = fullExtent;
      const cartographicCenter = new Vector3(
        xmin + (xmax - xmin) / 2,
        ymin + (ymax - ymin) / 2,
        zmin + (zmax - zmin) / 2
      );
      const cartesianCenter = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(cartographicCenter, cartesianCenter);
      return {
        cartographicCenter,
        cartesianCenter,
        zoom: getZoomFromFullExtent(fullExtent, cartographicCenter, cartesianCenter)
      };
    }

    const extent = metadata.tileset.store?.extent;
    if (extent) {
      const [xmin, ymin, xmax, ymax] = extent;
      const cartographicCenter = new Vector3(xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2, 0);
      const cartesianCenter = new Vector3();
      Ellipsoid.WGS84.cartographicToCartesian(cartographicCenter, cartesianCenter);
      return {
        cartographicCenter,
        cartesianCenter,
        zoom: getZoomFromExtent(extent, cartographicCenter, cartesianCenter)
      };
    }

    console.warn('Extent is not defined in the tileset header');
    return {
      cartographicCenter: new Vector3(),
      zoom: 1
    };
  }

  /**
   * Updates content-format flags after tile content loads.
   */
  onTileLoaded(_tileset: Tileset3D, tile: Tile3D): void {
    if (tile.header.isDracoGeometry) {
      this.contentFormats.draco = true;
    }

    switch (tile.header.textureFormat) {
      case 'dds':
        this.contentFormats.dds = true;
        break;
      case 'ktx2':
        this.contentFormats.ktx2 = true;
        break;
      default:
    }
  }

  /**
   * Returns the total number of known tiles when node pages metadata is available.
   */
  getTilesTotalCount(): number | null {
    const metadata = this.getMetadata();
    return metadata.tileset?.nodePagesTile?.nodesInNodePages || null;
  }
}

function isTilesetRequest(input: TilesetSourceInput): input is TilesetSourceRequest {
  return Boolean(
    input && typeof input === 'object' && 'url' in input && 'loader' in input && !('type' in input)
  );
}

/**
 * Normalizes constructor input into a URL request descriptor.
 * @param input Constructor input for {@link I3SSource}.
 * @returns A normalized request with a resolved base path.
 */
function normalizeI3SRequest(input: TilesetSourceInput): TilesetSourceRequest {
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
    coreApi: (input as TilesetSourceRequest).coreApi
  };
}
