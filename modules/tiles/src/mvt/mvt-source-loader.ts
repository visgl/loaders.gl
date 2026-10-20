// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  SourceLoader,
  ImageType,
  DataSourceOptions,
  ImageTileSource,
  VectorTile,
  VectorTileSource,
  TileSourceMetadata,
  GetTileParameters,
  GetTileDataParameters
} from '@loaders.gl/core/loader-utils';
import type {Schema} from '@loaders.gl/core/schema';
import {
  DataSource,
  parseContentType,
  createWebMercatorTileGrid,
  resolveXYZTileParameters,
  waitForPromiseWithSignal
} from '@loaders.gl/core/loader-utils';
import {
  ImageBitmapLoader,
  type ImageBitmapLoaderOptions,
  getBinaryImageMetadata
} from '@loaders.gl/images';
import {MVTFormat} from './mvt-format';
import {MVTLoader, type MVTLoaderOptions} from './mvt-loader';
import {TileJSONLoader, type TileJSONLoaderOptions} from './tilejson-loader';
import type {TileJSON} from './lib/parse-tilejson';

/** Properties for a Mapbox Vector Tile Source */
export type MVTSourceLoaderOptions = DataSourceOptions &
  MVTLoaderOptions &
  TileJSONLoaderOptions &
  ImageBitmapLoaderOptions & {
    mvt?: {
      /** Explicit Web Mercator contract for sources without TileJSON metadata. */
      coordinateReferenceSystem?: 'EPSG:3857';
      /** Logical XYZ pixel frame, independent of encoded size or vector extent. */
      tileSize?: number;
      /** Configured minimum XYZ zoom, overriding TileJSON. */
      minZoom?: number;
      /** Configured maximum XYZ zoom, overriding TileJSON. */
      maxZoom?: number;
      /** Wire row convention; callers always address XYZ rows. */
      scheme?: 'xyz' | 'tms';
      /** if not supplied, loads tilejson.json, If null does not load metadata */
      metadataUrl?: string | null;
      /** Override extension (necessary if no metadata) */
      extension?: string;
      /** Additional attribution, adds to any attribution loaded from tileset metadata */
      attributions?: string[];
      /** Shape of returned vector tile data. */
      shape?: 'geojson-table' | 'columnar-table' | 'binary-geometry' | 'arrow-table';
      /** Ignore successful HTTP tile responses with text, JSON or XML MIME types, report an error, and return null. */
      ignoreTextResponses?: boolean;
    };
  };

/** Creates an MVTTileSource */
export const MVTSourceLoader = {
  dataType: null as unknown as MVTTileSource,
  batchType: null as never,
  ...MVTFormat,
  version: '0.0.0',
  type: 'mvt',
  fromUrl: true,
  fromBlob: false,

  options: {
    mvt: {
      shape: 'arrow-table'
    }
  },

  defaultOptions: {
    mvt: {
      shape: 'arrow-table'
    }
  },

  testURL: (url: string): boolean => true,
  createDataSource(url: string, options: MVTSourceLoaderOptions, coreApi?: CoreAPI): MVTTileSource {
    return new MVTTileSource(url, options, coreApi);
  }
} as const satisfies SourceLoader<MVTTileSource>;

/**
 * MVT data source for Mapbox Vector Tiles v1.
 */
/**
 * A PMTiles data source
 * @note Can be either a raster or vector tile source depending on the contents of the PMTiles file.
 */
