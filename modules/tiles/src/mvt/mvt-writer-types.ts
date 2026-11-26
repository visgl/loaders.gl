// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {MVTFormat} from './mvt-format';
import type {MVTWriterOptions} from './lib/encode-mvt';
import type {Writer} from '@loaders.gl/core/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** Shared MVTWriter metadata and defaults. */
export const MVT_WRITER_METADATA = {
  ...MVTFormat,
  version: VERSION,
  binary: true,
  options: {
    mvt: {
      layerName: 'geojsonLayer',
      version: 1,
      extent: 4096
    }
  }
} as const satisfies Writer<any, never, MVTWriterOptions>;

/** Metadata for encoding with MVTWriter through the core APIs. */
export const MVTWriter = {
  ...MVT_WRITER_METADATA,
  dataType: null as unknown as any,
  batchType: null as never,
  options: MVT_WRITER_METADATA.options as MVTWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {MVTWriter} = await import('./mvt-writer.js');
    return MVTWriter;
  }
} as const satisfies Writer<any, never, MVTWriterOptions>;
