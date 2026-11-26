// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {VERSION} from './lib/utils/version';
import {GLTFFormat} from './gltf-format';
import type {GLTFWriterOptions} from './gltf-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared GLTFWriter metadata and defaults. */
export const GLTF_WRITER_METADATA = {
  dataType: null as unknown as any,
  batchType: null as never,
  ...GLTFFormat,
  version: VERSION,
  options: {
    gltf: {}
  }
} as const satisfies Writer<any, never, GLTFWriterOptions>;

/** Metadata for encoding with GLTFWriter through the core APIs. */
export const GLTFWriter = {
  ...GLTF_WRITER_METADATA,
  options: GLTF_WRITER_METADATA.options as GLTFWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {GLTFWriter} = await import('./gltf-writer.js');
    return GLTFWriter;
  }
} as const satisfies Writer<any, never, GLTFWriterOptions>;
