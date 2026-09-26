// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageLoaderOptions} from '@loaders.gl/images';
import type {DataSourceOptions} from '@loaders.gl/loader-utils';

/** Options for an ArcGIS cached MapServer tile source. */
export type ArcGISMapTileSourceLoaderOptions = DataSourceOptions &
  ImageLoaderOptions & {
    'arcgis-map-server'?: {
      /** Select cached tiles, dynamic export tiles, or automatic metadata-based selection. */
      mode?: 'cached' | 'dynamic' | 'auto';
      /** Tile size used for dynamic export requests. */
      tileSize?: number;
      /** Optional custom tile URL template. */
      urlTemplate?: string;
      /** Optional service URL pool for simple request distribution. */
      urls?: string[];
      /** Additional query parameters sent to the metadata endpoint. */
      parameters?: Record<string, string>;
      /** Metadata document supplied by the application. */
      metadata?: ArcGISMapServerMetadata;
      /** Default parameters forwarded to MapServer `export` requests. */
      exportParameters?: Record<string, string | number | boolean>;
    };
  };

/** Relevant normalized fields from an ArcGIS MapServer metadata document. */
export type ArcGISMapServerMetadata = {
  name?: string;
  description?: string;
  serviceDescription?: string;
  copyrightText?: string;
  fullExtent?: {xmin: number; ymin: number; xmax: number; ymax: number; spatialReference?: unknown};
  spatialReference?: unknown;
  tileInfo?: {
    lods?: {level: number}[];
    rows?: number;
    cols?: number;
    format?: string;
    spatialReference?: unknown;
    origin?: {x: number; y: number};
  };
};

/** Parameters that can be changed between ArcGIS map tile requests. */
export type ArcGISMapTileParameters = Record<string, string | number | boolean>;

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_MAP_TILE_SOURCE_DEFAULT_OPTIONS = {'arcgis-map-server': {}};
