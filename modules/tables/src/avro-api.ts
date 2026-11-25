// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {encodeAvroInChunks} from './avro/lib/encoders/encode-avro';
export {decompressAvro, compressAvro} from './avro/avro-compression';
export {
  parseAvroOCF,
  parseAvroOCFHeader,
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl,
  getAvroSchemaFingerprint
} from './avro/lib/parsers/parse-avro';
export {parseAvroSchema} from './avro/lib/parsers/parse-avro-schema';
export type {
  AvroLoaderOptions,
  AvroWriterOptions,
  AvroSchema,
  AvroCodec,
  AvroOCF,
  AvroOCFBlock,
  AvroOCFHeader,
  AvroParseOptions,
  AvroSchemaLoaderOptions
} from './avro-bundled';
