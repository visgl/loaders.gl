// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, Writer} from '@loaders.gl/core/loader-utils';
import type {PotreeMetadata} from './types/potree-metadata';
import type {Potree2Metadata} from './potree2-types';

// @ts-ignore __VERSION__ is injected by the package build.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared PotreeWriter metadata and defaults. */
export const POTREE_WRITER_METADATA = {
  name: 'Potree metadata',
  id: 'potree',
  module: 'tiles-3d',
  version: VERSION,
  extensions: ['js', 'json'],
  mimeTypes: ['application/json'],
  dataType: null as unknown as PotreeMetadata | Potree2Metadata,
  batchType: null as never,
  options: {}
} as const satisfies Writer<PotreeMetadata | Potree2Metadata, unknown, WriterOptions>;

/** Metadata for encoding with PotreeWriter through the core APIs. */
export const PotreeWriter = {
  ...POTREE_WRITER_METADATA,
  options: POTREE_WRITER_METADATA.options as WriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {PotreeWriter} = await import('./potree-writer.js');
    return PotreeWriter;
  }
} as const satisfies Writer<PotreeMetadata | Potree2Metadata, unknown, WriterOptions>;
