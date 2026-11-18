// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export {AvroFormat} from './avro-format';
export type {AvroLoaderOptions} from './avro-loader-types';
export {AvroLoader} from './avro-loader-types';
export {AvroWriter} from './avro-writer';
export type {AvroWriterOptions} from './avro-writer';
export {encodeAvroInChunks} from './avro-stream';
export {AvroSchemaLoader} from './avro-schema-loader-types';

export {AvroLoaderWithParser} from '../avro-loader';

export {AvroSchemaLoaderWithParser} from '../avro-schema-loader';

export {type AvroSchema} from '../avro-writer';

export {decompressAvro, compressAvro, type AvroCodec} from './avro-compression';

export {
  parseAvroOCF,
  parseAvroOCFHeader,
  type AvroOCF,
  type AvroOCFBlock,
  type AvroOCFHeader
} from './avro-ocf';

export {
  parseAvro,
  parseAvroFromFile,
  parseAvroFromUrl,
  parseAvroInBatches,
  parseAvroInBatchesFromFile,
  parseAvroInBatchesFromUrl,
  getAvroSchemaFingerprint,
  type AvroParseOptions,
  parseAvroSchema
} from './avro-parser';

export {type AvroSchemaLoaderOptions} from '../avro-schema';
