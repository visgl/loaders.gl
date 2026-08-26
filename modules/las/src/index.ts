// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// LASLoader

export {LASFormat} from './las-format';

export type {LASColumnName, LASLoaderOptions} from './las-loader-types';

export type {LASExtraBytesWriter, LASWriterOptions} from './las-writer';
export {LASWriter} from './las-writer';
export type {
  LASExtendedVariableLengthRecord,
  LASExtraBytesDescriptor,
  LASHeader,
  LASMetadata,
  LASVariableLengthRecord,
  LASWaveformPacketDescriptor
} from './lib/las-types';
export {
  createLASTypedExtraBytesAttributes,
  createLASTypedExtraBytesValue,
  parseLASExtraBytes,
  populateLASTypedExtraBytes
} from './lib/las-extra-bytes';
export type {
  LASTypedExtraBytesAttribute,
  LASTypedExtraBytesValue
} from './lib/las-extra-bytes';

export {LASLoader} from './las-loader-types';
export {LASCOPCLoader} from './las-copc-loader-types';
export {LAZPerfLoader} from './lazperf-loader-types';
export {LAZRsLoader} from './laz-rs-loader-types';
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
export {LASWorkerLoader} from './las-loader-types';
