// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Vector3} from '@math.gl/core';
import {Ellipsoid} from '@math.gl/geospatial';
import {Tile3D as Tile3DNode} from '../common/tile-3d';
import type {Tile3D} from '../common/tile-3d';
import {I3STilesetTraverser} from './i3s-tileset-traverser';
import type {Tileset3D} from '../common/tileset-3d';
import type {FrameState} from '../helpers/frame-state';
import type {
  TileContentLoadResult,
  TilesetContentFormats,
  TilesetJSON,
  Tileset3DSource,
  TilesetSourceMetadata,
  TilesetSourceViewState
} from '../common/tileset-source';
import {getZoomFromExtent, getZoomFromFullExtent} from '../helpers/zoom';
import {TILESET_TYPE} from '../../constants';
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
import {parseSLPKArchive, SLPKArchive} from '../archives/slpk-archive';

const EMPTY_CONTENT_FORMATS: TilesetContentFormats = {
  draco: false,
  meshopt: false,
  dds: false,
  ktx2: false
};

/**
 * {@link Tileset3DSource} implementation for archive-backed I3S datasets.
 */
export class I3SArchiveSource implements Tileset3DSource, ArchiveFetchState {
  readonly type = TILESET_TYPE.I3S;
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
  private archive: SLPKArchive | null = null;
  private rootTileset: TilesetJSON | null = null;

  /**
   * Creates an `.slpk`-backed source.
   * @param data Archive URL or blob.
   * @param loader I3S loader used for metadata and content parsing.
   * @param loadOptions Loader options forwarded to content parsing.
   */
  constructor(data: ArchiveSourceData, loader: LoaderWithParser, loadOptions: LoaderOptions = {}) {
    this.archiveData = data;
    this.loader = loader;
    this.url = getArchiveSourceUrl(data, 'tileset.slpk');
    this.basePath = this.url;
    this.loadOptions = loadOptions;
  }

  /**
   * Parses archive metadata and initializes the I3S root layer.
   */
  async initialize(): Promise<void> {
    this.archive = await parseSLPKArchive(await openArchiveReadableFile(this.archiveData));
    const rootTilesetBuffer = await this.getArchiveFile('', 'http');
    const i3sLoaderOptions =
      this.loadOptions.i3s && typeof this.loadOptions.i3s === 'object'
        ? (this.loadOptions.i3s as Record<string, unknown>)
        : {};

    this.rootTileset = await parseArchiveResource(
      rootTilesetBuffer,
      this.loader,
      {
        ...this.loadOptions,
        i3s: {
          ...i3sLoaderOptions,
          isTileset: true,
          isTileHeader: false
        }
      },
      this,
      this.url
    );
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
      refine: this.rootTileset.root?.refine
    };
  }

  /**
   * Returns normalized source metadata.
   */
  getMetadata(): TilesetSourceMetadata {
    if (!this.metadata) {
      throw new Error('I3SArchiveSource has not been initialized');
    }
    return this.metadata;
  }

  /**
   * Returns the parsed root I3S layer.
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
    const archivePath = resolveArchivePath(contentUrl, contentUrl, this.url);
    const tileBuffer = await this.getArchiveFile(archivePath);
    const loaderId = this.loader.id;
    const loaderOptions = (this.loadOptions[loaderId] as Record<string, unknown>) || {};
    const metadata = this.getMetadata();

    tile.content = await parseArchiveResource(
      tileBuffer,
      this.loader,
      {
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
      },
      this,
      contentUrl
    );

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
    const nodeBuffer = await this.getArchiveFile(`nodes/${childId}`, 'http');
    const i3sLoaderOptions =
      this.loadOptions.i3s && typeof this.loadOptions.i3s === 'object'
        ? (this.loadOptions.i3s as Record<string, unknown>)
        : {};

    return await parseArchiveResource(
      nodeBuffer,
      this.loader,
      {
        ...this.loadOptions,
        i3s: {
          ...i3sLoaderOptions,
          isTileHeader: true
        }
      },
      this,
      nodeUrl
    );
  }

  /**
   * Returns internal resource URLs unchanged for archive-backed datasets.
   */
  getTileUrl(tilePath: string): string {
    return tilePath;
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

    return {};
  }

  /**
   * Reads a file directly from the archive.
   * @param archivePath Internal archive path.
   * @param mode Access mode.
   * @returns File contents.
   */
  async getArchiveFile(archivePath: string, mode: 'http' | 'raw' = 'http'): Promise<ArrayBuffer> {
    if (!this.archive) {
      throw new Error('I3SArchiveSource has not been initialized');
    }
    return await this.archive.getFile(archivePath, mode);
  }
}
