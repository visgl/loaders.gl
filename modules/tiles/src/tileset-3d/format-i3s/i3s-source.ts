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
  TilesetSourceResolver,
  TilesetSourceViewState
} from '../common/tileset-source';
import {getZoomFromExtent, getZoomFromFullExtent} from '../helpers/zoom';
import {TILESET_TYPE} from '../../constants';
import type {TilesetTraverser, TilesetTraverserProps} from '../common/tileset-traverser';
import {getI3SSpatialReference} from '../../spatial/format-spatial-reference';
import {I3SSpatialTransformer} from '../../spatial/i3s-spatial-transformer';

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
  private readonly resolver?: TilesetSourceResolver;
  private rootTileset: TilesetJSON;
  /** Spatial adapter created lazily after Tileset3D applies target options. */
  private spatialTransformer?: I3SSpatialTransformer;
  /** Root header prepared after asynchronous elevation sampling. */
  private preparedRootHeader?: any;

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
    this.resolver = request.resolver;
    this.coreApi = request.coreApi;
    this.loadOptions = loadOptions;
    this.initializeQueryParams(loadOptions);
  }

  /**
   * Fetches and normalizes root I3S metadata for runtime consumption.
   */
  async initialize(): Promise<void> {
    if (!this.rootTileset) {
      this.rootTileset = await this.loadRootData(this.getTileUrl(this.url), this.loadOptions);
    }
    this.tileset = this.rootTileset;

    if (this.rootTileset.root && typeof this.rootTileset.root.then === 'function') {
      this.rootTileset.root = await this.rootTileset.root;
    }

    this.metadata = {
      type: this.type,
      loader: this.loader,
      url: this.url,
      basePath: this.basePath,
      tileset: this.rootTileset,
      lodMetricType: this.rootTileset.lodMetricType,
      lodMetricValue: this.rootTileset.lodMetricValue,
      refine: this.rootTileset.root?.refine,
      spatialReference: getI3SSpatialReference(this.rootTileset)
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

  /** Prepare option-dependent spatial state and the asynchronously placed root bound. */
  async prepareTileset(tileset: Tileset3D): Promise<void> {
    const spatialReference = tileset.spatialReference;
    if (spatialReference.status === 'unresolved') {
      throw new Error(
        spatialReference.warnings[0] ||
          'I3S spatial operations cannot be resolved from the supplied metadata and options'
      );
    }
    if (spatialReference.status !== 'transformable' && spatialReference.status !== 'transformed') {
      return;
    }
    this.spatialTransformer ||= new I3SSpatialTransformer(
      spatialReference,
      tileset.options.spatial
    );
    tileset.spatialReference = this.spatialTransformer.spatialReference;
    this.preparedRootHeader = await this.transformTileHeader(this.getMetadata().tileset.root);
  }

  /**
   * Creates the runtime root tile for an I3S subtree.
   */
  initializeTileHeaders(
    tileset: Tileset3D,
    tilesetJson: TilesetJSON,
    parentTile?: Tile3D | null
  ): Tile3D {
    const rootHeader = parentTile ? tilesetJson.root : this.preparedRootHeader || tilesetJson.root;
    if (this.spatialTransformer && !this.preparedRootHeader) {
      throw new Error('I3S spatial root header was not prepared before tile initialization');
    }
    const rootTile = new Tile3DNode(tileset, rootHeader, parentTile || undefined);
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
          textureUrls: tile.header.textureUrls,
          textureFormat: tile.header.textureFormat,
          textureLoaderOptions: tile.header.textureLoaderOptions,
          materialDefinition: tile.header.materialDefinition,
          isDracoGeometry: tile.header.isDracoGeometry,
          mbs: tile.header.mbs
        },
        _tilesetOptions: {
          store: metadata.tileset.store,
          attributeStorageInfo: metadata.tileset.attributeStorageInfo,
          fields: metadata.tileset.fields,
          spatialReference: tile.tileset.spatialReference,
          spatialOptions: tile.tileset.options.spatial
        },
        isTileHeader: false
      }
    };

    tile.content = await this.loadResourceData(contentUrl, options);
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
      const header = await metadata.tileset.nodePagesTile.formTileFromNodePages(childId);
      return await this.transformTileHeader(header);
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

    const header = await this.loadResourceData(nodeUrl, options);
    return await this.transformTileHeader(header);
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

    const queryDelimiterIndex = tilePath.indexOf('?');
    if (queryDelimiterIndex === -1) {
      return `${tilePath}?${new URLSearchParams(this.queryParams).toString()}`;
    }

    const existingQuery = tilePath.slice(queryDelimiterIndex + 1);
    const existingQueryKeys = new Set(
      existingQuery.split('&').map(parameter => parameter.split('=', 1)[0])
    );
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(this.queryParams)) {
      if (!existingQueryKeys.has(key)) {
        queryParams.set(key, value);
      }
    }

    const queryString = queryParams.toString();
    return queryString ? `${tilePath}${existingQuery ? '&' : ''}${queryString}` : tilePath;
  }

  /**
   * Derives the default view state from full extent or store extent metadata.
   */
  getViewState(rootTile: Tile3D | null): TilesetSourceViewState {
    if (this.spatialTransformer && rootTile) {
      const center = new Vector3(rootTile.boundingVolume.center);
      const cartographicCenter = new Vector3(rootTile.header.i3sLodMbs.slice(0, 3));
      if (this.spatialTransformer.targetCoordinateFrame === 'geographic') {
        return {
          boundingVolume: rootTile.boundingVolume,
          cartographicCenter,
          cartesianCenter: center,
          zoom: 1
        };
      }
      return {
        boundingVolume: rootTile.boundingVolume,
        cartographicCenter,
        cartesianCenter: center,
        zoom: 1
      };
    }
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
   * Loads data through an injected resolver when present, otherwise through the injected core API.
   */
  private async loadRootData(url: string, options: LoaderOptions): Promise<any> {
    if (this.resolver) {
      return await this.resolver.loadRoot(url, this.loader, options);
    }

    return await this.loadWithCoreApi(url, options);
  }

  /**
   * Initializes query parameters before any URL-backed resource is requested.
   * @param loadOptions Loader options that may contain an ArcGIS token.
   */
  private initializeQueryParams(loadOptions: LoaderOptions): void {
    const i3sOptions = loadOptions.i3s;
    if (i3sOptions && typeof i3sOptions === 'object' && 'token' in i3sOptions) {
      const token = (i3sOptions as Record<string, unknown>).token;
      if (typeof token === 'string') {
        this.queryParams.token = token;
      }
    }
  }

  /**
   * Loads tile metadata or content through an injected resolver when present, otherwise through the injected core API.
   */
  private async loadResourceData(url: string, options: LoaderOptions): Promise<any> {
    if (this.resolver) {
      return await this.resolver.loadResource(url, this.loader, options);
    }

    return await this.loadWithCoreApi(url, options);
  }

  /** Transform one I3S header bound after target options and elevation providers are available. */
  private async transformTileHeader(header: any): Promise<any> {
    if (!this.spatialTransformer) {
      return header;
    }
    const sourceBounds = {
      mbs: header.mbs,
      obb: header.obb,
      normalReferenceFrame: this.getMetadata().tileset.store?.normalReferenceFrame
    };
    const transformedBounds = await this.spatialTransformer.transformBoundsAsync(sourceBounds);
    return {
      ...header,
      // Tileset3D traversal and culling operate in WGS84 ECEF independently of content output.
      boundingVolume: transformedBounds.boundingVolume,
      // Preserve the renderer/output-frame bound for applications and content coordination.
      spatialBoundingVolume: transformedBounds.spatialBoundingVolume,
      i3sLodMbs: transformedBounds.i3sLodMbs
    };
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
    resolver: (input as TilesetSourceRequest).resolver,
    coreApi: (input as TilesetSourceRequest).coreApi
  };
}
