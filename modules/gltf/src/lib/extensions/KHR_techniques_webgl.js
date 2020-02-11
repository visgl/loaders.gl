// GLTF EXTENSION: KHR_techniques_webgl
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl
/* global TextDecoder */
import GLTFScenegraph from '../gltf-scenegraph';
import {KHR_TECHNIQUES_WEBGL} from '../gltf-constants';

function resolveTechniques({programs = [], shaders = [], techniques = []}, gltfScenegraph) {
  const textDecoder = new TextDecoder();

  shaders.forEach(shader => {
    if (Number.isFinite(shader.bufferView)) {
      shader.code = textDecoder.decode(
        gltfScenegraph.getTypedArrayForBufferView(shader.bufferView)
      );
    }

    // TODO: handle URI shader
  });

  programs.forEach(program => {
    program.fragmentShader = shaders[program.fragmentShader];
    program.vertexShader = shaders[program.vertexShader];
  });

  techniques.forEach(technique => {
    technique.program = programs[technique.program];
  });

  return techniques;
}

export function decode(gltfData, options) {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  const extension = gltfScenegraph.getExtension(KHR_TECHNIQUES_WEBGL);
  if (extension) {
    const techniques = resolveTechniques(extension, gltfScenegraph);

    for (const material of json.materials || []) {
      const materialExtension = gltfScenegraph.getObjectExtension(material, KHR_TECHNIQUES_WEBGL);
      if (materialExtension) {
        material.technique = Object.assign(
          {},
          materialExtension,
          techniques[materialExtension.technique]
        );
      }
      gltfScenegraph.removeObjectExtension(material, KHR_TECHNIQUES_WEBGL);
    }

    gltfScenegraph.removeExtension(KHR_TECHNIQUES_WEBGL);
  }
}

export function encode(gltfData, options) {
  // TODO
}
