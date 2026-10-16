// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder} from '@loaders.gl/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/schema';
import {ORCFormat} from './orc-format';
import {encodeORC, type ORCWriterOptions} from './lib/encoders/encode-orc';

// __VERSION__ is injected by babel-plugin-version-inline.
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Writer for Apache ORC files. */
export const ORCWriter = {
  ...ORCFormat,
  version: VERSION,
  options: {orc: {}},
  async encode(table: Table, options?: ORCWriterOptions) {
    return encodeORC(table, options);
  }
} as const satisfies WriterWithEncoder<Table, TableBatch, ORCWriterOptions>;

export type {ORCWriterOptions} from './lib/encoders/encode-orc';
