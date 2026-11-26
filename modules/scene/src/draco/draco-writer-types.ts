// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from './lib/utils/version';
import {DracoFormat} from './draco-format';
import type {DracoWriterInput, DracoWriterOptions} from './draco-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

const DEFAULT_DRACO_WRITER_OPTIONS = {
  pointcloud: false, // Set to true if pointcloud (mode: 0, no indices)
  attributeNameEntry: 'name'
  // Draco Compression Parameters
  // method: 'MESH_EDGEBREAKER_ENCODING', // Use draco defaults
  // speed: [5, 5], // Use draco defaults
  // quantization: { // Use draco defaults
  //   POSITION: 10
  // }
};

/** Shared DracoWriter metadata and defaults. */
export const DRACO_WRITER_METADATA = {
  ...DracoFormat,
  name: 'DRACO',
  version: VERSION,
  options: {
    draco: DEFAULT_DRACO_WRITER_OPTIONS
  }
} as const satisfies Writer<DracoWriterInput, unknown, DracoWriterOptions>;

/** Metadata for encoding with DracoWriter through the core APIs. */
export const DracoWriter = {
  ...DRACO_WRITER_METADATA,
  dataType: null as unknown as DracoWriterInput,
  batchType: null as unknown,
  options: DRACO_WRITER_METADATA.options as DracoWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {DracoWriter} = await import('./draco-writer.js');
    return DracoWriter;
  }
} as const satisfies Writer<DracoWriterInput, unknown, DracoWriterOptions>;
