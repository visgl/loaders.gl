// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {OBJFormat} from './obj-format';
import type {OBJWriterOptions} from './obj-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared OBJWriter metadata and defaults. */
export const OBJ_WRITER_METADATA = {
  ...OBJFormat,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  version: VERSION,
  options: {
    obj: {}
  },
  text: true
} as const satisfies Writer<Mesh | Table, never, OBJWriterOptions>;

/** Metadata for encoding with OBJWriter through the core APIs. */
export const OBJWriter = {
  ...OBJ_WRITER_METADATA,
  options: OBJ_WRITER_METADATA.options as OBJWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {OBJWriter} = await import('./obj-writer.js');
    return OBJWriter;
  }
} as const satisfies Writer<Mesh | Table, never, OBJWriterOptions>;
