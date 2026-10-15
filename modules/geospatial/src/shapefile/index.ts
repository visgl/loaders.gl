// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {ShapefileLoaderOptions} from './shapefile-loader-types';
export {ShapefileFormat, SHPFormat} from './shp-format';
export {ShapefileLoader} from './shapefile-loader-types';

export type {DBFLoaderOptions} from './dbf-loader-types';
export {DBFFormat} from './dbf-format';
export {DBFLoader} from './dbf-loader-types';

export type {SHPLoaderOptions} from './shp-loader-types';
export {SHPLoader} from './shp-loader-types';

// EXPERIMENTAL
export {BinaryReader as _BinaryReader} from './lib/streaming/binary-reader';
export {BinaryChunkReader as _BinaryChunkReader} from './lib/streaming/binary-chunk-reader';
export {zipBatchIterators as _zipBatchIterators} from './lib/streaming/zip-batch-iterators';

// DEPRECATED EXPORTS
/** @deprecated Use DBFLoader. */
export {DBFWorkerLoader} from './dbf-loader-types';
/** @deprecated Use SHPLoader. */
export {SHPWorkerLoader} from './shp-loader-types';
