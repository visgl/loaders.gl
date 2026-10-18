// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {DataSourceOptions} from '@loaders.gl/loader-utils';
import type {ArrowTable} from '@loaders.gl/schema';
import type {TableTileSourceLoaderOptions} from './table-tile-source-loader';

/** In-memory Arrow tables accepted by the Arrow tile source. */
export type ArrowTableTileSourceInput = ArrowTable | Table;

/** Options for Arrow-native, two-dimensional client-side vector tiling. */
export type ArrowTableTileSourceLoaderOptions = DataSourceOptions & {
  /** Geometry selection and clipping/simplification options. */
  table?: Pick<
    NonNullable<TableTileSourceLoaderOptions['table']>,
    | 'coordinates'
    | 'maxZoom'
    | 'indexMaxZoom'
    | 'maxPointsPerTile'
    | 'tolerance'
    | 'extent'
    | 'buffer'
  > & {
    /** Geometry column; defaults to GeoParquet's primary column or the sole GeoArrow field. */
    geometryColumn?: string;
  };
};

/** Defaults shared by the metadata loader and runtime source. */
export const ARROW_TABLE_TILE_SOURCE_DEFAULT_OPTIONS = {table: {coordinates: 'local'}} as const;
