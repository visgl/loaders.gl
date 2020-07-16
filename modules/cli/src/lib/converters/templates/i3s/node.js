import transform from 'json-map-transform';

const _transform = (val, template) => {
  if (val === undefined) {
    return undefined;
  }
  return transform(val, template);
};

const _lodSelection = {
  metricType: {
    path: 'metricType'
  },
  maxError: {
    path: 'maxError'
  }
};

const _obb = {
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

const _coordinates = {
  mbs: {
    path: 'mbs'
  },
  obb: {
    path: 'obb',
    transform: val => _transform(val, _obb)
  }
};

const _href = {
  href: {
    path: 'href'
  }
};

const _pareNode = {
  id: {
    path: 'id'
  },
  ..._href,
  ..._coordinates
};

export const node = {
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
  ..._coordinates,
  lodSelection: {
    path: 'lodSelection',
    transform: val => _transform(val, _lodSelection),
    default: [
      {
        metricType: 'maxScreenThresholdSQ',
        maxError: 196349.54374999998
      },
      {
        metricType: 'maxScreenThreshold',
        maxError: 499.99999999999994
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
    transform: val => _transform(val, _pareNode),
    default: null
  },
  sharedResource: {
    path: 'sharedResource',
    transform: val => _transform(val, _href),
    default: null
  },
  featureData: {
    path: 'featureData',
    transform: val => _transform(val, _href),
    default: null
  },
  geometryData: {
    path: 'geometryData',
    transform: val => _transform(val, _href),
    default: null
  },
  textureData: {
    path: 'textureData',
    transform: val => _transform(val, _href),
    default: null
  }
};
