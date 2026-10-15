// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export type {ShapefileLoaderOptions} from '@loaders.gl/geospatial/shapefile/index';
export {ShapefileFormat, SHPFormat} from '@loaders.gl/geospatial/shapefile/index';
export {ShapefileLoader} from '@loaders.gl/geospatial/shapefile/index';

export type {DBFLoaderOptions} from '@loaders.gl/geospatial/shapefile/index';
export {DBFFormat} from '@loaders.gl/geospatial/shapefile/index';
export {DBFLoader} from '@loaders.gl/geospatial/shapefile/index';

export type {SHPLoaderOptions} from '@loaders.gl/geospatial/shapefile/index';
export {SHPLoader} from '@loaders.gl/geospatial/shapefile/index';

// EXPERIMENTAL
export {_BinaryReader} from '@loaders.gl/geospatial/shapefile/index';
export {_BinaryChunkReader} from '@loaders.gl/geospatial/shapefile/index';
export {_zipBatchIterators} from '@loaders.gl/geospatial/shapefile/index';

// DEPRECATED EXPORTS
/** @deprecated Use DBFLoader. */
export {DBFWorkerLoader} from '@loaders.gl/geospatial/shapefile/index';
/** @deprecated Use SHPLoader. */
export {SHPWorkerLoader} from '@loaders.gl/geospatial/shapefile/index';
