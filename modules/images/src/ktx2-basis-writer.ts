// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterWithEncoder, WriterOptions} from '@loaders.gl/core/loader-utils';
import type {BasisEncoderFormat, BasisImageData} from './basis-types';
import {encodeKTX2BasisTexture} from './lib/encoders/encode-ktx2-basis-texture';
import {KTX2_BASIS_WRITER_METADATA} from './ktx2-basis-writer-types';

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
  ...KTX2_BASIS_WRITER_METADATA,
  encode: encodeKTX2BasisTexture
} as const satisfies WriterWithEncoder<BasisImageData, unknown, KTX2BasisWriterOptions>;
