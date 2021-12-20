/**
 * https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */

import {Vector3, Matrix3} from '@math.gl/core';
import type {GLTF, GLTFMaterial, GLTFMeshPrimitive} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import {BYTES, COMPONENTS} from '../api/post-process-gltf';
import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';
import {TypedArray} from '@loaders.gl/schema';

/** Extension name */
const EXT_MESHOPT_TRANSFORM = 'KHR_texture_transform';

export const name = EXT_MESHOPT_TRANSFORM;

const scratchVector = new Vector3();
const scratchMatrix = new Matrix3();

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
      if (Number.isFinite(material)) {
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
        const buffer = new Uint8Array(gltfData.buffers[bufferView.buffer].arrayBuffer);
        const byteOffset = bufferView.byteOffset || 0;
        const bytes = BYTES[accessor.componentType];
        const components = COMPONENTS[accessor.type];
        const {ArrayType} = getAccessorArrayTypeAndLength(accessor, bufferView);
        const elementAddressScale = bufferView.byteStride || bytes * components;
        for (let i = 0; i < 19317; i++) {
          const uv = new ArrayType(
            buffer.subarray(
              i * elementAddressScale + byteOffset,
              i * elementAddressScale + byteOffset + bytes
            )
          );
          const normalizationParams = getNormalizationParams(accessor.componentType, bytes);
          scratchVector.set(...normalizeToVector3(uv, normalizationParams));
          scratchVector.transformByMatrix3(transformationMatrix);
          const result = denormalizeVector3(scratchVector, normalizationParams);
          uv.set(result);
          buffer.set(uv.buffer, i * elementAddressScale + byteOffset);
        }
      }
    }
  }
}

function normalizeToVector3(
  data: TypedArray,
  normalizationParams: {normalizationNumber: number; signed: boolean}
): [number, number, number] {
  const {normalizationNumber, signed} = normalizationParams;
  const result: number[] = [];
  for (const number of data) {
    let normalized = number / normalizationNumber;
    if (signed) {
      normalized -= 0.5;
    }
    result.push(normalized);
  }
  return [result[0], result[1], 1];
}

function denormalizeVector3(
  vector: Vector3,
  normalizationParams: {normalizationNumber: number; signed: boolean}
): [number, number] {
  const {normalizationNumber, signed} = normalizationParams;
  const result: number[] = [];
  for (let number of vector) {
    if (signed) {
      number += 0.5;
    }
    const denormalized = Math.trunc(number * normalizationNumber);

    result.push(denormalized);
  }
  return [result[0], result[1]];
}

function getNormalizationParams(
  componentType: number,
  bytes: number
): {normalizationNumber: number; signed: boolean} {
  let signed;
  const normalizationNumber = Math.pow(2, bytes * 8) - 1;
  switch (componentType) {
    case 5120:
    case 5122:
      signed = true;
      break;
    case 5121:
    case 5123:
    case 5125:
    case 5126:
    default:
      signed = false;
  }
  return {normalizationNumber, signed};
}

function makeTransformationMatrix(extensionData: {
  offset: [number, number];
  rotation: number;
  scale: [number, number];
}) {
  const {offset = [0, 0], rotation = 0, scale = [1, 1]} = extensionData;
  const translationMatirx = scratchMatrix.set(1, 0, 0, 0, 1, 0, offset[0], offset[1], 1);
  const rotationMatirx = new Matrix3(
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
  const scaleMatrix = new Matrix3(scale[0], 0, 0, 0, scale[1], 0, 0, 0, 1);
  return translationMatirx.multiplyRight(rotationMatirx).multiplyRight(scaleMatrix);
}
