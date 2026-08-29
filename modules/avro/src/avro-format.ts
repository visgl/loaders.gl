// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Format} from '@loaders.gl/loader-utils';

/** Format metadata for Apache Avro Object Container Files. */
export const AvroFormat = {
  name: 'Apache Avro',
  id: 'avro',
  module: 'parquet',
  extensions: ['avro'],
  mimeTypes: ['avro/binary', 'application/avro'],
  category: 'table',
  encoding: 'binary',
  format: 'avro',
  binary: true,
  tests: ['Obj\x01']
} as const satisfies Format;
