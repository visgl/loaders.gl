// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/core/schema';
import {VERSION} from './lib/version';
import {TWKBFormat} from './wkt-format';
import type {TWKBWriterOptions} from './twkb-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared TWKBWriter metadata and defaults. */
export const TWKB_WRITER_METADATA = {
  ...TWKBFormat,
  name: 'TWKB (Tiny Well Known Binary)',
  id: 'twkb',
  module: 'geospatial',
  version: VERSION,
  extensions: ['twkb'],
  mimeTypes: ['application/text'],
  options: {
    twkb: {
      hasZ: false,
      hasM: false
    }
  }
} as const satisfies Writer<Geometry, never, TWKBWriterOptions>;

/** Metadata for encoding with TWKBWriter through the core APIs. */
export const TWKBWriter = {
  ...TWKB_WRITER_METADATA,
  dataType: null as unknown as Geometry,
  batchType: null as never,
  options: TWKB_WRITER_METADATA.options as TWKBWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {TWKBWriter} = await import('./twkb-writer.js');
    return TWKBWriter;
  }
} as const satisfies Writer<Geometry, never, TWKBWriterOptions>;
