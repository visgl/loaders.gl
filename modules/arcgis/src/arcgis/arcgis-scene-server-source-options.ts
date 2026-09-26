// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions} from '@loaders.gl/loader-utils';

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

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_SCENE_SERVER_SOURCE_DEFAULT_OPTIONS = {'arcgis-scene-server': {}};
