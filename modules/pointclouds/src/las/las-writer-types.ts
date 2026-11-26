// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {LASFormat} from './las-format';
import type {LASWriterOptions} from './las-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared LASWriter metadata and defaults. */
export const LAS_WRITER_METADATA = {
  ...LASFormat,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  version: VERSION,
  extensions: ['las', 'laz'],
  options: {
    las: {}
  }
} as const satisfies Writer<Mesh | Table, never, LASWriterOptions>;

/** Metadata for encoding with LASWriter through the core APIs. */
export const LASWriter = {
  ...LAS_WRITER_METADATA,
  options: LAS_WRITER_METADATA.options as LASWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {LASWriter} = await import('./las-writer.js');
    return LASWriter;
  }
} as const satisfies Writer<Mesh | Table, never, LASWriterOptions>;
