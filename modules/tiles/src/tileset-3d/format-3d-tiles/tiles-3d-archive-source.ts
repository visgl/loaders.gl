// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {getZoomFromBoundingVolume} from '../helpers/zoom';
import {Tile3D as Tile3DNode} from '../common/tile-3d';
import type {Tile3D} from '../common/tile-3d';
import {Tileset3DTraverser} from './tileset-3d-traverser';
import type {Tileset3D} from '../common/tileset-3d';
import type {
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  Tileset3DSource,
  TilesetSourceMetadata,
  TilesetSourceViewState
} from '../common/tileset-source';
import type {TilesetTraverser, TilesetTraverserProps} from '../common/tileset-traverser';
import type {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {
  ArchiveSourceData,
  ArchiveFetchState,
  getArchiveSourceUrl,
  openArchiveReadableFile,
  parseArchiveResource,
  resolveArchivePath
} from '../common/archive-source-utils';
import {parseTiles3DArchive, Tiles3DArchive} from '../archives/tiles-3d-archive';
import {TILESET_TYPE} from '../../constants';

const EMPTY_CONTENT_FORMATS: TilesetContentFormats = {
  draco: false,
  meshopt: false,
  dds: false,
  ktx2: false
};

/**
 * {@link Tileset3DSource} implementation for archive-backed 3D Tiles datasets.
 */
export class Tiles3DArchiveSource implements Tileset3DSource, ArchiveFetchState {
  readonly type = TILESET_TYPE.TILES3D;
  readonly loader: LoaderWithParser;
  readonly url: string;
  readonly basePath: string;
  readonly loadOptions: LoaderOptions;
  readonly contentFormats: TilesetContentFormats = {...EMPTY_CONTENT_FORMATS};

  tileset: TilesetJSON | null = null;
  asset?: Record<string, any>;
  properties?: any;
  extras?: any;
  credits?: any;
  metadata?: TilesetSourceMetadata;

  private archiveData: ArchiveSourceData;
  private archive: Tiles3DArchive | null = null;
  private rootTileset: TilesetJSON | null = null;
  private queryParams: Record<string, string> = {};
  private extensionsUsed: string[] = [];

  /**
   * Creates a `.3tz`-backed source.
   * @param data Archive URL or blob.
   * @param loader 3D Tiles loader used for metadata and content parsing.
   * @param loadOptions Loader options forwarded to content parsing.
   */
  constructor(data: ArchiveSourceData, loader: LoaderWithParser, loadOptions: LoaderOptions = {}) {
    this.archiveData = data;
    this.loader = loader;
    this.url = getArchiveSourceUrl(data, 'tileset.3tz');
    this.basePath = this.url;
    this.loadOptions = loadOptions;
  }

  /**
   * Parses archive metadata and initializes root tileset state.
   */
  async initialize(): Promise<void> {
    this.archive = await parseTiles3DArchive(await openArchiveReadableFile(this.archiveData));
    const rootTilesetBuffer = await this.getArchiveFile('tileset.json');
    const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};

    this.rootTileset = await parseArchiveResource(
      rootTilesetBuffer,
      this.loader,
      {
        ...this.loadOptions,
        [this.loader.id]: {
          ...loaderOptions,
          isTileset: true
        }
      },
      this,
      `${this.url}/tileset.json`
    );

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
   * Returns normalized source metadata.
   */
  getMetadata(): TilesetSourceMetadata {
    if (!this.metadata) {
      throw new Error('Tiles3DArchiveSource has not been initialized');
    }
    return this.metadata;
  }

  /**
   * Returns the parsed root tileset.
   */
  async getRootTileset(): Promise<TilesetJSON> {
    return this.getMetadata().tileset;
  }

  /**
   * Creates runtime tile headers for a 3D Tiles subtree.
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
        tile.children.push(childTile);
        childTile.depth = tile.depth + 1;
        stack.push(childTile);
      }
    }

    return rootTile;
  }

  /**
   * Creates the 3D Tiles traverser.
   */
  createTraverser(options: TilesetTraverserProps): TilesetTraverser {
    return new Tileset3DTraverser(options);
  }

  /**
   * Loads binary content or nested tileset JSON from the archive.
   */
  async loadTileContent(tile: Tile3D): Promise<TileContentLoadResult> {
    const contentUrl = this.getTileUrl(tile.contentUrl);
    const content = await this.loadResource(contentUrl, tile.type === 'json');
    tile.content = content;

    return {
      loaded: true,
      nestedTileset: tile.contentUrl.includes('.json') ? content : undefined
    };
  }

  /**
   * Resolves a tile content URL while preserving source-level query parameters.
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
   * Checks whether the source declares a specific extension.
   * @param extensionName Extension name.
   * @returns `true` when the extension is listed in `extensionsUsed`.
   */
  hasExtension(extensionName: string): boolean {
    return this.extensionsUsed.includes(extensionName);
  }

  /**
   * Reads a file directly from the archive.
   * @param archivePath Internal archive path.
   * @returns File contents.
   */
  async getArchiveFile(archivePath: string): Promise<ArrayBuffer> {
    if (!this.archive) {
      throw new Error('Tiles3DArchiveSource has not been initialized');
    }
    return await this.archive.getFile(archivePath);
  }

  private async loadResource(resourceUrl: string, isTileset: boolean): Promise<any> {
    const archivePath = resolveArchivePath(resourceUrl, resourceUrl, this.url);
    const resource = await this.getArchiveFile(archivePath);
    const loaderOptions = (this.loadOptions[this.loader.id] as Record<string, unknown>) || {};

    return await parseArchiveResource(
      resource,
      this.loader,
      {
        ...this.loadOptions,
        [this.loader.id]: {
          ...loaderOptions,
          isTileset,
          assetGltfUpAxis: (this.asset && this.asset.gltfUpAxis) || 'Y'
        }
      },
      this,
      resourceUrl
    );
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
}
