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
  TileGridMatrix,
  TileSource,
  TileSourceMetadata
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {parseXMLTextSync} from './lib/parsers/xml/parse-xml-text';
import type {
  WMTSCapabilities,
  WMTSTileMatrixSet,
  WMTSTileMatrix,
  WMTSLayer
} from './lib/parsers/wmts/parse-wmts-capabilities';
import {
  parseWMTSCapabilities,
  validateTileMatrixLimits
} from './lib/parsers/wmts/parse-wmts-capabilities';
import {areServiceCRSEquivalent, getServiceCRSAxisOrder, type ServiceCRS} from './crs-utils';
import {
  createTileGrid,
  createTileGridMatrix,
  getMetersPerUnit,
  getScaleDenominatorResolution,
  validateMetersPerUnit
} from './lib/tile-grid';

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
      /** Feature-info MIME type; defaults to the first advertised format. */
      infoFormat?: string;
      /** Explicit KVP feature-info endpoint, overriding advertised operation metadata. */
      featureInfoUrl?: string;
      /** REST feature-info template containing tile coordinates and pixel placeholders {I}/{J}. */
      featureInfoUrlTemplate?: string;
      /** Dimension overrides and extra parameters. Generated request fields take precedence. */
      parameters?: Record<string, string>;
      /** Capabilities document or URL used to derive layer and tile matrix options. */
      capabilities?: WMTSCapabilities;
      /** URL used to load capabilities before async tile requests. */
      capabilitiesUrl?: string;
      /** Preferred coordinate reference system for matrix-set selection. */
      crs?: ServiceCRS;
      /**
       * Length of one CRS unit in meters, used to convert scale denominators to resolutions for
       * CRSs whose unit is not built in, such as UTM (`1`). EPSG:4326, CRS:84 and Web Mercator
       * always use their own units, whichever matrix set is selected.
       */
      metersPerUnit?: number | null;
    };
  };

/** Tile and zero-based pixel coordinates for a WMTS GetFeatureInfo query. */
export type WMTSGetFeatureInfoParameters = GetTileParameters & {
  /** Pixel column within the tile (OGC I), independent of screen coordinates. */
  pixelColumn: number;
  /** Pixel row within the tile (OGC J), independent of screen coordinates. */
  pixelRow: number;
  /** Per-request feature-info MIME type, overriding the configured or advertised default. */
  infoFormat?: string;
};

