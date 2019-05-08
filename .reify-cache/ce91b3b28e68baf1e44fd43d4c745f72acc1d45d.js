"use strict";var GLTFBuilder;module.link('./gltf/gltf-builder',{default(v){GLTFBuilder=v}},0);

function encodeSync(json, options) {
  return new GLTFBuilder().encodeSync(json, options);
}

module.exportDefault({
  name: 'glTF',
  extensions: ['glb'],
  encodeSync,
  binary: true
});
