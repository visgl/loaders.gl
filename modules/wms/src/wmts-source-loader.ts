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
import type {WMTSCapabilities, WMTSLayer} from './lib/parsers/wmts/parse-wmts-capabilities';
import {parseWMTSCapabilities} from './lib/parsers/wmts/parse-wmts-capabilities';

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
      layer: {name: wmts.layer || layer?.identifier || '', layers: []}
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
    if (urlTemplate) {
      return urlTemplate
        .replaceAll('{TileMatrix}', String(parameters.z))
        .replaceAll('{TileRow}', String(parameters.y))
        .replaceAll('{TileCol}', String(parameters.x))
        .replaceAll('{TileMatrixSet}', wmts.tileMatrixSet || '');
    }
    const url = new URL(this.url);
    const searchParameters = new URLSearchParams({
      SERVICE: 'WMTS',
      REQUEST: 'GetTile',
      VERSION: '1.0.0',
      LAYER: parameters.layers ? String(parameters.layers) : wmts.layer || layer?.identifier || '',
      STYLE: wmts.style || 'default',
      TILEMATRIXSET: wmts.tileMatrixSet || layer?.tileMatrixSetLinks[0]?.tileMatrixSet || '',
      TILEMATRIX: String(parameters.z),
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