export class MVTTileSource
  extends DataSource<string, MVTSourceLoaderOptions>
  implements ImageTileSource, VectorTileSource
{
  readonly metadataUrl: string | null = null;
  schema: 'tms' | 'xyz' | 'template' = 'tms';
  /** Row convention used by the tile endpoint. */
  private tileScheme: 'xyz' | 'tms' = 'xyz';
  metadata: Promise<TileSourceMetadata>;
  extension: string;
  mimeType: string | null = null;

  constructor(url: string, options: MVTSourceLoaderOptions, coreApi?: CoreAPI) {
    super(url, options, MVTSourceLoader.defaultOptions, coreApi);
    this.metadataUrl =
      options.mvt?.metadataUrl === null
        ? null
        : options.mvt?.metadataUrl || `${this.url}/tilejson.json`;
    this.extension = options.mvt?.extension || '.png';

    this.getTileData = this.getTileData.bind(this);
    this.metadata = this.getMetadata();

    if (isURLTemplate(this.url)) {
      this.schema = 'template';
    }
  }

  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  async getMetadata(): Promise<TileSourceMetadata> {
    const fallbackMetadata: TileSourceMetadata = {
      minZoom: this.options.mvt?.minZoom ?? 0,
      maxZoom: this.options.mvt?.maxZoom ?? 30,
      ...(this.options.mvt?.coordinateReferenceSystem === 'EPSG:3857'
        ? {
            tileGrid: createWebMercatorTileGrid(
              this.options.mvt.minZoom ?? 0,
              this.options.mvt.maxZoom ?? 30,
              this.options.mvt.tileSize ?? 256
            )
          }
        : {}),
      attributions: this.options.core?.attributions || []
    };

    this.tileScheme = this.options.mvt?.scheme || 'xyz';
    if (!this.metadataUrl) {
      return fallbackMetadata;
    }

    let response: Response;
    try {
      // Annoyingly, on CORS errors, fetch doesn't use the response status/ok mechanism but instead throws
      // CORS errors are common when requesting an unavailable sub resource such as a metadata file or an unavailable tile)
      response = await this.fetch(this.metadataUrl);
    } catch (error: unknown) {
      this.reportError(error, `Failed to fetch metadata from ${this.metadataUrl}`);
      return fallbackMetadata;
    }
    if (!response.ok) {
      this.reportError(
        new Error(`${response.status} ${response.statusText}`),
        `Failed to fetch metadata from ${this.metadataUrl}`
      );
      return fallbackMetadata;
    }
    const tileJSON = await response.text();
    const tileJSONMetadata = (await this.coreApi.parse(
      tileJSON,
      TileJSONLoader,
      this.loadOptions
    )) as TileJSON | null;

    // TODO add metadata attributions
    // metadata.attributions = [...this.options.attributions, ...(metadata.attributions || [])];
    // if (metadata?.mimeType) {
    //   this.mimeType = metadata?.tileMIMEType;
    // }

    const minZoom =
      this.options.mvt?.minZoom ?? tileJSONMetadata?.minZoom ?? fallbackMetadata.minZoom!;
    const maxZoom =
      this.options.mvt?.maxZoom ?? tileJSONMetadata?.maxZoom ?? fallbackMetadata.maxZoom!;
    this.tileScheme = this.options.mvt?.scheme || tileJSONMetadata?.scheme || 'xyz';
    const hasRepresentableZoomRange =
      Number.isInteger(minZoom) &&
      Number.isInteger(maxZoom) &&
      minZoom >= 0 &&
      maxZoom >= minZoom &&
      maxZoom <= 31;
    return {
      ...fallbackMetadata,
      ...tileJSONMetadata,
      minZoom,
      maxZoom,
      ...(tileJSONMetadata
        ? {
            tileGrid: hasRepresentableZoomRange
              ? createWebMercatorTileGrid(minZoom, maxZoom, this.options.mvt?.tileSize ?? 256)
              : undefined
          }
        : {})
    };
  }

  getTileMIMEType(): string | null {
    return this.mimeType;
  }

  async getTile(parameters: GetTileParameters): Promise<ArrayBuffer | null> {
    const resolved = resolveXYZTileParameters(
      (await waitForPromiseWithSignal(this.metadata, parameters.signal)).tileGrid,
      parameters
    );
    if (!resolved) return null;
    const {x, y, z} = resolved;
    const tileUrl = this.getTileURL(x, y, z);
    const response = await this.fetch(
      tileUrl,
      parameters.signal ? {signal: parameters.signal} : undefined
    );
    if (!response.ok) {
      this.reportError(
        new Error(`${response.status} ${response.statusText}`),
        `Failed to fetch tile ${tileUrl} ${JSON.stringify(parameters)}`
      );
      return null;
    }
    const contentType = parseContentType(response.headers.get('content-type'));
    const isTextResponse =
      contentType?.startsWith('text/') ||
      contentType === 'application/json' ||
      contentType?.endsWith('+json') ||
      contentType === 'application/xml' ||
      contentType?.endsWith('+xml');
    if (this.options.mvt?.ignoreTextResponses && isTextResponse) {
      this.reportError(
        new Error(`Unexpected tile content type ${contentType}`),
        `Rejected textual response from ${tileUrl}`
      );
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }

  // Tile Source interface implementation: deck.gl compatible API
  // TODO - currently only handles image tiles, not vector tiles

  async getTileData(parameters: GetTileDataParameters): Promise<any> {
    const {x, y, z} = parameters.index;
    // const metadata = await this.metadata;
    // mimeType = metadata?.tileMIMEType || 'application/vnd.mapbox-vector-tile';

    const arrayBuffer = await this.getTile({
      x,
      y,
      z,
      layers: [],
      tileMatrix: parameters.tileMatrix,
      signal: parameters.signal
    });
    if (arrayBuffer === null) {
      return null;
    }

    const imageMetadata = getBinaryImageMetadata(arrayBuffer);
    this.mimeType =
      this.mimeType || imageMetadata?.mimeType || 'application/vnd.mapbox-vector-tile';
    switch (this.mimeType) {
      case 'application/vnd.mapbox-vector-tile':
        return await this._parseVectorTile(arrayBuffer, {
          x,
          y,
          z,
          layers: [],
          tileMatrix: parameters.tileMatrix,
          signal: parameters.signal
        });
      default:
        return await this._parseImageTile(arrayBuffer);
    }
  }

  // ImageTileSource interface implementation

  async getImageTile(tileParams: GetTileParameters): Promise<ImageType | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this._parseImageTile(arrayBuffer) : null;
  }

  protected async _parseImageTile(arrayBuffer: ArrayBuffer): Promise<ImageType> {
    return (await this.coreApi.parse(
      arrayBuffer,
      ImageBitmapLoader,
      this.loadOptions
    )) as ImageType;
  }

  // VectorTileSource interface implementation

  async getVectorTile(tileParams: GetTileParameters): Promise<VectorTile | null> {
    const arrayBuffer = await this.getTile(tileParams);
    return arrayBuffer ? this._parseVectorTile(arrayBuffer, tileParams) : null;
  }

  protected async _parseVectorTile(
    arrayBuffer: ArrayBuffer,
    tileParams: GetTileParameters
  ): Promise<VectorTile | null> {
    const resolved = resolveXYZTileParameters(
      (await waitForPromiseWithSignal(this.metadata, tileParams.signal)).tileGrid,
      tileParams
    );
    if (!resolved) return null;
    const inheritedMVTOptions = (this.loadOptions as MVTLoaderOptions)?.mvt;
    const selectedLayers = normalizeTileLayers(tileParams.layers) || inheritedMVTOptions?.layers;
    const loadOptions: MVTLoaderOptions = {
      ...this.loadOptions,
      mvt: {
        ...inheritedMVTOptions,
        shape: this.options.mvt?.shape || inheritedMVTOptions?.shape || 'arrow-table',
        coordinates: 'wgs84',
        tileIndex: {x: resolved.x, y: resolved.y, z: resolved.z},
        layers: selectedLayers
      }
    };

    return (await this.coreApi.parse(arrayBuffer, MVTLoader, loadOptions)) as VectorTile;
  }

  getMetadataUrl(): string | null {
    return this.metadataUrl;
  }

  getTileURL(x: number, y: number, z: number) {
    // The legacy token always inverts the caller's XYZ row, independently of TileJSON scheme.
    const template =
      Number.isInteger(y) && Number.isInteger(z)
        ? this.url.replace(/\{-y\}/g, String(2 ** z - y - 1))
        : this.url;
    if (this.tileScheme === 'tms') y = 2 ** z - y - 1;
    switch (this.schema) {
      case 'xyz':
        return `${this.url}/${x}/${y}/${z}${this.extension}`;
      case 'tms':
        return `${this.url}/${z}/${x}/${y}${this.extension}`;
      case 'template':
        return getURLFromTemplate(template, x, y, z, '0');
      default:
        throw new Error(this.schema);
    }
  }
}

