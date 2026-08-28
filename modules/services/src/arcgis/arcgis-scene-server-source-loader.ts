// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {CoreAPI, DataSourceOptions, SourceLoader} from '@loaders.gl/loader-utils';
import {DataSource} from '@loaders.gl/loader-utils';
import {
  createI3SLayerSource,
  normalizeI3SServiceMetadata,
  parseI3SSceneLayerMetadata
} from '@loaders.gl/i3s';
import type {I3SLayerSource, I3SServiceMetadata, SceneLayer3D} from '@loaders.gl/i3s';
import {buildArcGISResourceURL} from './arcgis-url-utils';

/** Parameters accepted by the ArcGIS SceneServer query endpoint. */
export type ArcGISSceneQueryOptions = {
  /** SQL where clause. */
  where?: string;
  /** Object IDs to include. */
  objectIds?: number[] | string;
  /** Geometry filter encoded using ArcGIS REST geometry syntax. */
  geometry?: unknown;
  /** Geometry type for the geometry filter. */
  geometryType?: string;
  /** Spatial relationship for the geometry filter. */
  spatialRel?: string;
  /** Fields to return. */
  outFields?: string | string[];
  /** Whether feature geometry should be included. */
  returnGeometry?: boolean;
  /** Input spatial reference. */
  inSR?: string | number | object;
  /** Output spatial reference. */
  outSR?: string | number | object;
  /** ArcGIS result type. */
  resultType?: string;
  /** Result page offset. */
  resultOffset?: number;
  /** Maximum records in one page. */
  resultRecordCount?: number;
  /** Response format. */
  f?: 'json' | 'pjson';
  /** Abort signal for the request. */
  signal?: AbortSignal;
};

/** Normalized result returned by a SceneServer query. */
export type ArcGISSceneQueryResult = {
  /** Returned SceneServer features. */
  features: unknown[];
  /** Field metadata advertised by the layer. */
  fields?: unknown[];
  /** Whether another page is available. */
  exceededTransferLimit?: boolean;
  /** Original response metadata for advanced consumers. */
  rawMetadata?: unknown;
};

/** Error raised when a SceneServer query cannot be completed or decoded. */
export class ArcGISSceneServerQueryError extends Error {
  /** HTTP status code, when the failure came from a response. */
  readonly status?: number;

  /** Creates a typed SceneServer query error. */
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ArcGISSceneServerQueryError';
    this.status = status;
  }
}

/** Options for an ArcGIS SceneServer source. */
export type ArcGISSceneServerSourceOptions = DataSourceOptions & {
  'arcgis-scene-server'?: {
    /** Layer identifier used when the input URL ends at `/SceneServer`. */
    layerId?: number | string;
    /** ArcGIS token applied to metadata and tile-resource requests. */
    token?: string;
    /** Optional metadata document for offline or preloaded use. */
    metadata?: unknown;
  };
};

/** Source facade for an ArcGIS SceneServer I3S layer. */
export class ArcGISSceneServerSource extends DataSource<string, ArcGISSceneServerSourceOptions> {
  /** Cached normalized layer metadata. */
  private metadataPromise: Promise<I3SServiceMetadata> | null = null;
  /** Cached profile-specific tileset source. */
  private sourcePromise: Promise<I3SLayerSource> | null = null;

  /** Creates a SceneServer source. */
  constructor(url: string, options: ArcGISSceneServerSourceOptions = {}, coreApi?: CoreAPI) {
    super(url.replace(/\/+$/, ''), options, ArcGISSceneServerSourceLoader.defaultOptions, coreApi);
  }

  /** Returns normalized SceneServer layer metadata. */
  async getMetadata(): Promise<I3SServiceMetadata> {
    this.metadataPromise ||= this.loadMetadata();
    return await this.metadataPromise;
  }

  /** Creates the existing mesh or Point Cloud source for this layer. */
  async getTilesetSource(): Promise<I3SLayerSource> {
    this.sourcePromise ||= this.createTilesetSource();
    return await this.sourcePromise;
  }

  /** Queries feature attributes and geometry from a SceneServer layer. */
  async query(options: ArcGISSceneQueryOptions = {}): Promise<ArcGISSceneQueryResult> {
    const {signal, f = 'json', ...queryParameters} = options;
    const queryURL = buildArcGISResourceURL(this.getLayerURL(), 'query', {
      where: '1=1',
      outFields: '*',
      returnGeometry: true,
      f,
      ...queryParameters,
      token: this.getToken()
    });
    const response = await this.fetch(queryURL, signal ? {signal} : undefined);
    if (!response.ok) {
      throw new ArcGISSceneServerQueryError(
        `ArcGIS SceneServer query failed: ${response.status} ${response.statusText}`,
        response.status
      );
    }
    const document = (await response.json()) as Record<string, unknown>;
    if (document.error) {
      throw new ArcGISSceneServerQueryError(
        `ArcGIS SceneServer query returned an error: ${JSON.stringify(document.error)}`
      );
    }
    return {
      features: Array.isArray(document.features) ? document.features : [],
      fields: Array.isArray(document.fields) ? document.fields : undefined,
      exceededTransferLimit:
        typeof document.exceededTransferLimit === 'boolean'
          ? document.exceededTransferLimit
          : undefined,
      rawMetadata: document
    };
  }

