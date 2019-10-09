import {loadDracoEncoderModule} from './lib/draco-module-loader';
import DRACOBuilder from './lib/draco-builder';

export default {
  name: 'DRACO',
  extensions: ['drc'],
  encode,
  options: {
    pointcloud: false // Set to true if pointcloud (mode: 0, no indices)
    // Draco Compression Parameters
    // method: 'MESH_EDGEBREAKER_ENCODING',
    // speed: [5, 5],
    // quantization: {
    //   POSITION: 10
    // }
  }
};

async function encode(data, options) {
  // Dynamically load draco
  const {draco} = await loadDracoEncoderModule(options);
  const dracoBuilder = new DRACOBuilder(draco);
  try {
    return dracoBuilder.encodeSync(data, options);
  } finally {
    dracoBuilder.destroy();
  }
}
