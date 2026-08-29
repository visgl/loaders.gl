// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderWithParser} from '@loaders.gl/loader-utils';
import {AvroSchemaLoader as AvroSchemaLoaderMetadata} from './avro-schema-loader-types';
import {parseAvroSchema} from './lib/parsers/parse-avro-schema';
import type {AvroSchemaLoaderOptions} from './avro-schema-loader-types';

const AvroSchemaLoaderMetadataWithoutPreload = AvroSchemaLoaderMetadata;

/** Loader for standalone Avro `.avsc` JSON schema files. */
export const AvroSchemaLoaderWithParser = {
  ...AvroSchemaLoaderMetadataWithoutPreload,
  async parse(arrayBuffer: ArrayBuffer, _options?: AvroSchemaLoaderOptions) {
    return parseAvroSchema(new TextDecoder().decode(arrayBuffer));
  }
} as const satisfies LoaderWithParser<unknown, never, AvroSchemaLoaderOptions>;
