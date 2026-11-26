// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {KTX2BasisTextureFormat} from './texture-format';
import {VERSION} from './lib/utils/version';
import type {BasisImageData} from './basis-types';
import type {KTX2BasisWriterOptions} from './ktx2-basis-writer';
import type {Writer} from '@loaders.gl/core/loader-utils';

/** Shared KTX2BasisWriter metadata and defaults. */
export const KTX2_BASIS_WRITER_METADATA = {
  ...KTX2BasisTextureFormat,
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'images',
  version: VERSION,
  extensions: ['ktx2'],
  mimeTypes: ['image/ktx2'],
  options: {
    ['ktx2-basis-writer']: {
      format: 'etc1s',
      contentType: 'linear',
      mipmaps: false,
      zstd: false,
      ldrToHdrNitMultiplier: 100
    }
  }
} as const satisfies Writer<BasisImageData, unknown, KTX2BasisWriterOptions>;

/** Metadata for encoding with KTX2BasisWriter through the core APIs. */
export const KTX2BasisWriter = {
  ...KTX2_BASIS_WRITER_METADATA,
  dataType: null as unknown as BasisImageData,
  batchType: null as unknown,
  options: KTX2_BASIS_WRITER_METADATA.options as KTX2BasisWriterOptions,
  /** Loads the encoder implementation on demand. */
  async preload() {
    const {KTX2BasisWriter} = await import('./ktx2-basis-writer.js');
    return KTX2BasisWriter;
  }
} as const satisfies Writer<BasisImageData, unknown, KTX2BasisWriterOptions>;
