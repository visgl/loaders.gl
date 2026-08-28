// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Loader} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Options for the standalone Avro schema loader. */
export type AvroSchemaLoaderOptions = Record<string, never>;

/** Metadata-only loader for standalone Avro JSON schema files. */
export const AvroSchemaLoader = {
  name: 'Apache Avro Schema',
  id: 'avro-schema',
  module: 'parquet',
  version: VERSION,
  extensions: ['avsc'],
  mimeTypes: ['application/vnd.apache.avro+json', 'application/json'],
  category: 'json',
  text: true,
  binary: false,
  dataType: null as unknown,
  batchType: null as never,
  options: {}
} as const satisfies Loader<unknown, never, AvroSchemaLoaderOptions>;
