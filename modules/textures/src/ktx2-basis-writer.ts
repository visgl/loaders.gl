// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/loader-utils';
import {KTX2BasisTextureFormat} from './texture-format';
import {VERSION} from './lib/utils/version';
import type {BasisEncoderFormat, BasisImageData} from './basis-types';
import {encodeKTX2BasisTexture} from './lib/encoders/encode-ktx2-basis-texture';

/** Options for the KTX2 Basis writer. */
export type KTX2BasisWriterOptions = WriterOptions & {
  /** Basis encoder options. */
  ['ktx2-basis-writer']?: {
    /** Source codec written to the KTX2 container. */
    format?: BasisEncoderFormat;
    /** Unified encoder quality from 0 to 100. */
    quality?: number;
    /** Unified encoder effort from 0 to 10. */
    effort?: number;
    /** Color interpretation of the input pixels. */
    contentType?: 'linear' | 'srgb' | 'normal-map';
    /** Whether to generate a complete mip chain. */
    mipmaps?: boolean;
    /** Whether to apply Zstandard supercompression where supported. */
    zstd?: boolean;
    /** Absolute-light scale used when converting RGBA8 input to HDR. */
    ldrToHdrNitMultiplier?: number;
  };
};

/**
 *  Basis Universal Supercompressed GPU Texture.
 *  Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureSetDefinitionFormat.cmn.md
 */
export const KTX2BasisWriter = {
  ...KTX2BasisTextureFormat,
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
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
  },

  encode: encodeKTX2BasisTexture
} as const satisfies WriterWithEncoder<BasisImageData, unknown, KTX2BasisWriterOptions>;
