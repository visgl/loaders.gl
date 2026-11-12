// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table as ArrowJSTable} from 'apache-arrow';
import {wrapWriterTable} from '../arrow/wrap-writer-table';
import type {WriterWithEncoder} from '@loaders.gl/core/loader-utils';
import type {Table, TableBatch} from '@loaders.gl/core/schema';
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
  async encode(table: Table | ArrowJSTable, options?: ORCWriterOptions) {
    return encodeORC(wrapWriterTable(table), options);
  }
} as const satisfies WriterWithEncoder<Table | ArrowJSTable, TableBatch, ORCWriterOptions>;

export type {ORCWriterOptions} from './lib/encoders/encode-orc';
