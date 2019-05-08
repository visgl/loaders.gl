"use strict";var DRACOBuilder;module.link('./draco-builder',{default(v){DRACOBuilder=v}},0);

function encodeSync(data, options) {
  const dracoBuilder = new DRACOBuilder();
  try {
    return dracoBuilder.encodeSync(data, options);
  } finally {
    dracoBuilder.destroy();
  }
}

module.exportDefault({
  name: 'DRACO',
  extensions: ['drc'],
  encodeSync,
  options: {
    pointcloud: false // Set to true if pointcloud (mode: 0, no indices)
    // Draco Compression Parameters
    // method: 'MESH_EDGEBREAKER_ENCODING',
    // speed: [5, 5],
    // quantization: {
    //   POSITION: 10
    // }
  }
});
