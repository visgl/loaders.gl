// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Explicit parser subpath for applications and table-format adapters. */
export {
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl,
  parseAvroOCF,
  parseAvroOCFHeader,
  getAvroSchemaFingerprint
} from './lib/parsers/parse-avro';
export type {
  AvroOCF,
  AvroOCFBlock,
  AvroOCFHeader,
  AvroParseOptions,
  AvroSchema
} from './lib/parsers/parse-avro';
export {parseAvroSchema} from './lib/parsers/parse-avro-schema';
