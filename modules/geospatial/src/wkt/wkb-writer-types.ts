// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {Geometry, Feature} from '@loaders.gl/core/schema';
import {VERSION} from './lib/version';
import {WKBFormat} from './wkt-format';
import type {WKBWriterOptions} from './wkb-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared WKBWriter metadata and defaults. */
export const WKB_WRITER_METADATA = {
  ...WKBFormat,
  name: 'WKB (Well Known Binary)',
  id: 'wkb',
  module: 'geospatial',
  version: VERSION,
  extensions: ['wkb'],
  mimeTypes: ['application/wkb', 'application/octet-stream'],
  options: {
    wkb: {
      hasZ: false,
      hasM: false
    }
  }
} as const satisfies Writer<Geometry | Feature, never, WKBWriterOptions>;

/** Metadata for encoding with WKBWriter through the core APIs. */
export const WKBWriter = {
  ...WKB_WRITER_METADATA,
  dataType: null as unknown as Geometry | Feature,
  batchType: null as never,
  options: WKB_WRITER_METADATA.options as WKBWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {WKBWriter} = await import('./wkb-writer.js');
    return WKBWriter;
  }
} as const satisfies Writer<Geometry | Feature, never, WKBWriterOptions>;
