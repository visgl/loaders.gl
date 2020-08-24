// https://cesium.com/docs/cesiumjs-ref-doc/Cesium3DTileset.html
const DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR = 16;

export function convertScreenSpaceErrorToScreenThreshold(tile, coordinates) {
  const lodSelection = [];
  const boundingVolume = tile.boundingVolume;
  const maxScreenThreshold = {
    metricType: 'maxScreenThreshold',
    maxError: (coordinates.mbs[3] * 2 * DEFAULT_MAXIMUM_SCREEN_SPACE_ERROR) / tile.lodMetricValue
  };
  const maxScreenThresholdSQ = {
    metricType: 'maxScreenThresholdSQ',
    maxError: Math.PI * 0.25 * maxScreenThreshold.maxError * maxScreenThreshold.maxError
  };

  if (boundingVolume.constructor.name === 'OrientedBoundingBox') {
    lodSelection.push(maxScreenThresholdSQ);
    lodSelection.push(maxScreenThreshold);
  } else {
    lodSelection.push(maxScreenThreshold);
    lodSelection.push(maxScreenThresholdSQ);
  }

  return lodSelection;
}

export function convertScreenThresholdToScreenSpaceError() {
  return {};
}
