import DRACOBuilder from './draco-builder';

function encodeSync(data, options) {
  const dracoBuilder = new DRACOBuilder();
  try {
    return dracoBuilder.encodeSync(data, options);
  } finally {
    dracoBuilder.destroy();
  }
}

export default {
  name: 'DRACO',
  extension: 'drc',
  encodeSync,
  options: {
    pointcloud: false // Set to true if pointcloud (mode: 0, no indices)
  }
};
