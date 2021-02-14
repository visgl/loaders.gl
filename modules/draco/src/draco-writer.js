/** @typedef {import('@loaders.gl/loader-utils').WriterObject} WriterObject */
import {VERSION} from './lib/utils/version';
import {loadDracoEncoderModule} from './lib/draco-module-loader';
import DRACOBuilder from './lib/draco-builder';

/**
 * Exporter for Draco3D compressed geometries
 * @type {WriterObject}
 */
export const DracoWriter = {
  name: 'DRACO',
  id: 'draco',
  module: 'draco',
  version: VERSION,
  extensions: ['drc'],
  encode,
  options: {
    draco: {
      pointcloud: false // Set to true if pointcloud (mode: 0, no indices)
      // Draco Compression Parameters
      // method: 'MESH_EDGEBREAKER_ENCODING',
      // speed: [5, 5],
      // quantization: {
      //   POSITION: 10
      // }
    }
  }
};

async function encode(data, options) {
  // DEPRECATED - remove support for options
  const dracoOptions = (options && options.draco) || options || {};

  // Dynamically load draco
  const {draco} = await loadDracoEncoderModule(options || {});
  const dracoBuilder = new DRACOBuilder(draco);

  try {
    return dracoBuilder.encodeSync(data, dracoOptions);
  } finally {
    dracoBuilder.destroy();
  }
}
