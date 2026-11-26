// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {AvroLoader} from './avro-loader-types';
export {AvroSchemaLoader} from './avro-schema-loader-types';
export {AvroFormat} from './avro-format';
export type {AvroLoaderOptions} from './avro-loader-types';
export type {AvroWriterOptions} from './avro-writer';
export type {encodeAvroInChunks} from './lib/encoders/encode-avro';
export type {AvroLoaderWithParser} from './avro-loader';
export type {AvroSchemaLoaderWithParser} from './avro-schema-loader';
export type {AvroSchema} from './lib/encoders/encode-avro';
export type {decompressAvro, compressAvro, AvroCodec} from './avro-compression';
export type {
  parseAvroOCF,
  parseAvroOCFHeader,
  AvroOCF,
  AvroOCFBlock,
  AvroOCFHeader,
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl,
  getAvroSchemaFingerprint,
  AvroParseOptions
} from './lib/parsers/parse-avro';
export type {parseAvroSchema} from './lib/parsers/parse-avro-schema';
export type {AvroSchemaLoaderOptions} from './avro-schema-loader-types';
export {AvroWriter} from './avro-writer-types';
