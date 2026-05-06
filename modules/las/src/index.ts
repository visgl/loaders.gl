// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASLoader

export {LASFormat} from './las-format';

export type {LASLoaderOptions} from './las-loader';

export type {LASWriterOptions} from './las-writer';
export {LASWriter} from './las-writer';

// Export the laz-perf based loader as default LASLoader until we have done more testing
export {LAZPerfLoader as LASLoader} from './lazperf-loader';

// Implementation specific loaders, for bench marking and testing
export {LAZPerfLoader} from './lazperf-loader';
export {LAZRsLoader} from './laz-rs-loader';
export {TypeScriptLASLoader} from './typescript-loader';
export {decodeLAZFileInBatches} from './lib/typescript/parse-las';
export {
  NeedsMoreData,
  createLAZChunkDecoder,
  createLAZChunkEncoder,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  encodeLAZChunk
} from '@loaders.gl/loader-utils';
export type {
  FeedableLAZChunkDecoder,
  FeedableLAZChunkEncoder,
  LAZChunkDecoderOptions,
  LAZChunkMetadata
} from '@loaders.gl/loader-utils';

// DEPRECATED EXPORTS
/** @deprecated Use LASLoader. */
export {LASWorkerLoader} from './las-loader';
