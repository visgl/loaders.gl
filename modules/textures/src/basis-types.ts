// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {LoaderOptions} from '@loaders.gl/loader-utils';
import type {TextureFormat} from '@loaders.gl/schema';

/** ASTC block sizes supported by Basis Universal v2.50. */
export type BasisASTCBlockSize =
  | '4x4'
  | '5x4'
  | '5x5'
  | '6x5'
  | '6x6'
  | '8x5'
  | '8x6'
  | '8x8'
  | '10x5'
  | '10x6'
  | '10x8'
  | '10x10'
  | '12x10'
  | '12x12';

/** Source codecs understood by Basis Universal v2.50. */
export type BasisCodec =
  | 'etc1s'
  | 'uastc-ldr-4x4'
  | 'uastc-hdr-4x4'
  | 'astc-hdr-6x6'
  | 'uastc-hdr-6x6'
  | `xuastc-ldr-${BasisASTCBlockSize}`
  | `astc-ldr-${BasisASTCBlockSize}`
  | 'xubc7';

/** Transcode formats supported by Basis Universal. */
export type BasisFormat =
  | 'etc1'
  | 'etc2'
  | 'bc1'
  | 'bc3'
  | 'bc4'
  | 'bc5'
  | 'bc7'
  | 'pvrtc1-4-rgb'
  | 'pvrtc1-4-rgba'
  | `astc-${BasisASTCBlockSize}`
  | 'atc-rgb'
  | 'atc-rgba-interpolated-alpha'
  | 'rgba32'
  | 'rgb565'
  | 'bgr565'
  | 'rgba4444'
  | 'eac-r11'
  | 'eac-rg11'
  | 'bc6h'
  | 'astc-hdr-4x4'
  | 'rgba16f'
  | 'rgb9e5'
  | 'astc-hdr-6x6';

/** Basis format selection that can vary based on whether the source has an alpha channel. */
export type BasisFormatSelection =
  | BasisFormat
  | {
      /** Target used for images containing alpha. */
      alpha: BasisFormat;
      /** Target used for opaque images. */
      noAlpha: BasisFormat;
    };

/** Information discovered from a Basis source before selecting a transcode target. */
export type BasisTextureInfo = {
  /** Codec used by the source texture. */
  codec: BasisCodec;
  /** Whether the source contains HDR pixels. */
  isHDR: boolean;
  /** Whether the source declares an sRGB transfer function. */
  isSRGB: boolean;
  /** Whether the source contains an alpha channel. */
  hasAlpha: boolean;
  /** Source block width in pixels. */
  blockWidth: number;
  /** Source block height in pixels. */
  blockHeight: number;
};

/** Texture features that cannot be represented by a list of texture formats alone. */
export type BasisSupportedTextureFeatures = {
  /** Whether the device supports the HDR profile of ASTC. */
  astcHDR?: boolean;
};

/** Basis output format option, accepting conventional uppercase spellings. */
export type BasisFormatOption = BasisFormat | Uppercase<BasisFormat>;

/** Basis loader output target. */
export type BasisTargetFormat =
  | 'auto'
  | BasisFormatOption
  | {
      /** Target used for images containing alpha. */
      alpha: BasisFormatOption;
      /** Target used for opaque images. */
      noAlpha: BasisFormatOption;
    };

/** Options for the Basis loader. */
export type BasisLoaderOptions = LoaderOptions & {
  /** Basis-specific loader options. */
  basis?: {
    /** Texture formats supported by the target WebGL or WebGPU device. */
    supportedTextureFormats?: TextureFormat[];
    /** Additional target-device capabilities. */
    supportedTextureFeatures?: BasisSupportedTextureFeatures;
    /** Override the URL to the worker bundle. */
    workerUrl?: string;
    /** Source container format. */
    containerFormat?: 'auto' | 'ktx2' | 'basis';
    /** Output target, or automatic source-aware selection. */
    format?: BasisTargetFormat;
  };
};

/** Formats that can be written by the Basis Universal v2.50 encoder. */
export type BasisEncoderFormat = BasisCodec;

/** Image accepted by the Basis writer. */
export type BasisImageData = {
  /** Pixel width. */
  width: number;
  /** Pixel height. */
  height: number;
  /** RGBA8, RGBA16F bit patterns, or RGBA32F pixels. */
  data: Uint8Array | Uint8ClampedArray | Uint16Array | Float32Array;
};
