import {SceneLayer3D} from '@loaders.gl/tiles-3d/i3s';
import {randomUUID} from 'node:crypto';

/**
 * Create `/SceneServer` response
 * @param name - service name, custom user-friendly name of the service
 * @param layer - I3S layer JSON
 * @returns reponse JSON for `/SceneServer` route
 */
export const createSceneServer = (name: string, layer: SceneLayer3D) => {
  return {
    serviceItemId: randomUUID().replace(/-/gi, ''),
    serviceName: name,
    name,
    currentVersion: '10.7',
    serviceVersion: '1.8',
    supportedBindings: ['REST'],
    layers: [layer]
  };
};
