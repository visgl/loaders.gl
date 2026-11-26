// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {PLYFormat} from './ply-format';
import type {PLYWriterOptions} from './ply-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared PLYWriter metadata and defaults. */
export const PLY_WRITER_METADATA = {
  ...PLYFormat,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  version: VERSION,
  options: {
    ply: {}
  },
  text: true
} as const satisfies Writer<Mesh | Table, never, PLYWriterOptions>;

/** Metadata for encoding with PLYWriter through the core APIs. */
export const PLYWriter = {
  ...PLY_WRITER_METADATA,
  options: PLY_WRITER_METADATA.options as PLYWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {PLYWriter} = await import('./ply-writer.js');
    return PLYWriter;
  }
} as const satisfies Writer<Mesh | Table, never, PLYWriterOptions>;
