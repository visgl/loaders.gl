const {v4: uuidv4} = require('uuid');

const createSceneServer = (name, layer) => {
  return {
    serviceItemId: uuidv4().replace(/-/gi, ''),
    serviceName: name,
    name,
    currentVersion: '10.7',
    serviceVersion: '1.8',
    supportedBindings: ['REST'],
    layers: [layer]
  };
};

module.exports = createSceneServer;
