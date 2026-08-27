// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {
  CoreAPI,
  DataSourceOptions,
  GetTileDataParameters,
  GetTileParameters,
  SourceLoader,
  TileSourceMetadata,
  TileSource
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';

/** ArcGIS vector tile service metadata. */
export type ArcGISVectorTileServiceMetadata = {
  /** Human-readable service description. */
  serviceDescription?: string;
  /** Map name exposed by the service. */
  mapName?: string;
  /** Tile grid information. */
  tileInfo?: {
    /** Tile width in pixels. */
    cols?: number;
    /** Tile height in pixels. */
    rows?: number;
    /** Tile format, normally pbf. */
    format?: string;
    /** Tile origin. */
    origin?: {x: number; y: number};
    /** Tile grid spatial reference. */
    spatialReference?: {wkid?: number; latestWkid?: number};
    /** Levels of detail. */
    lods?: Array<{level: number; resolution: number; scale?: number}>;
  };
  /** Full service extent. */
  fullExtent?: {xmin: number; ymin: number; xmax: number; ymax: number};
  /** Initial service extent. */
  initialExtent?: {xmin: number; ymin: number; xmax: number; ymax: number};
};

/** Options for the ArcGIS VectorTileServer source. */
export type ArcGISVectorTileServerSourceLoaderOptions = DataSourceOptions & {
  'arcgis-vector-tile-server'?: {
    /** Optional MVT parser options. */
    mvt?: Record<string, unknown>;
  };
};

/** A source for ArcGIS VectorTileServer metadata and PBF tiles. */
export class ArcGISVectorTileServerSource
  extends DataSource<string, ArcGISVectorTileServerSourceLoaderOptions>
  implements TileSource
{
  /** Cached service metadata request. */
  private serviceMetadata: Promise<ArcGISVectorTileServiceMetadata> | null = null;
  /** Query parameters supplied with the service URL, such as an access token. */
  private readonly serviceQueryParameters: URLSearchParams;

  /** Creates an ArcGIS VectorTileServer source. */
  constructor(
    url: string,
    options: ArcGISVectorTileServerSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) {
    const serviceURL = new URL(url);
    serviceURL.pathname = serviceURL.pathname.replace(/\/$/, '');
    super(
      `${serviceURL.origin}${serviceURL.pathname}`,
      options,
      ArcGISVectorTileServerSourceLoader.defaultOptions,
      coreApi
    );
    this.serviceQueryParameters = new URLSearchParams(serviceURL.search);
  }

  /** Returns normalized service and tile-grid metadata. */
  async getMetadata(): Promise<TileSourceMetadata> {
    const metadata = await this.getServiceMetadata();
    const tileInfo = metadata.tileInfo;
    const lods = tileInfo?.lods || [];
    const extent = metadata.fullExtent || metadata.initialExtent;
    return {
      name: metadata.mapName || this.url.split('/').pop() || '',
      title: metadata.mapName,
      abstract: metadata.serviceDescription,
      format: 'application/vnd.mapbox-vector-tile',
      minZoom: lods[0]?.level,
      maxZoom: lods.at(-1)?.level,
      boundingBox: extent
        ? [
            [extent.xmin, extent.ymin],
            [extent.xmax, extent.ymax]
          ]
        : undefined,
      layer: {
        name: metadata.mapName || '',
        srs: tileInfo?.spatialReference ? [getSpatialReference(tileInfo.spatialReference)] : [],
        layers: []
      },
      formatHeader: {
        tileInfo,
        styleURL: this.getStyleURL(),
        spriteURL: this.getSpriteURL()
      }
    };
  }

  /** Fetches one raw PBF tile from the ArcGIS tile endpoint. */
  async getTile(parameters: GetTileParameters, signal?: AbortSignal): Promise<ArrayBuffer | null> {
    const response = await this.fetch(this.getTileURL(parameters), {
      signal,
      headers: {Accept: 'application/vnd.mapbox-vector-tile, application/x-protobuf'}
    });
    if (!response.ok) return null;
    return response.arrayBuffer();
  }

  /** Provides raw PBF tiles through the deck.gl source interface. */
  async getTileData(parameters: GetTileDataParameters): Promise<ArrayBuffer | null> {
    return this.getTile(parameters.index, parameters.signal);
  }

  /** Builds the ArcGIS cached vector tile URL. */
  getTileURL(parameters: GetTileParameters): string {
    return this.getResourceURL(`/tile/${parameters.z}/${parameters.y}/${parameters.x}.pbf`);
  }

  /** Returns the service metadata URL. */
  getMetadataURL(): string {
    const url = new URL(this.getResourceURL(''));
    url.searchParams.set('f', 'pjson');
    return url.toString();
  }

  /** Returns the ArcGIS Mapbox style resource URL. */
  getStyleURL(): string {
    return this.getResourceURL('/resources/styles/root.json');
  }

  /** Returns the ArcGIS sprite resource base URL. */
  getSpriteURL(): string {
    return this.getResourceURL('/resources/sprites/sprite');
  }

  /** Loads and caches the ArcGIS VectorTileServer metadata document. */
  private async getServiceMetadata(): Promise<ArcGISVectorTileServiceMetadata> {
    this.serviceMetadata ||= this.fetch(this.getMetadataURL()).then(async response => {
      if (!response.ok)
        throw new Error(`ArcGIS VectorTileServer request failed: ${response.status}`);
      return (await response.json()) as ArcGISVectorTileServiceMetadata;
    });
    return this.serviceMetadata;
  }

  /** Builds a resource URL while retaining service query parameters. */
  private getResourceURL(resourcePath: string): string {
    const url = new URL(this.url);
    url.pathname = `${url.pathname.replace(/\/$/, '')}${resourcePath}`;
    for (const [key, value] of this.serviceQueryParameters) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }
}

/** Source loader for ArcGIS VectorTileServer services. */
export const ArcGISVectorTileServerSourceLoader = {
  dataType: null as unknown as ArcGISVectorTileServerSource,
  batchType: null as never,
  name: 'ArcGIS VectorTileServer',
  id: 'arcgis-vector-tile-server',
  module: 'services',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/vnd.mapbox-vector-tile', 'application/x-protobuf'],
  type: 'arcgis-vector-tile-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-vector-tile-server': {}},
  defaultOptions: {'arcgis-vector-tile-server': {}},
  testURL: (url: string): boolean => /\/vectortileserver(?:\/|$)/i.test(url),
  createDataSource: (
    url: string,
    options: ArcGISVectorTileServerSourceLoaderOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISVectorTileServerSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISVectorTileServerSource>;

/** Converts an ArcGIS spatial reference to an EPSG identifier. */
function getSpatialReference(spatialReference: {wkid?: number; latestWkid?: number}): string {
  return `EPSG:${spatialReference.latestWkid || spatialReference.wkid}`;
}
