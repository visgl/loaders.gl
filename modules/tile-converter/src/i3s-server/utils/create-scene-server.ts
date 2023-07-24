import {SceneLayer3D} from '@loaders.gl/i3s';
import {v4 as uuidv4} from 'uuid';

/**
 * Create `/SceneServer` response
 * @param name - service name, custom user-friendly name of the service
 * @param layer - I3S layer JSON
 * @returns reponse JSON for `/SceneServer` route
 */
export const createSceneServer = (name: string, layer: SceneLayer3D) => {
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
