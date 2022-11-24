// GLTF EXTENSION: KHR_techniques_webgl
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl

import type {GLTF} from '../../types/gltf-types';

import GLTFScenegraph from '../../api/gltf-scenegraph';

const KHR_TECHNIQUES_WEBGL = 'KHR_techniques_webgl';

export const name = KHR_TECHNIQUES_WEBGL;

export async function decode(gltfData: {json: GLTF}): Promise<void> {
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const {json} = gltfScenegraph;

  const extension = gltfScenegraph.getExtension(KHR_TECHNIQUES_WEBGL);
  if (extension) {
    const techniques = resolveTechniques(extension, gltfScenegraph);

    for (const material of json.materials || []) {
      const materialExtension = gltfScenegraph.getObjectExtension(material, KHR_TECHNIQUES_WEBGL);
      if (materialExtension) {
        // @ts-ignore TODO
        material.technique = Object.assign(
          {},
          materialExtension,
          // @ts-ignore
          techniques[materialExtension.technique]
        );
        // @ts-ignore TODO
        material.technique.values = resolveValues(material.technique, gltfScenegraph);
      }
      gltfScenegraph.removeObjectExtension(material, KHR_TECHNIQUES_WEBGL);
    }

    // Remove the top-level extension
    gltfScenegraph.removeExtension(KHR_TECHNIQUES_WEBGL);
  }
}
// eslint-disable-next-line
export async function encode(gltfData, options): Promise<void> {
  // TODO
}

function resolveTechniques(
  techniquesExtension: {[key: string]: any},
  // programs: {[key: string]: any}[],
  // shaders: {[key: string]: any}[],
  // techniques: {[key: string]: any}[]
  gltfScenegraph
) {
  const {programs = [], shaders = [], techniques = []} = techniquesExtension;
  const textDecoder = new TextDecoder();

  shaders.forEach((shader) => {
    if (Number.isFinite(shader.bufferView)) {
      shader.code = textDecoder.decode(
        gltfScenegraph.getTypedArrayForBufferView(shader.bufferView)
      );
    } else {
      // TODO: handle URI shader
      throw new Error('KHR_techniques_webgl: no shader code');
    }
  });

  programs.forEach((program) => {
    program.fragmentShader = shaders[program.fragmentShader];
    program.vertexShader = shaders[program.vertexShader];
  });

  techniques.forEach((technique) => {
    technique.program = programs[technique.program];
  });

  return techniques;
}

function resolveValues(technique, gltfScenegraph) {
  const values = Object.assign({}, technique.values);

  // merge values from uniforms
  Object.keys(technique.uniforms || {}).forEach((uniform) => {
    if (technique.uniforms[uniform].value && !(uniform in values)) {
      values[uniform] = technique.uniforms[uniform].value;
    }
  });

  // resolve textures
  Object.keys(values).forEach((uniform) => {
    if (typeof values[uniform] === 'object' && values[uniform].index !== undefined) {
      // Assume this is a texture
      // TODO: find if there are any other types that can be referenced
      values[uniform].texture = gltfScenegraph.getTexture(values[uniform].index);
    }
  });

  return values;
}
