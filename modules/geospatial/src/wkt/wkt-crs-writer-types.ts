// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WKTCRSAst} from '@math.gl/geospatial/crs';
import {VERSION} from './lib/version';
import {WKTCRSFormat} from './wkt-format';
import type {WKTCRSWriterOptions} from './wkt-crs-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared WKTCRSWriter metadata and defaults. */
export const WKTCRS_WRITER_METADATA = {
  ...WKTCRSFormat,
  name: 'WKT CRS (Well-Known Text Coordinate Reference System)',
  id: 'wkt-crs',
  module: 'wkt-crs',
  version: VERSION,
  worker: true,
  extensions: [],
  mimeTypes: ['text/plain'],
  text: true,
  options: {
    'wkt-crs': {}
  }
} as const satisfies Writer<WKTCRSAst, never, WKTCRSWriterOptions>;

/** Metadata for encoding with WKTCRSWriter through the core APIs. */
export const WKTCRSWriter = {
  ...WKTCRS_WRITER_METADATA,
  dataType: null as unknown as WKTCRSAst,
  batchType: null as never,
  options: WKTCRS_WRITER_METADATA.options as WKTCRSWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {WKTCRSWriter} = await import('./wkt-crs-writer.js');
    return WKTCRSWriter;
  }
} as const satisfies Writer<WKTCRSAst, never, WKTCRSWriterOptions>;
