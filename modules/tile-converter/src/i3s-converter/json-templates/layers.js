import transform from 'json-map-transform';
import {STORE} from './store';

const PLAIN_GEOMETRY_DEFINITION = {
  offset: 8,
  position: {
    type: 'Float32',
    component: 3
  },
  normal: {
    type: 'Float32',
    component: 3
  },
  uv0: {
    type: 'Float32',
    component: 2
  },
  color: {
    type: 'UInt8',
    component: 4
  },
  featureId: {
    binding: 'per-feature',
    type: 'UInt64',
    component: 1
  },
  faceRange: {
    binding: 'per-feature',
    type: 'UInt32',
    component: 2
  }
};

const COMPRESSED_GEOMETRY_DEFINITION = {
  compressedAttributes: {
    encoding: 'draco',
    // TODO Add "feature-index" to attributes after Draco JS API support feature-index logic.
    attributes: ['position', 'normal', 'uv0', 'color']
  }
};

const SPATIAL_REFERENCE = {
  wkid: {
    path: 'wkid',
    default: 4326
  },
  latestWkid: {
    path: 'latestWkid',
    default: 4326
  },
  vcsWkid: {
    path: 'vcsWkid',
    default: 5773
  },
  latestVcsWkid: {
    path: 'latestVcsWkid',
    default: 5773
  }
};

const HEIGHT_MODEL_INFO = {
  heightModel: {
    path: 'heightModel',
    default: 'gravity_related_height'
  },
  vertCRS: {
    path: 'vertCRS',
    default: 'EGM96_Geoid'
  },
  heightUnit: {
    path: 'heightUnit',
    default: 'meter'
  }
};

const NODE_PAGES = {
  nodesPerPage: {
    path: 'nodesPerPage'
  },
  lodSelectionMetricType: {
    path: 'lodSelectionMetricType',
    default: 'maxScreenThresholdSQ'
  }
};

export const LAYERS = {
  version: {
    path: 'version',
    transform: val => val.toUpperCase()
  },
  id: {
    path: 'id',
    default: 0
  },
  name: {
    path: 'name'
  },
  href: {
    path: 'href',
    default: './layers/0'
  },
  layerType: {
    path: 'layerType',
    default: 'IntegratedMesh'
  },
  spatialReference: {
    path: 'spatialReference',
    transform: val => transform(val, SPATIAL_REFERENCE)
  },
  capabilities: {
    path: 'capabilities',
    default: ['View', 'Query']
  },
  store: {
    path: 'store',
    transform: val => transform(val, STORE)
  },
  heightModelInfo: {
    path: 'heightModelInfo',
    transform: val => transform(val, HEIGHT_MODEL_INFO)
  },
  nodePages: {
    path: 'nodePages',
    transform: val => transform(val, NODE_PAGES)
  },
  materialDefinitions: {
    path: 'materialDefinitions',
    default: []
  },
  textureSetDefinitions: {
    path: 'textureSetDefinitions',
    default: []
  },
  geometryDefinitions: {
    path: 'compressGeometry',
    transform: val => {
      const result = [{}];
      result[0].geometryBuffers = [];
      result[0].geometryBuffers.push(PLAIN_GEOMETRY_DEFINITION);
      if (val) {
        result[0].geometryBuffers.push(COMPRESSED_GEOMETRY_DEFINITION);
      }
      return result;
    },
    default: [
      {
        geometryBuffers: [PLAIN_GEOMETRY_DEFINITION]
      }
    ]
  },
  attributeStorageInfo: {
    path: 'attributeStorageInfo',
    default: []
  },
  fields: {
    path: 'fields',
    default: []
  },
  popupInfo: {
    path: 'popupInfo',
    default: null
  }
};
