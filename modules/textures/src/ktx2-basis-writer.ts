import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeKTX2BasisTexture} from './lib/encoders/encode-ktx2-basis-texture';

/**
 *  Basis Universal Supercompressed GPU Texture.
 *  Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/textureSetDefinitionFormat.cmn.md
 */
export const KTX2BasisWriter = {
  name: 'Basis Universal Supercompressed GPU Texture',
  id: 'ktx2-basis-writer',
  module: 'textures',
  version: VERSION,

  extensions: ['ktx2'],
  options: {
    useSRGB: false,
    qualityLevel: 10,
    encodeUASTC: false,
    mipmaps: false
  },

  encode: encodeKTX2BasisTexture
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckKTX2TextureWriter: Writer = KTX2BasisWriter;
