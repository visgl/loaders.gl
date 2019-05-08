"use strict";module.export({parseGLTF:()=>parseGLTF,parseGLTFSync:()=>parseGLTFSync});var GLTFParser;module.link('./gltf/gltf-parser',{default(v){GLTFParser=v}},0);// Binary container format for glTF



function parseGLTF(arrayBuffer, options = {}) {
  return new GLTFParser().parse(arrayBuffer, options);
}

function parseGLTFSync(arrayBuffer, options = {}) {
  return new GLTFParser().parseSync(arrayBuffer, options);
}

module.exportDefault({
  name: 'glTF',
  extension: ['gltf', 'glb'],
  text: true,
  binary: true,
  parse: parseGLTF,
  parseSync: parseGLTFSync // Less features
});
