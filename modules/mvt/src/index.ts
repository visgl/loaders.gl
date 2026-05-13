// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// TileJSONLoader

export {TileJSONFormat} from './tilejson-format';
export {TileJSONLoader} from './tilejson-loader';
export type {TileJSONLoaderOptions} from './tilejson-loader';
export type {TileJSON, TileJSONOptions} from './lib/parse-tilejson';
export {parseTileJSON} from './lib/parse-tilejson';

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

// MVTWriter

export {MVTWriter} from './mvt-writer';
export type {MVTWriterOptions} from './lib/encode-mvt';

// MVTSourceLoader

export {MVTSourceLoader} from './mvt-source-loader';
export {MVTTileSource} from './mvt-source-loader';
export type {MVTSourceLoaderOptions} from './mvt-source-loader';

// TableTileSourceLoader (dynamically tiles a table)

export {TableTileSourceLoader, TableVectorTileSource} from './table-tile-source-loader';
export type {TableTileSourceLoaderOptions} from './table-tile-source-loader';

// DEPRECATED EXPORTS
/** @deprecated Use MVTLoader. */
export {MVTWorkerLoader} from './mvt-loader';
