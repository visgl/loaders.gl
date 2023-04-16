// loaders.gl, MIT license

import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {encodeBSONSync} from './lib/encoders/encode-bson';
// import type {Writer} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const BSONWriter: Writer = {
  name: 'BSON',
  id: 'bson',
  module: 'bson',
  version: VERSION,
  extensions: ['bson'],
  options: {
    image: {
      mimeType: 'application/bson'
    }
  },
  async encode(data: Record<string, unknown>, options?: WriterOptions): Promise<ArrayBuffer> {
    return encodeBSONSync(data, {}); // options
  },
  encodeSync(data: Record<string, unknown>, options?: WriterOptions): ArrayBuffer {
    return encodeBSONSync(data, {}); // options
  }
};
