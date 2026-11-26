// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Mesh} from '@loaders.gl/core/schema';
import type {Table} from 'apache-arrow';
import {COPCFormat} from './copc-format';
import type {COPCWriterOptions} from './copc-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared COPCWriter metadata and defaults. */
export const COPC_WRITER_METADATA = {
  ...COPCFormat,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  version: VERSION,
  extensions: ['copc.laz', 'laz'],
  options: {
    copc: {}
  }
} as const satisfies Writer<Mesh | Table, never, COPCWriterOptions>;

/** Metadata for encoding with COPCWriter through the core APIs. */
export const COPCWriter = {
  ...COPC_WRITER_METADATA,
  options: COPC_WRITER_METADATA.options as COPCWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {COPCWriter} = await import('./copc-writer.js');
    return COPCWriter;
  }
} as const satisfies Writer<Mesh | Table, never, COPCWriterOptions>;
