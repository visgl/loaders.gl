// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import type {ImageDataType} from '@loaders.gl/images';
import {encodeKTX2BasisTexture} from './lib/encoders/encode-ktx2-basis-texture';

/** @todo should be in basis sub-object */
export type KTX2BasisWriterOptions = WriterOptions & {
  ['ktx2-basis-writer']?: {
    useSRGB?: boolean;
    qualityLevel?: number;
    encodeUASTC?: boolean;
    mipmaps?: boolean;
  };
};

/**
 *  Basis Universal Supercompressed GPU Texture.
 *  Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureSetDefinitionFormat.cmn.md
 */
export const KTX2BasisWriter: Writer<ImageDataType, unknown, KTX2BasisWriterOptions> = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
  version: VERSION,

  extensions: ['ktx2'],
  options: {
    ['ktx2-basis-writer']: {
      useSRGB: false,
      qualityLevel: 10,
      encodeUASTC: false,
      mipmaps: false
    }
  },

  encode: encodeKTX2BasisTexture
};
