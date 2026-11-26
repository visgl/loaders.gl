// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {BinaryReader as _BinaryReader} from './lib/streaming/binary-reader';
export {BinaryChunkReader as _BinaryChunkReader} from '@loaders.gl/core/loader-utils';
export {zipBatchIterators as _zipBatchIterators} from './lib/streaming/zip-batch-iterators';
export {
  parseShapefileToArrow,
  parseShapefileToArrowInBatches,
  SHAPEFILE_HEADER_KEY
} from './shapefile-arrow-loader';
export type {ShapefileLoaderOptions} from './shapefile-loader';
export type {DBFLoaderOptions} from './dbf-loader';
export type {SHPLoaderOptions} from './shp-loader';