  /** Alias for query used by applications that consume generic feature sources. */
  async getFeatures(options: ArcGISSceneQueryOptions = {}): Promise<ArcGISSceneQueryResult> {
    return await this.query(options);
  }

  /** Returns the layer URL, resolving an explicit layer ID when needed. */
  getLayerURL(): string {
    const url = new URL(this.url);
    url.pathname = url.pathname.replace(/\/+$/, '');
    if (/\/SceneServer\/layers\/[^/]+$/i.test(url.pathname)) {
      url.search = '';
      url.hash = '';
      return url.toString();
    }

    if (!/\/SceneServer$/i.test(url.pathname)) {
      throw new Error(
        'ArcGISSceneServerSource requires a /SceneServer/layers/{id} URL or a /SceneServer URL with arcgis-scene-server.layerId'
      );
    }

    const layerId = this.options['arcgis-scene-server']?.layerId;
    if (layerId === undefined) {
      throw new Error(
        'ArcGISSceneServerSource requires a /SceneServer/layers/{id} URL or a /SceneServer URL with arcgis-scene-server.layerId'
      );
    }
    url.pathname = `${url.pathname.replace(/\/$/, '')}/layers/${encodeURIComponent(String(layerId))}`;
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  /** Returns the metadata request URL with ArcGIS JSON and authentication parameters. */
  metadataURL(): string {
    const url = new URL(this.getLayerURL());
    url.searchParams.set('f', 'pjson');
    const token = this.getToken();
    if (token && !url.searchParams.has('token')) {
      url.searchParams.set('token', token);
    }
    return url.toString();
  }

  private async loadMetadata(): Promise<I3SServiceMetadata> {
    const configuredMetadata = this.options['arcgis-scene-server']?.metadata;
    const layer = configuredMetadata
      ? parseI3SSceneLayerMetadata(configuredMetadata)
      : await this.fetchLayerMetadata();
    return normalizeI3SServiceMetadata(this.getLayerURL(), layer);
  }

  private async fetchLayerMetadata(): Promise<SceneLayer3D> {
    const response = await this.fetch(this.metadataURL());
    if (!response.ok) {
      throw new Error(
        `ArcGIS SceneServer metadata request failed: ${response.status} ${response.statusText}`
      );
    }
    return parseI3SSceneLayerMetadata(await response.json());
  }

  private async createTilesetSource(): Promise<I3SLayerSource> {
    const metadata = await this.getMetadata();
    return createI3SLayerSource(
      metadata.url,
      metadata.layer,
      this.getSourceOptions(),
      this.coreApi
    );
  }

  private getSourceOptions(): DataSourceOptions {
    const i3sOptions = (this.options['i3s'] as Record<string, unknown> | undefined) || {};
    const token = this.getToken();
    return {
      ...this.options,
      i3s: token ? {...i3sOptions, token} : i3sOptions
    };
  }

  private getToken(): string | undefined {
    const serviceToken = this.options['arcgis-scene-server']?.token;
    const i3sToken = (this.options['i3s'] as Record<string, unknown> | undefined)?.token;
    if (serviceToken) {
      return serviceToken;
    }
    if (typeof i3sToken === 'string' && i3sToken) {
      return i3sToken;
    }
    return new URL(this.url).searchParams.get('token') || undefined;
  }
}

/** Source loader for ArcGIS SceneServer I3S layers. */
export const ArcGISSceneServerSourceLoader = {
  dataType: null as unknown as ArcGISSceneServerSource,
  batchType: null as never,
  name: 'ArcGIS SceneServer',
  id: 'arcgis-scene-server',
  module: 'services',
  version: '0.0.0',
  extensions: [],
  mimeTypes: ['application/json'],
  type: 'arcgis-scene-server',
  fromUrl: true,
  fromBlob: false,
  options: {'arcgis-scene-server': {}},
  defaultOptions: {'arcgis-scene-server': {}},
  testURL: (url: string): boolean => /\/SceneServer(?:[\/?#]|$)/i.test(url),
  createDataSource: (
    url: string,
    options: ArcGISSceneServerSourceOptions = {},
    coreApi?: CoreAPI
  ) => new ArcGISSceneServerSource(url, options, coreApi)
} as const satisfies SourceLoader<ArcGISSceneServerSource>;