/** Normalizes a non-empty tile layer selection for the MVT decoder. */
function normalizeTileLayers(layers?: string | string[]): string[] | undefined {
  const normalizedLayers = typeof layers === 'string' ? [layers] : layers;
  return normalizedLayers?.length ? normalizedLayers : undefined;
}

export function isURLTemplate(s: string): boolean {
  return /(?=.*{z})(?=.*{x})(?=.*({y}|{-y}))|(?=.*{x})(?=.*({y}|{-y})(?=.*{z}))/.test(s);
}

export type URLTemplate = string | string[];

const xRegex = new RegExp('{x}', 'g');
const yRegex = new RegExp('{y}', 'g');
const zRegex = new RegExp('{z}', 'g');

/**
 * Get a URL from a URL template
 * @note copied from deck.gl/modules/geo-layers/src/tileset-2d/utils.ts
 * @param template - URL template
 * @param x - tile x coordinate
 * @param y - tile y coordinate
 * @param z - tile z coordinate
 * @param id - tile id
 * @returns URL
 */
export function getURLFromTemplate(
  template: URLTemplate,
  x: number,
  y: number,
  z: number,
  id: string = '0'
): string {
  if (Array.isArray(template)) {
    const i = stringHash(id) % template.length;
    template = template[i];
  }

  let url = template;
  url = url.replace(xRegex, String(x));
  url = url.replace(yRegex, String(y));
  url = url.replace(zRegex, String(z));

  // Back-compatible support for {-y}
  if (Number.isInteger(y) && Number.isInteger(z)) {
    url = url.replace(/\{-y\}/g, String(Math.pow(2, z) - y - 1));
  }

  return url;
}

function stringHash(s: string): number {
  return Math.abs(s.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0));
}
