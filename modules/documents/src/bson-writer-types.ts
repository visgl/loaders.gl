// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BSONFormat} from './bson-format';
import type {BSONWriterOptions} from './bson-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared BSONWriter metadata and defaults. */
export const BSON_WRITER_METADATA = {
  ...BSONFormat,
  name: 'BSON',
  id: 'bson',
  module: 'documents',
  version: VERSION,
  extensions: ['bson'],
  options: {
    bson: {}
  }
} as const satisfies Writer<Record<string, unknown>, never, BSONWriterOptions>;

/** Metadata for encoding with BSONWriter through the core APIs. */
export const BSONWriter = {
  ...BSON_WRITER_METADATA,
  dataType: null as unknown as Record<string, unknown>,
  batchType: null as never,
  options: BSON_WRITER_METADATA.options as BSONWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {BSONWriter} = await import('./bson-writer.js');
    return BSONWriter;
  }
} as const satisfies Writer<Record<string, unknown>, never, BSONWriterOptions>;
