// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  CoreAPI,
  DataSourceOptions,
  GetTileDataParameters,
  GetTileParameters,
  SourceLoader,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import type {
  WMTSCapabilities,
  WMTSTileMatrixSet,
  WMTSLayer
} from './lib/parsers/wmts/parse-wmts-capabilities';
import {parseWMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';
import {selectServiceCRS, type ServiceCRS} from './crs-utils';

/** Options for a WMTS tile source. */
export type WMTSSourceLoaderOptions = DataSourceOptions & {
  wmts?: {
    /** WMTS layer identifier. */
    layer?: string;
    /** WMTS tile matrix set identifier. */
    tileMatrixSet?: string;
    /** WMTS style identifier. */
    style?: string;
    /** Tile MIME type. */
    format?: string;
    /** REST template containing `{TileMatrix}`, `{TileRow}`, and `{TileCol}`. */
    urlTemplate?: string;
    /** Additional KVP parameters. */
    parameters?: Record<string, string>;
    /** Capabilities document or URL used to derive layer and tile matrix options. */
    capabilities?: WMTSCapabilities;
    capabilitiesUrl?: string;
    /** Preferred coordinate reference system for matrix-set selection. */
    crs?: ServiceCRS;
  };
};

/** A WMTS source that fetches image tiles through REST or KVP requests. */
export class WMTSImageTileSource
  extends DataSource<string, WMTSSourceLoaderOptions>
  implements TileSource
{
  /** MIME type rendered by the generic deck.gl tile adapter. */
  readonly mimeType = 'image/png';

  private _capabilitiesPromise: Promise<WMTSCapabilities | null> | null = null;
  private _capabilities: WMTSCapabilities | null = null;

  /** Creates a WMTS source. */
  constructor(url: string, options: WMTSSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url, options, WMTSSourceLoader.defaultOptions, coreApi);
    this.getTileData = this.getTileData.bind(this);
  }

  /** Returns metadata available from source options. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const capabilities = await this._loadCapabilities();
    const layer = this._getLayer(capabilities);
    const wmts = this.options.wmts || {};
    return {
      format: wmts.format || layer?.formats[0] || 'image/png',
      name: wmts.layer || layer?.identifier || '',
      title: layer?.title,
      abstract: layer?.abstract || capabilities?.serviceIdentification?.abstract,
      boundingBox: layer?.bounds
        ? [
            [layer.bounds[0], layer.bounds[1]],
            [layer.bounds[2], layer.bounds[3]]
          ]
        : undefined,
      layer: {name: wmts.layer || layer?.identifier || '', layers: []},
      tileGrid: toTileGrid(this._getTileMatrixSet(layer))
    };
  }

  /** Fetches and decodes one WMTS image tile. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ImageType | null> {
    await this._loadCapabilities();
    const response = await this.fetch(this.getTileURL(parameters), signal ? {signal} : undefined);
    if (!response.ok) {
      throw new Error(`WMTS tile request failed: ${response.status} ${response.statusText}`);
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

  /** Builds a REST-template or KVP WMTS GetTile URL. */
  getTileURL(parameters: GetTileParameters): string {
    const wmts = this.options.wmts || {};
    const layer = this._getLayer(this._capabilities);
    const resourceURL = layer?.resourceURLs.find(resource =>
      resource.format ? resource.format === (parameters.format || wmts.format) : true
    );
    const urlTemplate = wmts.urlTemplate || resourceURL?.template;
    const tileMatrixSet = this._getTileMatrixSet(layer);
    const tileMatrixIdentifier = getTileMatrixIdentifier(tileMatrixSet, parameters.z);
    if (urlTemplate) {
      return urlTemplate
        .replaceAll('{TileMatrix}', tileMatrixIdentifier)
        .replaceAll('{TileRow}', String(parameters.y))
        .replaceAll('{TileCol}', String(parameters.x))
        .replaceAll('{TileMatrixSet}', tileMatrixSet?.identifier || wmts.tileMatrixSet || '');
    }
    const url = new URL(this.url);
    const searchParameters = new URLSearchParams({
      SERVICE: 'WMTS',
      REQUEST: 'GetTile',
      VERSION: '1.0.0',
      LAYER: parameters.layers ? String(parameters.layers) : wmts.layer || layer?.identifier || '',
      STYLE: wmts.style || 'default',
      TILEMATRIXSET: tileMatrixSet?.identifier || wmts.tileMatrixSet || '',
      TILEMATRIX: tileMatrixIdentifier,
      TILEROW: String(parameters.y),
      TILECOL: String(parameters.x),
      FORMAT: parameters.format || wmts.format || 'image/png',
      ...(wmts.parameters || {})
    });
    for (const [key, value] of searchParameters) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  private async _loadCapabilities(): Promise<WMTSCapabilities | null> {
    if (this._capabilitiesPromise) return this._capabilitiesPromise;
    const configuredCapabilities = this.options.wmts?.capabilities;
    const capabilitiesUrl = this.options.wmts?.capabilitiesUrl;
    this._capabilitiesPromise = configuredCapabilities
      ? Promise.resolve(configuredCapabilities)
      : capabilitiesUrl
        ? this.fetch(capabilitiesUrl).then(async response => {
            if (!response.ok)
              throw new Error(`WMTS capabilities request failed: ${response.status}`);
            return parseWMTSCapabilities(await response.text());
          })
        : Promise.resolve(null);
    this._capabilities = await this._capabilitiesPromise;
    return this._capabilities;
  }

  private _getLayer(capabilities: WMTSCapabilities | null): WMTSLayer | undefined {
    const layerName = this.options.wmts?.layer;
    return capabilities?.contents.layers.find(
      layer => !layerName || layer.identifier === layerName
    );
  }

  /** Selects a linked tile matrix set using an explicit identifier or compatible CRS. */
  private _getTileMatrixSet(layer: WMTSLayer | undefined) {
    const capabilities = this._capabilities;
    const wmts = this.options.wmts || {};
    const linkedIdentifiers = layer?.tileMatrixSetLinks.map(link => link.tileMatrixSet) || [];
    const candidates =
      capabilities?.contents.tileMatrixSets.filter(tileMatrixSet =>
        linkedIdentifiers.includes(tileMatrixSet.identifier)
      ) || [];
    const requestedCRS = wmts.crs;
    if (wmts.tileMatrixSet) {
      return capabilities?.contents.tileMatrixSets.find(
        tileMatrixSet => tileMatrixSet.identifier === wmts.tileMatrixSet
      );
    }
    if (candidates.length) {
      const selectedCRS = selectServiceCRS(
        requestedCRS,
        candidates.map(tileMatrixSet => tileMatrixSet.supportedCRS || '')
      );
      return (
        candidates.find(tileMatrixSet => tileMatrixSet.supportedCRS === selectedCRS) ||
        candidates[0]
      );
    }
    return undefined;
  }
}

/** Converts a WMTS matrix set into the shared tile-grid metadata shape. */
function toTileGrid(tileMatrixSet: WMTSTileMatrixSet | undefined) {
  if (!tileMatrixSet) return undefined;
  const firstMatrix = tileMatrixSet.matrices[0];
  return {
    crs: tileMatrixSet.supportedCRS,
    tileSize: firstMatrix?.tileWidth
      ? [firstMatrix.tileWidth, firstMatrix.tileHeight || firstMatrix.tileWidth]
      : undefined,
    origin: firstMatrix?.topLeftCorner,
    matrixIds: tileMatrixSet.matrices.map(matrix => matrix.identifier),
    matrixSizes: tileMatrixSet.matrices
      .filter(matrix => matrix.matrixWidth !== undefined && matrix.matrixHeight !== undefined)
      .map(matrix => [matrix.matrixWidth!, matrix.matrixHeight!])
  };
}

/** Selects the advertised WMTS matrix identifier for a deck.gl zoom level. */
function getTileMatrixIdentifier(
  tileMatrixSet: WMTSTileMatrixSet | undefined,
  zoom: number
): string {
  const matrices = tileMatrixSet?.matrices || [];
  const exactMatrix = matrices.find(matrix => matrix.identifier === String(zoom));
  if (exactMatrix) {
    return exactMatrix.identifier;
  }

  const matrixIndex = Math.max(0, Math.min(matrices.length - 1, Math.round(zoom)));
  return matrices[matrixIndex]?.identifier || String(zoom);
}

/** Source loader for WMTS image tiles. */
export const WMTSSourceLoader = {
  dataType: null as unknown as WMTSImageTileSource,
  batchType: null as never,
  name: 'Web Map Tile Service (OGC WMTS)',
  id: 'wmts',
  module: 'wms',
  version: '0.0.0',
  extensions: [],
  mimeTypes: [],
  type: 'wmts',
  fromUrl: true,
  fromBlob: false,
  options: {wmts: {}},
  defaultOptions: {wmts: {}},
  testURL: (url: string): boolean => /wmts|GetTile/i.test(url),
  createDataSource: (url: string, options: WMTSSourceLoaderOptions = {}, coreApi?: CoreAPI) =>
    new WMTSImageTileSource(url, options, coreApi)
} as const satisfies SourceLoader<WMTSImageTileSource>;
