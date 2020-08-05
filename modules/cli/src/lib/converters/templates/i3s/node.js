import transform from 'json-map-transform';

const LOD_SELECTION = {
  metricType: {
    path: 'metricType'
  },
  maxError: {
    path: 'maxError'
  }
};

const OBB = {
  center: {
    path: 'center'
  },
  halfSize: {
    path: 'halfSize'
  },
  quaternion: {
    path: 'quaternion'
  }
};

const COORDINATES = {
  mbs: {
    path: 'mbs'
  },
  obb: {
    path: 'obb',
    transform: val => transform(val, OBB)
  }
};

const _href = {
  href: {
    path: 'href'
  }
};

const PARENT_NODE = {
  id: {
    path: 'id'
  },
  ..._href,
  ...COORDINATES
};

export const NODE = {
  version: {
    path: 'version'
  },
  id: {
    path: 'id'
  },
  path: {
    path: 'path'
  },
  level: {
    path: 'level'
  },
  ...COORDINATES,
  lodSelection: {
    path: 'lodSelection',
    transform: val => transform(val, LOD_SELECTION),
    default: [
      {
        metricType: 'maxScreenThresholdSQ',
        maxError: 196349.54374999998
      },
      {
        metricType: 'maxScreenThreshold',
        maxError: 999.99999999999994
      }
    ]
  },
  children: {
    path: 'children',
    default: null
  },
  neighbors: {
    path: 'neighbors',
    default: null
  },
  parentNode: {
    path: 'parentNode',
    transform: val => transform(val, PARENT_NODE),
    default: null
  },
  sharedResource: {
    path: 'sharedResource',
    default: null
  },
  featureData: {
    path: 'featureData',
    default: null
  },
  geometryData: {
    path: 'geometryData',
    default: null
  },
  textureData: {
    path: 'textureData',
    default: null
  }
};
