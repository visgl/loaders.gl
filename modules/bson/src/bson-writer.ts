// loaders.gl, MIT license

import {encodeBSONSync} from './lib/encoders/encode-bson';
// import type {Writer} from '@loaders.gl/loader-utils';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

export const BSONWriter = {
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
  encode: encodeBSONSync
};
