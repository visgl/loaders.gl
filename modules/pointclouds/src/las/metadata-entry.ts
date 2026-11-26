// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {LASLoader} from './las-loader-types';
export {LASFormat} from './las-format';
export type {LASColumnName, LASLoaderOptions} from './las-loader-shared';
export type {LASSourceOptions} from './las-source';
export type {LASExtraBytesWriter, LASWriterOptions, LASWriter} from './las-writer';
export type {
  LASExtendedVariableLengthRecord,
  LASExtraBytesDescriptor,
  LASGeoTIFFKey,
  LASGeoTIFFKeyDirectory,
  LASHeader,
  LASMetadata,
  LASMesh,
  LASVariableLengthRecord,
  LASWaveformPacketDescriptor
} from './lib/las-types';
export type {
  decodeLASWaveformSamples,
  getLASWaveformStorage,
  parseLASWaveformPacketReference,
  readLASWaveformPacket,
  readLASWaveformPackets,
  scaleLASWaveformSamples,
  LASWaveformPacket,
  LASWaveformPacketReference,
  LASWaveformReadOptions,
  LASWaveformStorage
} from './lib/las-waveform';
export type {
  createLASTypedExtraBytesAttributes,
  createLASTypedExtraBytesValue,
  parseLASExtraBytes,
  populateLASTypedExtraBytes,
  LASTypedExtraBytesAttribute,
  LASTypedExtraBytesValue
} from './lib/las-extra-bytes';
export type {decodeLAZFileInBatches} from './lib/typescript/parse-las';
export type {
  NeedsMoreData,
  createLAZChunkDecoder,
  createLAZChunkEncoder,
  decodeLAZChunk,
  decodeLAZChunkInBatches,
  encodeLAZChunk,
  FeedableLAZChunkDecoder,
  FeedableLAZChunkEncoder,
  LAZChunkDecoderOptions,
  LAZChunkMetadata
} from '@loaders.gl/core/loader-utils';
export type {LASCompatibilityLayout} from './lib/las-compatibility';
export type {
  LASLoaderWithParser,
  toPublicLASResult,
  getLASRecordBatches,
  parseLASMetadata
} from './las-loader';
import {LAS_LOADER_METADATA} from './las-loader-shared';

/** Defers the column-oriented LAS parser. */
export const LASColumnLoader = {
  ...LAS_LOADER_METADATA,
  worker: true,
  workerInBatches: true,
  async preload() {
    const implementation = await import('./las-loader.js');
    return implementation.LASColumnLoader;
  }
} as const;
