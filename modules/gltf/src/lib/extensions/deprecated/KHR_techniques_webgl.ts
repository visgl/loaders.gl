// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// GLTF EXTENSION: KHR_techniques_webgl
// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_techniques_webgl

import type {GLTFWithBuffers} from '../../types/gltf-types';

import {GLTFIterator} from '../../api/gltf-iterator';
import {getTypedArrayForBufferView} from '../../gltf-utils/get-typed-array';

const KHR_TECHNIQUES_WEBGL = 'KHR_techniques_webgl';

export const name = KHR_TECHNIQUES_WEBGL;

export async function decode(gltfData: GLTFWithBuffers): Promise<void> {
  const iterator = new GLTFIterator(gltfData);

  const extension = iterator.getExtension(KHR_TECHNIQUES_WEBGL);
  if (extension) {
    const techniques = resolveTechniques(extension, iterator);

    for (const material of iterator.materials) {
      const materialExtension = material.getExtension<any>(KHR_TECHNIQUES_WEBGL);
      if (materialExtension) {
        // @ts-ignore TODO
        (material.data as any).technique = Object.assign(
          {},
          materialExtension,
          // @ts-ignore
          techniques[materialExtension.technique]
        );
        // @ts-ignore TODO
        (material.data as any).technique.values = resolveValues(
          (material.data as any).technique,
          iterator
        );
      }
      material.removeExtension(KHR_TECHNIQUES_WEBGL);
    }

    // Remove the top-level extension
    iterator.removeExtension(KHR_TECHNIQUES_WEBGL);
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
  iterator: GLTFIterator
) {
  const {programs = [], shaders = [], techniques = []} = techniquesExtension;
  const textDecoder = new TextDecoder();

  shaders.forEach(shader => {
    if (Number.isFinite(shader.bufferView)) {
      shader.code = textDecoder.decode(
        getTypedArrayForBufferView(iterator.data, iterator.gltf.buffers, shader.bufferView)
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

function resolveValues(technique, iterator: GLTFIterator) {
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
      values[uniform].texture = iterator.resolveTexture(
        values[uniform].index,
        `technique.values.${uniform}.index`
      );
    }
  });

  return values;
}
