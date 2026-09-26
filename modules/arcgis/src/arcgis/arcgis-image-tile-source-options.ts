// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {ImageLoaderOptions} from '@loaders.gl/images';
import type {DataSourceOptions} from '@loaders.gl/loader-utils';

/** Options for the ArcGIS ImageServer tile source. */
export type ArcGISImageTileSourceLoaderOptions = DataSourceOptions &
  ImageLoaderOptions & {
    'arcgis-image-server-tiles'?: {
      /** Tile size used for exportImage requests. */
      tileSize?: number;
      /** Optional service URL pool for simple request distribution. */
      urls?: string[];
      /** Additional exportImage parameters. */
      parameters?: Record<string, string | number | boolean>;
      /** Response format, using LERC for analytical raster tiles. */
      format?: 'png32' | 'lerc';
    };
  };

/** Default request options shared by metadata and runtime sources. */
export const ARCGIS_IMAGE_TILE_SOURCE_DEFAULT_OPTIONS = {'arcgis-image-server-tiles': {}};
