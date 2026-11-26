// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {AvroFormat} from './avro-format';
export type {AvroLoaderOptions} from './avro-loader-types';
export {AvroLoader} from './avro-loader-types';
export {AvroWriter} from './avro-writer';
export type {AvroWriterOptions} from './avro-writer';
export {encodeAvroInChunks} from './lib/encoders/encode-avro';
export {AvroSchemaLoader} from './avro-schema-loader-types';

export {AvroLoaderWithParser} from './avro-loader';

export {AvroSchemaLoaderWithParser} from './avro-schema-loader';

export {type AvroSchema} from './lib/encoders/encode-avro';

export {decompressAvro, compressAvro, type AvroCodec} from './avro-compression';

export {
  parseAvroOCF,
  parseAvroOCFHeader,
  type AvroOCF,
  type AvroOCFBlock,
  type AvroOCFHeader
} from './lib/parsers/parse-avro';

export {
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl,
  getAvroSchemaFingerprint,
  type AvroParseOptions
} from './lib/parsers/parse-avro';
export {parseAvroSchema} from './lib/parsers/parse-avro-schema';

export type {AvroSchemaLoaderOptions} from './avro-schema-loader-types';
