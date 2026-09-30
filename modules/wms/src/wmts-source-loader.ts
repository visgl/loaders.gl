// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageType, ImageLoaderOptions} from '@loaders.gl/images';
import {ImageLoader} from '@loaders.gl/images';
import type {
  CoreAPI,
  DataSourceOptions,
  GetTileDataParameters,
  GetTileParameters,
  SourceLoader,
  TileGrid,
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
import {
  areServiceCRSEquivalent,
  getServiceCRSAxisOrder,
  normalizeServiceCRS,
  type ServiceCRS
} from './crs-utils';

/** Options for a WMTS tile source. */
export type WMTSSourceLoaderOptions = DataSourceOptions &
  ImageLoaderOptions & {
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

  /** In-flight or successful capability request. */
  private _capabilitiesPromise: Promise<WMTSCapabilities | null> | null = null;
  /** Parsed capabilities used by synchronous URL generation. */
  private _capabilities: WMTSCapabilities | null = null;

  /** Creates a WMTS source. */
  constructor(url: string, options: WMTSSourceLoaderOptions = {}, coreApi?: CoreAPI) {
    super(url, options, WMTSSourceLoader.defaultOptions, coreApi);
    this._capabilities = options.wmts?.capabilities || null;
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
    const requestSignal = signal || parameters.signal;
    const response = await this.fetch(
      this.getTileURL(parameters),
      requestSignal ? {signal: requestSignal} : undefined
    );
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
    const format = parameters.format || wmts.format || layer?.formats[0] || 'image/png';
    const style =
      wmts.style ||
      layer?.styles.find(candidate => candidate.isDefault)?.identifier ||
      layer?.styles[0]?.identifier ||
      'default';
    const resourceURL = layer?.resourceURLs.find(
      resource =>
        (!resource.resourceType || resource.resourceType === 'tile') &&
        (!resource.format || resource.format === format)
    );
    const urlTemplate = wmts.urlTemplate || resourceURL?.template;
    const tileMatrixSet = this._getTileMatrixSet(layer);
    const tileMatrixIdentifier = getTileMatrixIdentifier(tileMatrixSet, parameters.z);
    if (urlTemplate) {
      const replacements: Record<string, string> = {
        ...wmts.parameters,
        Layer: wmts.layer || layer?.identifier || '',
        Style: style,
        TileMatrix: tileMatrixIdentifier,
        TileRow: String(parameters.y),
        TileCol: String(parameters.x),
        TileMatrixSet: tileMatrixSet?.identifier || wmts.tileMatrixSet || ''
      };
      return urlTemplate.replace(/\{([^}]+)\}/g, (placeholder, key: string) => {
        if (!(key in replacements)) throw new Error(`Missing WMTS template parameter: ${key}`);
        return encodeURIComponent(replacements[key]);
      });
    }
    const url = new URL(this.url);
    const searchParameters = new URLSearchParams({
      SERVICE: 'WMTS',
      REQUEST: 'GetTile',
      VERSION: '1.0.0',
      LAYER: parameters.layers ? String(parameters.layers) : wmts.layer || layer?.identifier || '',
      STYLE: style,
      TILEMATRIXSET: tileMatrixSet?.identifier || wmts.tileMatrixSet || '',
      TILEMATRIX: tileMatrixIdentifier,
      TILEROW: String(parameters.y),
      TILECOL: String(parameters.x),
      FORMAT: format,
      ...(wmts.parameters || {})
    });
    for (const [key, value] of searchParameters) {
      for (const existingKey of [...url.searchParams.keys()]) {
        if (existingKey.toUpperCase() === key.toUpperCase()) url.searchParams.delete(existingKey);
      }
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /** Loads and caches capabilities; failed requests can be retried. */
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
    try {
      this._capabilities = await this._capabilitiesPromise;
      return this._capabilities;
    } catch (error) {
      this._capabilitiesPromise = null;
      throw error;
    }
  }

  /** Resolves the requested layer and rejects unknown identifiers. */
  private _getLayer(capabilities: WMTSCapabilities | null): WMTSLayer | undefined {
    const layerName = this.options.wmts?.layer;
    const layer = capabilities?.contents.layers.find(
      candidate => !layerName || candidate.identifier === layerName
    );
    if (capabilities && layerName && !layer) throw new Error(`Unknown WMTS layer: ${layerName}`);
    return layer;
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
      const selected = candidates.find(candidate => candidate.identifier === wmts.tileMatrixSet);
      if (capabilities && !selected)
        throw new Error(`WMTS matrix set is not linked to layer: ${wmts.tileMatrixSet}`);
      if (
        selected &&
        requestedCRS !== undefined &&
        !areServiceCRSEquivalent(requestedCRS, selected.supportedCRS)
      ) {
        throw new Error(`WMTS matrix set does not support ${requestedCRS}`);
      }
      return selected;
    }
    if (requestedCRS !== undefined && capabilities) {
      const selected = candidates.find(candidate =>
        areServiceCRSEquivalent(requestedCRS, candidate.supportedCRS)
      );
      if (!selected) throw new Error(`No linked WMTS matrix set supports ${requestedCRS}`);
      return selected;
    }
    if (candidates.length) return candidates[0];
    return undefined;
  }
}

/** Converts a WMTS matrix set into the shared tile-grid metadata shape. */
function toTileGrid(tileMatrixSet: WMTSTileMatrixSet | undefined): TileGrid | undefined {
  if (!tileMatrixSet) return undefined;
  const firstMatrix = tileMatrixSet.matrices[0];
  return {
    crs: tileMatrixSet.supportedCRS,
    tileSize: firstMatrix?.tileWidth
      ? [firstMatrix.tileWidth, firstMatrix.tileHeight || firstMatrix.tileWidth]
      : undefined,
    origin:
      firstMatrix?.topLeftCorner && getServiceCRSAxisOrder(tileMatrixSet.supportedCRS) === 'yx'
        ? [firstMatrix.topLeftCorner[1], firstMatrix.topLeftCorner[0]]
        : firstMatrix?.topLeftCorner,
    ...getGridResolutions(tileMatrixSet),
    matrixIds: tileMatrixSet.matrices.map(matrix => matrix.identifier),
    matrixSizes: tileMatrixSet.matrices.every(
      matrix => matrix.matrixWidth !== undefined && matrix.matrixHeight !== undefined
    )
      ? tileMatrixSet.matrices.map(matrix => [matrix.matrixWidth!, matrix.matrixHeight!])
      : undefined
  };
}

/** Converts OGC scale denominators using a 0.28 mm pixel for known CRS units. */
function getGridResolutions(tileMatrixSet: WMTSTileMatrixSet): Pick<TileGrid, 'resolutions'> {
  const crs = normalizeServiceCRS(tileMatrixSet.supportedCRS);
  const metersPerUnit =
    crs === 'EPSG:4326' || crs === 'CRS:84'
      ? (2 * Math.PI * 6378137) / 360
      : areServiceCRSEquivalent(crs, 'EPSG:3857')
        ? 1
        : undefined;
  if (
    !metersPerUnit ||
    !tileMatrixSet.matrices.every(
      matrix => Number.isFinite(matrix.scaleDenominator) && matrix.scaleDenominator! > 0
    )
  )
    return {};
  return {
    resolutions: tileMatrixSet.matrices.map(
      matrix => (matrix.scaleDenominator! * 0.00028) / metersPerUnit
    )
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
