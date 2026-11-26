// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry} from '@loaders.gl/core/schema';
import {VERSION} from './lib/version';
import {WKTFormat} from './wkt-format';
import type {WKTWriterOptions} from './wkt-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared WKTWriter metadata and defaults. */
export const WKT_WRITER_METADATA = {
  ...WKTFormat,
  name: 'WKT (Well Known Text)',
  id: 'wkt',
  module: 'geospatial',
  version: VERSION,
  extensions: ['wkt'],
  mimeTypes: ['application/wkt', 'text/plain'],
  text: true,
  options: {
    wkt: {}
  }
} as const satisfies Writer<Geometry, never, WKTWriterOptions>;

/** Metadata for encoding with WKTWriter through the core APIs. */
export const WKTWriter = {
  ...WKT_WRITER_METADATA,
  dataType: null as unknown as Geometry,
  batchType: null as never,
  options: WKT_WRITER_METADATA.options as WKTWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {WKTWriter} = await import('./wkt-writer.js');
    return WKTWriter;
  }
} as const satisfies Writer<Geometry, never, WKTWriterOptions>;
