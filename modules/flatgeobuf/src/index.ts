// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {FlatGeobufFormat} from '@loaders.gl/geospatial/flatgeobuf/index';
export {FLATGEOBUF_TABLE_QUERY_CAPABILITIES} from '@loaders.gl/geospatial/flatgeobuf/index';

export type {FlatGeobufLoaderOptions} from '@loaders.gl/geospatial/flatgeobuf/index';
export {FlatGeobufLoader} from '@loaders.gl/geospatial/flatgeobuf/index';

export type {
  FlatGeobufReadOptions,
  FlatGeobufSourceExplain,
  FlatGeobufSourceLoaderOptions
} from '@loaders.gl/geospatial/flatgeobuf/index';
export {
  FlatGeobufSourceLoader,
  FlatGeobufSourceLoader as _FlatGeobufSourceLoader,
  FlatGeobufVectorSource
} from '@loaders.gl/geospatial/flatgeobuf/index';

// DEPRECATED EXPORTS
/** @deprecated Use FlatGeobufLoader. */
export {FlatGeobufWorkerLoader} from '@loaders.gl/geospatial/flatgeobuf/index';
