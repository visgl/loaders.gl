// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TileJSONLoader

export {TileJSONFormat} from './tilejson-format';
export {TileJSONLoader} from './tilejson-loader';
export type {TileJSONLoaderOptions} from './tilejson-loader';
export type {TileJSON, TileJSONOptions} from './lib/parse-tilejson';
export {parseTileJSON} from './lib/parse-tilejson';
export type {
  TileJSONMetadata,
  TileJSONVectorLayer,
  Tilestats,
  TilestatsLayer,
  TilestatsLayerAttribute
} from './tilejson-zod-schema';

// MapStyleLoader

export {MapStyleFormat} from './map-style-format';
export {MapStyleLoader} from './map-style-loader';
export {MapStyleSchema, ResolvedMapStyleSchema} from './map-style-schema';
export {
  resolveMapStyle,
  type MapStyle,
  type MapStyleLayer,
  type MapStyleLoadOptions,
  type MapStyleSource,
  type ResolvedMapStyle
} from './map-style';

// MVTLoader

export {MVTFormat} from './mvt-format';
export {MVTLoader} from './mvt-loader';
export type {MVTLoaderOptions} from './mvt-loader';
export {MVTGeoJSONLoader} from './mvt-geojson-loader-types';
export type {MVTGeoJSONLoaderOptions} from './mvt-geojson-loader-types';
export type {MVTGeoJSONFeature, MVTGeoJSONTable} from './lib/types';

// MVTWriter

export {MVTWriter} from './mvt-writer';
export type {MVTWriterOptions} from './lib/encode-mvt';

// MVTSourceLoader

export {MVTTileSource} from './mvt-source-loader';
export type {MVTSourceLoaderOptions} from './mvt-source-loader';

// TableTileLoader (dynamically tiles a table)

export {TableTileLoader, TableVectorTileSource} from './table-tile-source-loader';
export type {TableTileSourceLoaderOptions} from './table-tile-source-loader';

export {ArrowTableTileLoader} from './arrow-table-tile-source-loader-types';
export type {ArrowTableVectorTileSource} from './arrow-table-tile-source-loader';
export type {
  ArrowTableTileSourceLoaderOptions,
  ArrowTableTileSourceInput
} from './arrow-table-tile-source-types';

export {MVTLoaderWithParser} from './mvt-loader-with-parser';
