// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {ShapefileLoaderOptions} from './shapefile-loader';
export {ShapefileFormat, SHPFormat} from './shp-format';
export {ShapefileLoader} from './shapefile-loader';
export type {ShapefileArrowLoaderOptions} from './shapefile-arrow-loader';
export {ShapefileArrowLoader} from './shapefile-arrow-loader';

export type {DBFLoaderOptions} from './dbf-loader';
export {DBFFormat} from './dbf-format';
export {DBFLoader} from './dbf-loader';
export {DBFArrowLoader} from './dbf-arrow-loader';

export type {SHPLoaderOptions} from './shp-loader';
export {SHPLoader} from './shp-loader';

// EXPERIMENTAL
export {BinaryReader as _BinaryReader} from './lib/streaming/binary-reader';
export {BinaryChunkReader as _BinaryChunkReader} from './lib/streaming/binary-chunk-reader';
export {zipBatchIterators as _zipBatchIterators} from './lib/streaming/zip-batch-iterators';

// DEPRECATED EXPORTS
/** @deprecated Use DBFLoader. */
export {DBFWorkerLoader} from './dbf-loader';
/** @deprecated Use DBFArrowLoader. */
export {DBFArrowWorkerLoader} from './dbf-arrow-loader';
/** @deprecated Use SHPLoader. */
export {SHPWorkerLoader} from './shp-loader';
