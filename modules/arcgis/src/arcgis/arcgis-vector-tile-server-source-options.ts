// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {DataSourceOptions} from '@loaders.gl/loader-utils';
import type {MVTLoaderOptions} from '@loaders.gl/mvt';

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
export type ArcGISVectorTileServerSourceLoaderOptions = DataSourceOptions &
  MVTLoaderOptions & {
    'arcgis-vector-tile-server'?: {
      /** Optional MVT parser options. */
      mvt?: MVTLoaderOptions['mvt'];
    };
  };

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_VECTOR_TILE_SERVER_SOURCE_DEFAULT_OPTIONS = {'arcgis-vector-tile-server': {}};
