import transform from 'json-map-transform';
import {STORE} from './store';

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
    default: 3855
  },
  latestVcsWkid: {
    path: 'latestVcsWkid',
    default: 3855
  }
};

const HEIGHT_MODEL_INFO = {
  heightModel: {
    path: 'heightModel',
    default: 'orthometric'
  },
  vertCRS: {
    path: 'vertCRS',
    default: 'WGS_84'
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
    default: [
      {
        doubleSided: true,
        pbrMetallicRoughness: {
          baseColorTexture: {
            textureSetDefinitionId: 0
          },
          metallicFactor: 0
        }
      }
    ]
  },
  textureSetDefinitions: {
    path: 'textureSetDefinitions',
    default: [
      {
        formats: [
          {
            name: '0',
            format: 'jpg'
          },
          {
            name: '0_0_1',
            format: 'dds'
          }
        ]
      }
    ]
  },
  geometryDefinitions: {
    path: 'geometryDefinitions',
    default: [
      {
        geometryBuffers: [
          {
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
              type: 'UInt64',
              component: 1,
              binding: 'per-feature'
            },
            faceRange: {
              type: 'UInt32',
              component: 2,
              binding: 'per-feature'
            }
          },
          {
            compressedAttributes: {
              encoding: 'draco',
              attributes: ['position', 'normal', 'uv0', 'color', 'feature-index']
            }
          }
        ]
      }
    ]
  }
};
