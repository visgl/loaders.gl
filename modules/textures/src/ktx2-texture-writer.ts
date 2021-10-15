import type {Writer} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import {encodeKTX2} from './lib/encoders/encode-ktx2';

/**
 * KTX2 Texture Container Exporter
 */
export const KTX2TextureWriter = {
  name: 'KTX2 Texture Container',
  id: 'ktx2',
  module: 'textures',
  version: VERSION,

  extensions: ['ktx2'],
  options: {
    useSRGB: false,
    qualityLevel: 10,
    encodeUASTC: false,
    mipmaps: false
  },

  encode: encodeKTX2
};

// TYPE TESTS - TODO find a better way than exporting junk
export const _TypecheckKTX2TextureWriter: Writer = KTX2TextureWriter;
