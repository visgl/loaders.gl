import GLTFBuilder from './gltf/gltf-builder';

function encodeSync(json, options) {
  return new GLTFBuilder().encodeSync(json, options);
}

export default {
  name: 'glTF',
  extensions: ['glb'],
  encodeSync,
  binary: true
};
