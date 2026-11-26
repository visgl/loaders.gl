// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {GLB} from './lib/types/glb-types';
import {VERSION} from './lib/utils/version';
import {GLBFormat} from './gltf-format';
import type {GLBWriterOptions} from './glb-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared GLBWriter metadata and defaults. */
export const GLB_WRITER_METADATA = {
  ...GLBFormat,
  version: VERSION,
  options: {
    glb: {}
  }
} as const satisfies Writer<GLB, never, GLBWriterOptions>;

/** Metadata for encoding with GLBWriter through the core APIs. */
export const GLBWriter = {
  ...GLB_WRITER_METADATA,
  dataType: null as unknown as GLB,
  batchType: null as never,
  options: GLB_WRITER_METADATA.options as GLBWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {GLBWriter} = await import('./glb-writer.js');
    return GLBWriter;
  }
} as const satisfies Writer<GLB, never, GLBWriterOptions>;
