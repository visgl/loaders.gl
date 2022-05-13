/**
 * https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */

import {Vector3, Matrix3} from '@math.gl/core';
import type {GLTF, GLTFMaterial, GLTFMeshPrimitive} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import {BYTES, COMPONENTS} from '../api/post-process-gltf';
import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';

/** Extension name */
const EXT_MESHOPT_TRANSFORM = 'KHR_texture_transform';

export const name = EXT_MESHOPT_TRANSFORM;

const scratchVector = new Vector3();
const scratchRotationMatrix = new Matrix3();
const scratchScaleMatrix = new Matrix3();

export async function decode(
  gltfData: {
    json: GLTF;
    buffers: {arrayBuffer: ArrayBuffer; byteOffset: number; byteLength: number}[];
  },
  options: GLTFLoaderOptions
) {
  const materials = gltfData.json.materials || [];
  for (let i = 0; i < materials.length; i++) {
    const material = materials[i];
    const extensionData = getExtensionData(material);
    if (extensionData) {
      const matrix = makeTransformationMatrix(extensionData);
      transformPrimitives(gltfData, i, matrix);
    }
  }
}

function getExtensionData(material: GLTFMaterial): any {
  const baseColorTexture = material.pbrMetallicRoughness?.baseColorTexture;
  if (baseColorTexture) {
    return baseColorTexture.extensions?.[EXT_MESHOPT_TRANSFORM];
  }
  const emisiveTexture = material.emissiveTexture;
  if (emisiveTexture) {
    return emisiveTexture.extensions?.[EXT_MESHOPT_TRANSFORM];
  }
  const normalTexture = material.normalTexture;
  if (normalTexture) {
    return normalTexture.extensions?.[EXT_MESHOPT_TRANSFORM];
  }
  const occlusionTexture = material.occlusionTexture;
  if (occlusionTexture) {
    return occlusionTexture.extensions?.[EXT_MESHOPT_TRANSFORM];
  }
  const metallicRoughnessTexture = material.pbrMetallicRoughness?.metallicRoughnessTexture;
  if (metallicRoughnessTexture) {
    return metallicRoughnessTexture.extensions?.[EXT_MESHOPT_TRANSFORM];
  }
  return null;
}

function transformPrimitives(
  gltfData: {
    json: GLTF;
    buffers: {arrayBuffer: ArrayBuffer; byteOffset: number; byteLength: number}[];
  },
  materialIndex: number,
  transformationMatrix: Matrix3
) {
  const meshes = gltfData.json.meshes || [];
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives) {
      const material = primitive.material;
      if (Number.isFinite(material) && materialIndex === material) {
        transformPrimitive(gltfData, primitive, transformationMatrix);
      }
    }
  }
}

function transformPrimitive(
  gltfData: {
    json: GLTF;
    buffers: {arrayBuffer: ArrayBuffer; byteOffset: number; byteLength: number}[];
  },
  primitive: GLTFMeshPrimitive,
  transformationMatrix: Matrix3
) {
  const texCoordAccessor = primitive.attributes.TEXCOORD_0;
  if (Number.isFinite(texCoordAccessor)) {
    const accessor = gltfData.json.accessors?.[texCoordAccessor];
    if (accessor && accessor.bufferView) {
      const bufferView = gltfData.json.bufferViews?.[accessor.bufferView];
      if (bufferView) {
        const {arrayBuffer, byteOffset: bufferByteOffset} = gltfData.buffers[bufferView.buffer];
        const byteOffset =
          (bufferByteOffset || 0) + (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
        const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
        const bytes = BYTES[accessor.componentType];
        const components = COMPONENTS[accessor.type];
        const elementAddressScale = bufferView.byteStride || bytes * components;
        const result = new Float32Array(length);
        for (let i = 0; i < accessor.count; i++) {
          const uv = new ArrayType(arrayBuffer, byteOffset + i * elementAddressScale, 2);
          scratchVector.set(uv[0], uv[1], 1);
          scratchVector.transformByMatrix3(transformationMatrix);
          result.set([scratchVector[0], scratchVector[1]], i * components);
        }
        accessor.value = result;
        accessor.componentType = 5126;
        gltfData.buffers.push({
          arrayBuffer: result.buffer,
          byteOffset: 0,
          byteLength: result.buffer.byteLength
        });
        bufferView.buffer = gltfData.buffers.length - 1;
        bufferView.byteLength = result.buffer.byteLength;
        bufferView.byteOffset = 0;
        delete bufferView.byteStride;
      }
    }
  }
}

function makeTransformationMatrix(extensionData: {
  offset: [number, number];
  rotation: number;
  scale: [number, number];
}) {
  const {offset = [0, 0], rotation = 0, scale = [1, 1]} = extensionData;
  const translationMatirx = new Matrix3().set(1, 0, 0, 0, 1, 0, offset[0], offset[1], 1);
  const rotationMatirx = scratchRotationMatrix.set(
    Math.cos(rotation),
    Math.sin(rotation),
    0,
    -Math.sin(rotation),
    Math.cos(rotation),
    0,
    0,
    0,
    1
  );
  const scaleMatrix = scratchScaleMatrix.set(scale[0], 0, 0, 0, scale[1], 0, 0, 0, 1);
  return translationMatirx.multiplyRight(rotationMatirx).multiplyRight(scaleMatrix);
}
