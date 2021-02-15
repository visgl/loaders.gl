// GLTF EXTENSION: KHR_techniques_webgl
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl
/* global TextDecoder */
import GLTFScenegraph from '../api/gltf-scenegraph';
import {KHR_TECHNIQUES_WEBGL} from '../gltf-utils/gltf-constants';

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
          // @ts-ignore
          techniques[materialExtension.technique]
        );
        material.technique.values = resolveValues(material.technique, gltfScenegraph);
      }
      gltfScenegraph.removeObjectExtension(material, KHR_TECHNIQUES_WEBGL);
    }

    gltfScenegraph.removeExtension(KHR_TECHNIQUES_WEBGL);
  }
}

export function encode(gltfData, options) {
  // TODO
}

function resolveTechniques({programs = [], shaders = [], techniques = []}, gltfScenegraph) {
  const textDecoder = new TextDecoder();

  shaders.forEach(shader => {
    if (Number.isFinite(shader.bufferView)) {
      shader.code = textDecoder.decode(
        gltfScenegraph.getTypedArrayForBufferView(shader.bufferView)
      );
    } else {
      // TODO: handle URI shader
      throw new Error('KHR_techniques_webgl: no shader code');
    }
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

function resolveValues(technique, gltfScenegraph) {
  const values = Object.assign({}, technique.values);

  // merge values from uniforms
  Object.keys(technique.uniforms || {}).forEach(uniform => {
    if (technique.uniforms[uniform].value && !(uniform in values)) {
      values[uniform] = technique.uniforms[uniform].value;
    }
  });

  // resolve textures
  Object.keys(values).forEach(uniform => {
    if (typeof values[uniform] === 'object' && values[uniform].index !== undefined) {
      // Assume this is a texture
      // TODO: find if there are any other types that can be referenced
      values[uniform].texture = gltfScenegraph.getTexture(values[uniform].index);
    }
  });

  return values;
}
