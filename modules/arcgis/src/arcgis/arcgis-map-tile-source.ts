// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS} from './arcgis-map-tile-source-options';
import type {
  ArcGISMapTileSourceLoaderOptions,
  ArcGISMapServerMetadata,
  ArcGISMapTileParameters
} from './arcgis-map-tile-source-options';
import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  CoreAPI,
  GetTileDataParameters,
  GetTileParameters,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

/** ArcGIS MapServer source for cached `/tile/{z}/{y}/{x}` image tiles. */
export class ArcGISMapTileSource
  extends DataSource<string, ArcGISMapTileSourceLoaderOptions>
  implements TileSource
{
  /** MIME type rendered by the generic deck.gl tile adapter. */
  readonly mimeType = 'image/png';

  /** Cached service metadata. */
  private _metadata: ArcGISMapServerMetadata | null = null;
  /** In-flight metadata request shared by concurrent callers. */
  private _metadataPromise: Promise<ArcGISMapServerMetadata> | null = null;
  /** Parameters applied to subsequent dynamic exports. */
  private _runtimeParameters: ArcGISMapTileParameters = {};

  /** Creates an ArcGIS MapServer tile source. */
  constructor(url: string, options: ArcGISMapTileSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/$/, ''), options, ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS, coreApi);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Loads and normalizes ArcGIS service metadata. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const metadata = await this._getMetadata();
    const extent = metadata.fullExtent;
    const spatialReference = metadata.spatialReference || extent?.spatialReference;
    const spatialReferenceWkid = (spatialReference as {wkid?: number} | undefined)?.wkid;
    return {
      name: metadata.name || '',
      title: metadata.name || '',
      abstract: metadata.description || metadata.serviceDescription || '',
      attributions: metadata.copyrightText ? [metadata.copyrightText] : undefined,
      minZoom: 0,
      maxZoom: metadata.tileInfo?.lods?.length
        ? Math.max(...metadata.tileInfo.lods.map(lod => lod.level))
        : undefined,
      boundingBox: extent
        ? [
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymax]
          ]
        : undefined,
      layer: {
        name: metadata.name || '',
        srs: spatialReferenceWkid ? [`EPSG:${spatialReferenceWkid}`] : [],
        layers: []
      },
      tileGrid: metadata.tileInfo
        ? {
            crs: (metadata.tileInfo.spatialReference as {wkid?: number} | undefined)?.wkid
              ? `EPSG:${(metadata.tileInfo.spatialReference as {wkid: number}).wkid}`
              : undefined,
            tileSize:
              metadata.tileInfo.rows && metadata.tileInfo.cols
                ? [metadata.tileInfo.cols, metadata.tileInfo.rows]
                : undefined,
            origin: metadata.tileInfo.origin
              ? [metadata.tileInfo.origin.x, metadata.tileInfo.origin.y]
              : undefined,
            matrixIds: metadata.tileInfo.lods?.map(lod => String(lod.level))
          }
        : undefined
    };
  }

  /** Fetches and decodes one cached ArcGIS tile. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ImageType | null> {
    const options = this.options['arcgis-map-server'] || {};
    const mode = options.mode || 'auto';
    const metadata = mode === 'auto' ? await this._getMetadata() : null;
    const useCachedTiles = mode === 'cached' || (mode === 'auto' && isCompatibleCache(metadata));
    const tileURL = useCachedTiles
      ? this.getTileURL(parameters)
      : this.getExportTileURL(parameters, options.tileSize || 256);
    const response = await this.fetch(tileURL, signal ? {signal} : undefined);
    if (!response.ok) {
      throw new Error(
        `ArcGIS MapServer tile request failed: ${response.status} ${response.statusText}`
      );
    }
    return (await this.coreApi.parse(
      await response.arrayBuffer(),
      ImageLoader,
      this.loadOptions
    )) as ImageType;
  }

  /** Fetches a tile using the deck.gl-compatible request shape. */
  async getTileData(parameters: GetTileDataParameters): Promise<ImageType | null> {
    return this.getTile(parameters.index, parameters.signal);
  }

  /** Builds the standard ArcGIS cached tile URL. */
  getTileURL(parameters: GetTileParameters): string {
    const template = this.options['arcgis-map-server']?.urlTemplate;
    if (template) {
      const templateURL = new URL(
        template
          .replaceAll('{z}', String(parameters.z))
          .replaceAll('{y}', String(parameters.y))
          .replaceAll('{x}', String(parameters.x))
      );
      return templateURL.toString();
    }
    const url = new URL(this.getServiceURL(parameters));
    url.pathname = `${url.pathname.replace(/\/$/, '')}/tile/${parameters.z}/${parameters.y}/${parameters.x}`;
    return url.toString();
  }

  /** Updates parameters applied to subsequent dynamic MapServer export requests. */
  updateParameters(parameters: ArcGISMapTileParameters): void {
    this._runtimeParameters = {...this._runtimeParameters, ...parameters};
  }

  /** Builds a dynamic MapServer `export` request for one web-mercator tile. */
  getExportTileURL(parameters: GetTileParameters, tileSize?: number): string {
    const options = this.options['arcgis-map-server'] || {};
    const resolvedTileSize = tileSize || options.tileSize || 256;
    const [west, south, east, north] = getWebMercatorTileBounds(parameters);
    const url = new URL(this.getServiceURL(parameters));
    url.pathname = `${url.pathname.replace(/\/$/, '')}/export`;
    const searchParameters: ArcGISMapTileParameters = {
      f: 'image',
      bbox: `${west},${south},${east},${north}`,
      bboxSR: 3857,
      imageSR: 3857,
      size: `${resolvedTileSize},${resolvedTileSize}`,
      format: 'png32',
      transparent: true,
      ...options.exportParameters,
      ...this._runtimeParameters
    };
    for (const [key, value] of Object.entries(searchParameters)) {
      url.searchParams.set(key, String(value));
    }
    return url.toString();
  }

  /** Fetches the MapServer metadata document and applies configured parameters. */
  private async _loadMetadata(): Promise<ArcGISMapServerMetadata> {
    const configuredMetadata = this.options['arcgis-map-server']?.metadata;
    if (configuredMetadata) return configuredMetadata;
    const url = new URL(this.url);
    url.searchParams.set('f', 'pjson');
    for (const [key, value] of Object.entries(
      this.options['arcgis-map-server']?.parameters || {}
    )) {
      url.searchParams.set(key, value);
    }
    const response = await this.fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `ArcGIS MapServer metadata request failed: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  }

  /** Returns cached metadata and shares a single request among concurrent callers. */
  private async _getMetadata(): Promise<ArcGISMapServerMetadata> {
    if (this._metadata) return this._metadata;
    if (!this._metadataPromise) {
      this._metadataPromise = this._loadMetadata();
    }
    try {
      const metadata = await this._metadataPromise;
      this._metadata = metadata;
      return metadata;
    } finally {
      this._metadataPromise = null;
    }
  }

  /** Selects a service endpoint for a tile using a stable URL-pool mapping. */
  private getServiceURL(parameters: GetTileParameters): string {
    const urls = this.options['arcgis-map-server']?.urls;
    return urls?.length ? urls[(parameters.x + parameters.y) % urls.length] : this.url;
  }
}

function isCompatibleCache(metadata: ArcGISMapServerMetadata | null): boolean {
  const tileInfo = metadata?.tileInfo;
  if (!tileInfo || tileInfo.rows !== 256 || tileInfo.cols !== 256) return false;
  const spatialReference = tileInfo.spatialReference || metadata?.spatialReference;
  const wkid = (spatialReference as {wkid?: number; latestWkid?: number} | undefined)?.wkid;
  if (wkid !== 3857 && wkid !== 102100 && wkid !== 102113) return false;
  const origin = tileInfo.origin;
  return (
    !origin ||
    (Math.abs(origin.x + 20037508.342789244) < 1 && Math.abs(origin.y - 20037508.342789244) < 1)
  );
}

/** Calculates the Web Mercator extent represented by an XYZ tile. */
function getWebMercatorTileBounds(parameters: GetTileParameters): [number, number, number, number] {
  const worldSize = 20037508.342789244;
  const tileCount = 2 ** parameters.z;
  const tileSize = (worldSize * 2) / tileCount;
  const west = -worldSize + parameters.x * tileSize;
  const east = west + tileSize;
  const north = worldSize - parameters.y * tileSize;
  const south = north - tileSize;
  return [west, south, east, north];
}
