import type {Writer, WriterOptions} from '@loaders.gl/loader-utils';
import {VERSION} from './lib/utils/version';
import encode3DTile from './lib/encoders/encode-3d-tile';

/**
 * Exporter for 3D Tiles
 */
export const Tile3DWriter: Writer<unknown, never, WriterOptions> = {
  name: '3D Tile',
  id: '3d-tiles',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  binary: true,
  options: {
    ['3d-tiles']: {}
  },
  encode: async (tile, options) => encodeSync(tile, options),
  encodeSync
};

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
