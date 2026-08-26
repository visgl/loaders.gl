// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {FlatGeobufFormat} from './flatgeobuf-format';
export {FLATGEOBUF_TABLE_QUERY_CAPABILITIES} from './flatgeobuf-table-query-capabilities';

export type {FlatGeobufLoaderOptions} from './flatgeobuf-loader';
export {FlatGeobufLoader} from './flatgeobuf-loader';

export type {
  FlatGeobufReadOptions,
  FlatGeobufSourceExplain,
  FlatGeobufSourceLoaderOptions
} from './flatgeobuf-source-loader';
export {
  FlatGeobufSourceLoader,
  FlatGeobufSourceLoader as _FlatGeobufSourceLoader,
  FlatGeobufVectorSource
} from './flatgeobuf-source-loader';

// DEPRECATED EXPORTS
/** @deprecated Use FlatGeobufLoader. */
export {FlatGeobufWorkerLoader} from './flatgeobuf-loader';
