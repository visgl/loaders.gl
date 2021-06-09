export const SCENE_SERVER_TEMPLATE = {
  serviceItemId: {
    path: 'serviceItemId'
  },
  serviceName: {
    path: 'layerName'
  },
  name: {
    path: 'layerName'
  },
  currentVersion: {
    path: 'currentVersion',
    default: 10.7
  },
  serviceVersion: {
    path: 'serviceVersion',
    default: '1.7'
  },
  supportedBindings: {
    path: 'supportedBindings',
    default: ['REST']
  },
  layers: {
    path: 'layers0',
    transform: (layers0) => [layers0]
  }
};
