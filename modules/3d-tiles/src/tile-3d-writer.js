/** @typedef {import('@loaders.gl/loader-utils').WriterObject} WriterObject */
import {VERSION} from './lib/utils/version';
import encode3DTile from './lib/encoders/encode-3d-tile';

/**
 * Exporter for 3D Tiles
 * @type {WriterObject}
 */
export const Tile3DWriter = {
  name: '3D Tile',
  id: '3d-tiles',
  module: '3d-tiles',
  version: VERSION,
  extensions: ['cmpt', 'pnts', 'b3dm', 'i3dm'],
  mimeTypes: ['application/octet-stream'],
  encodeSync,
  binary: true,
  options: {
    ['3d-tiles']: {}
  }
};

function encodeSync(tile, options) {
  return encode3DTile(tile, options);
}
