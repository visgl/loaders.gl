// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Table} from 'apache-arrow';
import type {Mesh} from '@loaders.gl/core/schema';
import {PCDFormat} from './pcd-format';
import type {PCDWriterOptions} from './pcd-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared PCDWriter metadata and defaults. */
export const PCD_WRITER_METADATA = {
  ...PCDFormat,
  dataType: null as unknown as Mesh | Table,
  batchType: null as never,
  version: VERSION,
  options: {
    pcd: {}
  },
  text: true
} as const satisfies Writer<Mesh | Table, never, PCDWriterOptions>;

/** Metadata for encoding with PCDWriter through the core APIs. */
export const PCDWriter = {
  ...PCD_WRITER_METADATA,
  options: PCD_WRITER_METADATA.options as PCDWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {PCDWriter} = await import('./pcd-writer.js');
    return PCDWriter;
  }
} as const satisfies Writer<Mesh | Table, never, PCDWriterOptions>;
