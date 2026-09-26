// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS} from './arcgis-vector-tile-server-source-options';
import type {
  ArcGISVectorTileServiceMetadata,
  ArcGISVectorTileServerSourceLoaderOptions
} from './arcgis-vector-tile-server-source-options';
import type {
  CoreAPI,
  GetTileDataParameters,
  GetTileParameters,
  TileSourceMetadata,
  VectorTile,
  VectorTileSource
} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {MVTLoader, type MVTLoaderOptions} from '@loaders.gl/mvt';
import type {Schema} from '@loaders.gl/schema';

/** A source for ArcGIS VectorTileServer metadata and PBF tiles. */
export class ArcGISVectorTileServerSource
  extends DataSource<string, ArcGISVectorTileServerSourceLoaderOptions>
  implements VectorTileSource
{
  /** Decoded tile family consumed by generic tile renderers. */
  readonly mimeType = 'application/vnd.mapbox-vector-tile';
  /** ArcGIS tiles are decoded to WGS84 coordinates before rendering. */
  readonly localCoordinates = false;
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
      ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS,
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

  /** Returns the schema advertised by decoded vector tiles. */
  async getSchema(): Promise<Schema> {
    return {fields: [], metadata: {}};
  }

  /** Fetches and decodes one ArcGIS vector tile to geographic coordinates. */
  async getVectorTile(parameters: GetTileParameters): Promise<VectorTile | null> {
    const arrayBuffer = await this.getTile(parameters, parameters.signal);
    if (!arrayBuffer) {
      return null;
    }
    const inheritedOptions = (this.loadOptions as MVTLoaderOptions).mvt;
    const sourceOptions = this.options['arcgis-vector-tile-server']?.mvt;
    return (await this.coreApi.parse(arrayBuffer, MVTLoader, {
      ...this.loadOptions,
      mvt: {
        ...inheritedOptions,
        ...sourceOptions,
        coordinates: 'wgs84',
        tileIndex: {x: parameters.x, y: parameters.y, z: parameters.z},
        layers:
          normalizeLayers(parameters.layers) || sourceOptions?.layers || inheritedOptions?.layers
      }
    })) as VectorTile;
  }

  /** Provides decoded vector tiles through the deck.gl source interface. */
  async getTileData(parameters: GetTileDataParameters): Promise<VectorTile | null> {
    return this.getVectorTile({...parameters.index, signal: parameters.signal});
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

/** Converts an ArcGIS spatial reference to an EPSG identifier. */
function getSpatialReference(spatialReference: {wkid?: number; latestWkid?: number}): string {
  return `EPSG:${spatialReference.latestWkid || spatialReference.wkid}`;
}

/** Normalizes generic tile layer selection for the MVT parser. */
function normalizeLayers(layers?: string | string[]): string[] | undefined {
  if (!layers) return undefined;
  return Array.isArray(layers) ? layers : [layers];
}
