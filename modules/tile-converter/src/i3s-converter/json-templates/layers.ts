import transform from 'json-map-transform';
import {STORE} from './store';

const SPATIAL_REFERENCE = () => ({
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
});

const HEIGHT_MODEL_INFO = () => ({
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
});

const NODE_PAGES = () => ({
  nodesPerPage: {
    path: 'nodesPerPage'
  },
  lodSelectionMetricType: {
    path: 'lodSelectionMetricType',
    default: 'maxScreenThresholdSQ'
  }
});

const FULL_EXTENT = () => ({
  xmin: {
    path: 'xmin'
  },
  ymin: {
    path: 'ymin'
  },
  xmax: {
    path: 'xmax'
  },
  ymax: {
    path: 'ymax'
  },
  zmin: {
    path: 'zmin'
  },
  zmax: {
    path: 'zmax'
  }
});

export const LAYERS = () => ({
  version: {
    path: 'version',
    transform: (val) => val.toUpperCase()
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
    transform: (val) => transform(val, SPATIAL_REFERENCE())
  },
  capabilities: {
    path: 'capabilities',
    default: ['View', 'Query']
  },
  store: {
    path: 'store',
    transform: (val) => transform(val, STORE)
  },
  fullExtent: {
    path: 'fullExtent',
    transform: (val) => transform(val, FULL_EXTENT())
  },
  heightModelInfo: {
    path: 'heightModelInfo',
    transform: (val) => transform(val, HEIGHT_MODEL_INFO())
  },
  nodePages: {
    path: 'nodePages',
    transform: (val) => transform(val, NODE_PAGES())
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
    path: 'geometryDefinitions',
    default: []
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
});