/** A WMTS source that fetches image tiles and feature information through REST or KVP requests. */
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
    validateMetersPerUnit(options.wmts?.metersPerUnit, 'WMTS');
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
      tileGrid: toTileGrid(this._getTileMatrixSet(layer), wmts.metersPerUnit)
    };
  }

  /** Fetches and decodes one tile; returns null outside advertised coverage without a tile fetch. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ImageType | null> {
    validateTileIndices(parameters);
    await this._loadCapabilities();
    if (!this.isTileAvailable(parameters)) return null;
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

  /**
   * Tests the selected layer's advertised tile coverage, not the existence of a tile on the server.
   * Await getMetadata() first when capabilities are supplied by URL. Invalid indices throw.
   * Missing limits use full matrix dimensions; no capabilities means coverage is unknown/allowed.
   */
  isTileAvailable(parameters: GetTileParameters): boolean {
    validateTileIndices(parameters);
    const layerName = parameters.layers ? String(parameters.layers) : this.options.wmts?.layer;
    const layer = this._getLayer(this._capabilities, layerName);
    const tileMatrixSet = this._getTileMatrixSet(layer);
    if (!tileMatrixSet) return true;
    const matrix = getTileMatrix(tileMatrixSet, parameters.z);
    if (!matrix) return false;
    for (const size of [matrix.matrixWidth, matrix.matrixHeight]) {
      if (size !== undefined && (!Number.isSafeInteger(size) || size < 1))
        throw new Error('WMTS matrix dimensions require positive safe integers');
    }
    const limits = layer?.tileMatrixSetLinks.find(
      link => link.tileMatrixSet === tileMatrixSet.identifier
    )?.limits;
    if (limits !== undefined) {
      validateTileMatrixLimits(limits);
      const limit = limits.find(candidate => candidate.tileMatrix === matrix.identifier);
      if (!limit) return false;
      if (
        (matrix.matrixWidth !== undefined && limit.maximumTileColumn >= matrix.matrixWidth) ||
        (matrix.matrixHeight !== undefined && limit.maximumTileRow >= matrix.matrixHeight)
      )
        throw new Error('WMTS tile matrix limits exceed matrix dimensions');
      if (
        parameters.x < limit.minimumTileColumn ||
        parameters.x > limit.maximumTileColumn ||
        parameters.y < limit.minimumTileRow ||
        parameters.y > limit.maximumTileRow
      )
        return false;
    }
    return (
      (matrix.matrixWidth === undefined || parameters.x < matrix.matrixWidth) &&
      (matrix.matrixHeight === undefined || parameters.y < matrix.matrixHeight)
    );
  }

  /** Builds a REST or KVP URL with dimension defaults; throws outside advertised tile coverage. */
  getTileURL(parameters: GetTileParameters): string {
    if (!this.isTileAvailable(parameters))
      throw new RangeError('WMTS tile is outside advertised coverage');
    return this._getRequestURL(parameters);
  }

  /**
   * Builds a feature-info URL for an available tile and valid pixel. Load URL-based metadata first.
   * Advertised per-level tile dimensions bound I/J; unknown dimensions are not guessed.
   */
  getFeatureInfoURL(parameters: WMTSGetFeatureInfoParameters): string {
    validateFeatureInfoIndices(parameters);
    if (!this.isTileAvailable(parameters))
      throw new RangeError('WMTS tile is outside advertised coverage');
    const layer = this._getLayer(
      this._capabilities,
      parameters.layers ? String(parameters.layers) : undefined
    );
    const matrix = getTileMatrix(this._getTileMatrixSet(layer), parameters.z);
    for (const [value, size] of [
      [parameters.pixelColumn, matrix?.tileWidth],
      [parameters.pixelRow, matrix?.tileHeight]
    ]) {
      if (size !== undefined) {
        if (!Number.isSafeInteger(size) || size < 1)
          throw new Error('WMTS tile dimensions require positive safe integers');
        if (value! >= size)
          throw new RangeError('WMTS feature-info pixel is outside tile dimensions');
      }
    }
    return this._getRequestURL(parameters, this._getFeatureInfoFormat(parameters, layer));
  }

  /** Returns native JSON for JSON formats, or unchanged response text for other formats. */
  async getFeatureInfo(
    parameters: WMTSGetFeatureInfoParameters,
    signal?: AbortSignal
  ): Promise<unknown | null> {
    const result = await this._getFeatureInfoResponse(parameters, signal);
    if (result === null) return null;
    const format = result.infoFormat.split(';')[0].trim().toLowerCase();
    return format === 'application/json' || format.endsWith('+json')
      ? JSON.parse(result.text)
      : result.text;
  }

  /** Fetches feature-info text, forwarding cancellation; unavailable tiles return null without a query. */
  async getFeatureInfoText(
    parameters: WMTSGetFeatureInfoParameters,
    signal?: AbortSignal
  ): Promise<string | null> {
    return (await this._getFeatureInfoResponse(parameters, signal))?.text ?? null;
  }

  /** Captures the negotiated format before fetching so later source-option updates cannot change decoding. */
  private async _getFeatureInfoResponse(
    parameters: WMTSGetFeatureInfoParameters,
    signal?: AbortSignal
  ): Promise<{
    /** Format sent with this request. */
    infoFormat: string;
    /** Unmodified service response text. */
    text: string;
  } | null> {
    validateFeatureInfoIndices(parameters);
    await this._loadCapabilities();
    if (!this.isTileAvailable(parameters)) return null;
    const url = this.getFeatureInfoURL(parameters);
    const layer = this._getLayer(
      this._capabilities,
      parameters.layers ? String(parameters.layers) : undefined
    );
    const infoFormat = this._getFeatureInfoFormat(parameters, layer);
    const requestSignal = signal || parameters.signal;
    const response = await this.fetch(url, requestSignal ? {signal: requestSignal} : undefined);
    const text = await response.text();
    checkFeatureInfoException(text);
    if (!response.ok)
      throw new Error(
        'WMTS feature-info request failed: ' + response.status + ' ' + response.statusText
      );
    return {text, infoFormat};
  }

  /** Selects an explicit or advertised format without silently substituting an unsupported format. */
  private _getFeatureInfoFormat(
    parameters: WMTSGetFeatureInfoParameters,
    layer: WMTSLayer | undefined
  ): string {
    const format =
      parameters.infoFormat ||
      this.options.wmts?.infoFormat ||
      layer?.infoFormats?.[0] ||
      layer?.resourceURLs.find(resource => resource.resourceType === 'FeatureInfo')?.format;
    if (!format)
      throw new Error(
        'Missing WMTS feature-info format; configure or load queryable layer metadata'
      );
    if (layer?.infoFormats?.length && !layer.infoFormats.includes(format))
      throw new Error('Unsupported WMTS feature-info format: ' + format);
    return format;
  }

  /** Shares tile identity, dimensions, and authoritative request parameters between both operations. */
  private _getRequestURL(
    parameters: GetTileParameters | WMTSGetFeatureInfoParameters,
    infoFormat?: string
  ): string {
    const featureInfo = infoFormat ? (parameters as WMTSGetFeatureInfoParameters) : undefined;
    const wmts = this.options.wmts || {};
    const layerName = parameters.layers ? String(parameters.layers) : wmts.layer;
    const layer = this._getLayer(this._capabilities, layerName);
    const format = parameters.format || wmts.format || layer?.formats[0] || 'image/png';
    const style =
      wmts.style ||
      layer?.styles.find(candidate => candidate.isDefault)?.identifier ||
      layer?.styles[0]?.identifier ||
      'default';
    const resourceURL = layer?.resourceURLs.find(
      resource =>
        (featureInfo
          ? resource.resourceType === 'FeatureInfo'
          : !resource.resourceType || resource.resourceType === 'tile') &&
        (!resource.format || resource.format === (infoFormat || format))
    );
    const urlTemplate =
      (featureInfo ? wmts.featureInfoUrlTemplate : wmts.urlTemplate) || resourceURL?.template;
    const tileMatrixSet = this._getTileMatrixSet(layer);
    const tileMatrixIdentifier =
      getTileMatrix(tileMatrixSet, parameters.z)?.identifier || String(parameters.z);
    const dimensionParameters = this._getDimensionParameters(layer);
    if (urlTemplate) {
      const replacements = mergeRequestParameters(dimensionParameters, {
        Layer: layerName || layer?.identifier || '',
        Style: style,
        Format: format,
        ...(featureInfo
          ? {
              InfoFormat: infoFormat!,
              I: String(featureInfo.pixelColumn),
              J: String(featureInfo.pixelRow)
            }
          : {}),
        TileMatrix: tileMatrixIdentifier,
        TileRow: String(parameters.y),
        TileCol: String(parameters.x),
        TileMatrixSet: tileMatrixSet?.identifier || wmts.tileMatrixSet || ''
      });
      const expandedURL = urlTemplate.replace(/\{([^{}]+)\}/g, (placeholder, key: string) => {
        const value = getRequestParameter(replacements, key);
        if (value === undefined) throw new Error(`Missing WMTS template parameter: ${key}`);
        return encodeURIComponent(value);
      });
      return featureInfo ? new URL(expandedURL, this.url).toString() : expandedURL;
    }
    if (featureInfo && !wmts.featureInfoUrl && this._capabilities?.featureInfoUrl === null)
      throw new Error(
        'WMTS metadata advertises no KVP feature-info endpoint; configure a query URL or REST template'
      );
    const endpoint = featureInfo
      ? wmts.featureInfoUrl || this._capabilities?.featureInfoUrl || this.url
      : this.url;
    const url = new URL(endpoint, this.url);
    const searchParameters = new URLSearchParams(
      mergeRequestParameters(dimensionParameters, {
        SERVICE: 'WMTS',
        REQUEST: featureInfo ? 'GetFeatureInfo' : 'GetTile',
        VERSION: '1.0.0',
        LAYER: layerName || layer?.identifier || '',
        STYLE: style,
        TILEMATRIXSET: tileMatrixSet?.identifier || wmts.tileMatrixSet || '',
        TILEMATRIX: tileMatrixIdentifier,
        TILEROW: String(parameters.y),
        TILECOL: String(parameters.x),
        FORMAT: format,
        ...(featureInfo
          ? {
              INFOFORMAT: infoFormat!,
              I: String(featureInfo.pixelColumn),
              J: String(featureInfo.pixelRow)
            }
          : {})
      })
    );
    for (const [key, value] of searchParameters) {
      for (const existingKey of [...url.searchParams.keys()]) {
        if (existingKey.toUpperCase() === key.toUpperCase()) url.searchParams.delete(existingKey);
      }
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /** Applies explicit options, then endpoint dimensions, then advertised defaults. */
  private _getDimensionParameters(layer: WMTSLayer | undefined): Record<string, string> {
    let parameters = mergeRequestParameters(this.options.wmts?.parameters || {});
    const endpointParameters = Object.fromEntries(new URL(this.url).searchParams);
    for (const dimension of layer?.dimensions || []) {
      const value =
        getRequestParameter(parameters, dimension.identifier) ??
        getRequestParameter(endpointParameters, dimension.identifier) ??
        dimension.default;
      if (!dimension.identifier || value === undefined || !value.trim())
        throw new Error('Missing WMTS dimension value: ' + (dimension.identifier || '(unnamed)'));
      parameters = mergeRequestParameters(parameters, {[dimension.identifier]: value});
    }
    return parameters;
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
  private _getLayer(
    capabilities: WMTSCapabilities | null,
    layerName: string | undefined = this.options.wmts?.layer
  ): WMTSLayer | undefined {
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
function toTileGrid(
  tileMatrixSet: WMTSTileMatrixSet | undefined,
  metersPerUnit?: number | null
): TileGrid | undefined {
  if (!tileMatrixSet) return undefined;
  // Also checked here, since `setProps()` can change the option after construction.
  validateMetersPerUnit(metersPerUnit, 'WMTS');
  const crs = tileMatrixSet.supportedCRS;
  const unitMeters = getMetersPerUnit(crs, metersPerUnit);
  const swapAxes = getServiceCRSAxisOrder(crs) === 'yx';
  return createTileGrid(
    crs,
    tileMatrixSet.matrices.map(matrix => toTileGridMatrix(matrix, swapAxes, unitMeters))
  );
}

/** Converts one WMTS matrix, keeping only the fields the service advertises. */
function toTileGridMatrix(
  matrix: WMTSTileMatrix,
  swapAxes: boolean,
  metersPerUnit: number | undefined
): TileGridMatrix {
  return createTileGridMatrix({
    id: matrix.identifier,
    resolution: getScaleDenominatorResolution(matrix.scaleDenominator, metersPerUnit),
    point: matrix.topLeftCorner,
    swapAxes,
    tileWidth: matrix.tileWidth,
    tileHeight: matrix.tileHeight,
    matrixWidth: matrix.matrixWidth,
    matrixHeight: matrix.matrixHeight
  });
}

/** Selects an exact numeric identifier or matrix array index, without rounding or clamping. */
function getTileMatrix(
  tileMatrixSet: WMTSTileMatrixSet | undefined,
  zoom: number
): WMTSTileMatrix | undefined {
  const matrices = tileMatrixSet?.matrices || [];
  return matrices.find(matrix => matrix.identifier === String(zoom)) || matrices[zoom];
}

/** Rejects invalid indices before URL generation or network access; tiles never wrap implicitly. */
function validateTileIndices(parameters: GetTileParameters): void {
  for (const [name, value] of Object.entries({x: parameters.x, y: parameters.y, z: parameters.z})) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new RangeError('WMTS ' + name + ' must be a nonnegative safe integer');
  }
}

/** Rejects invalid tile/pixel coordinates before capabilities or feature-info fetches. */
function validateFeatureInfoIndices(parameters: WMTSGetFeatureInfoParameters): void {
  validateTileIndices(parameters);
  for (const value of [parameters.pixelColumn, parameters.pixelRow]) {
    if (!Number.isSafeInteger(value) || value < 0)
      throw new RangeError('WMTS feature-info pixels require nonnegative safe integers');
  }
}

/** Recognizes OWS exception reports even when the service responds with HTTP 200. */
function checkFeatureInfoException(text: string): void {
  const rootOffset = getExceptionReportRootOffset(text);
  if (rootOffset === undefined) return;
  const parsed = parseXMLTextSync(text.slice(rootOffset), {
    xml: {
      _parser: 'internal',
      removeNSPrefix: true,
      uncapitalizeKeys: true,
      textNodeName: '#text',
      _fastXML: {parseTagValue: false}
    }
  });
  const report = parsed.exceptionReport;
  if (report === undefined) return;
  const exceptions = Array.isArray(report?.exception) ? report.exception : [report?.exception];
  const messages = exceptions.map((exception: any) => {
    const values = Array.isArray(exception?.exceptionText)
      ? exception.exceptionText
      : [exception?.exceptionText];
    return (
      values
        .map((value: any) => (typeof value === 'object' ? value?.['#text'] : value))
        .filter(Boolean)
        .join('; ') ||
      exception?.exceptionCode ||
      'server error'
    );
  });
  throw new Error('WMTS feature-info: ' + messages.join('; '));
}

/** Returns the exception root offset after a linear scan of XML whitespace, comments and instructions. */
function getExceptionReportRootOffset(text: string): number | undefined {
  let offset = 0;
  while (offset < text.length) {
    while (offset < text.length && /\s/.test(text[offset])) offset++;
    const terminator = text.startsWith('<?', offset)
      ? '?>'
      : text.startsWith('<!--', offset)
        ? '-->'
        : undefined;
    if (!terminator) {
      return /^<(?:[^\s<>:]+:)?ExceptionReport(?:\s|\/?>)/.test(text.slice(offset))
        ? offset
        : undefined;
    }
    const ending = text.indexOf(terminator, offset + (terminator === '?>' ? 2 : 4));
    if (ending === -1) return undefined;
    offset = ending + terminator.length;
  }
  return undefined;
}

/** Merges case-insensitive KVP names so generated request fields cannot be overridden by extras. */
function mergeRequestParameters(...groups: Record<string, string>[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const group of groups) {
    for (const [name, value] of Object.entries(group)) {
      for (const existingName of Object.keys(result))
        if (existingName.toUpperCase() === name.toUpperCase()) delete result[existingName];
      result[name] = value;
    }
  }
  return result;
}

/** Looks up a dimension or template parameter without changing its value's case. */
function getRequestParameter(parameters: Record<string, string>, name: string): string | undefined {
  return Object.entries(parameters).find(([key]) => key.toUpperCase() === name.toUpperCase())?.[1];
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
