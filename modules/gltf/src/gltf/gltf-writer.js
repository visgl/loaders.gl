import GLTFBuilder from './gltf-builder';

function encodeSync(json, options) {
  return new GLTFBuilder().encodeSync(json, options);
}

// TODO - target writer structure not yet clear
export default {
  name: 'GLB',
  extensions: ['glb'],
  encodeSync
};
