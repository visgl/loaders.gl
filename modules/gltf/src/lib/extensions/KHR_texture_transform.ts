// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/**
 * https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */

import {Vector3, Matrix3} from '@math.gl/core';
import type {GLTFWithBuffers} from '../types/gltf-types';
import type {
  GLTFMeshPrimitive,
  GLTFAccessor,
  GLTFMaterialNormalTextureInfo,
  GLTFMaterialOcclusionTextureInfo,
  GLTFTextureInfo
} from '../types/gltf-json-schema';
import type {GLTFLoaderOptions} from '../../gltf-loader';

import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';
import {BYTES, COMPONENTS} from '../gltf-utils/gltf-constants';
import {GLTFIterator} from '../api/gltf-iterator';
import {ensureArrayBuffer} from '@loaders.gl/loader-utils';

/** Extension name */
const KHR_TEXTURE_TRANSFORM = 'KHR_texture_transform';

export const name = KHR_TEXTURE_TRANSFORM;

const scratchVector = new Vector3();
const scratchRotationMatrix = new Matrix3();
const scratchScaleMatrix = new Matrix3();

/** Extension textureInfo https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform#gltf-schema-updates */
type TextureInfo = {
  /** The offset of the UV coordinate origin as a factor of the texture dimensions. */
  offset?: [number, number];
  /** Rotate the UVs by this many radians counter-clockwise around the origin. This is equivalent to a similar rotation of the image clockwise. */
  rotation?: number;
  /** The scale factor applied to the components of the UV coordinates. */
  scale?: [number, number];
  /** Overrides the textureInfo texCoord value if supplied, and if this extension is supported. */
  texCoord?: number;
};
/** Intersection of all GLTF textures */
type CompoundGLTFTextureInfo = GLTFTextureInfo &
  GLTFMaterialNormalTextureInfo &
  GLTFMaterialOcclusionTextureInfo;
/** Parameters for TEXCOORD transformation */
type TransformParameters = {
  /** Source texCoord selected by the texture info or extension. */
  sourceTexCoord: number;
  /** Generated texCoord containing the transformed values. */
  texCoord: number;
  /** Transformation matrix */
  matrix: Matrix3;
};

/**
 * The extension entry to process the transformation
 * @param gltfData gltf buffers and json
 * @param options GLTFLoader options
 */
export async function decode(gltfData: GLTFWithBuffers, options: GLTFLoaderOptions) {
  const iterator = new GLTFIterator(gltfData);
  const hasExtension = iterator.hasExtension(KHR_TEXTURE_TRANSFORM);
  if (!hasExtension || !options.gltf?.loadBuffers) {
    return;
  }
  const materials = gltfData.json.materials || [];
  for (let i = 0; i < materials.length; i++) {
    transformTexCoords(i, gltfData, iterator);
  }
  if (!materials.some(material => findTextureInfos(material).length > 0)) {
    iterator.removeExtension(KHR_TEXTURE_TRANSFORM);
  }
}

/**
 * Transform TEXCOORD by material
 * @param materialIndex processing material index
 * @param gltfData gltf buffers and json
 * @param gltfScenegraph glTF scenegraph used to remove decoded extensions
 */
function transformTexCoords(
  materialIndex: number,
  gltfData: GLTFWithBuffers,
  iterator: GLTFIterator
): void {
  const material = gltfData.json.materials?.[materialIndex];
  const materialTextures = findTextureInfos(material);
  const processedTransforms = new Map<string, TransformParameters>();
  let nextTexCoord = getNextTexCoord(gltfData);

  for (const textureInfo of materialTextures) {
    const extension = textureInfo.extensions?.[KHR_TEXTURE_TRANSFORM] as TextureInfo | undefined;
    if (extension) {
      const sourceTexCoord = extension.texCoord ?? textureInfo.texCoord ?? 0;
      const transformKey = getTransformKey(sourceTexCoord, extension);
      let transformParameters = processedTransforms.get(transformKey);
      if (!transformParameters) {
        transformParameters = {
          sourceTexCoord,
          texCoord: nextTexCoord,
          matrix: makeTransformationMatrix(extension)
        };
        if (!transformPrimitives(gltfData, materialIndex, transformParameters)) {
          continue;
        }
        nextTexCoord++;
        processedTransforms.set(transformKey, transformParameters);
      }
      textureInfo.texCoord = transformParameters.texCoord;
      removeObjectExtension(iterator, textureInfo, KHR_TEXTURE_TRANSFORM);
      if (textureInfo.extensions && Object.keys(textureInfo.extensions).length === 0) {
        delete textureInfo.extensions;
      }
    }
  }
}

/** Remove an object extension while preserving top-level extension bookkeeping. */
function removeObjectExtension(
  iterator: GLTFIterator,
  object: {extensions?: Record<string, unknown>},
  extensionName: string
): void {
  if (object.extensions?.[extensionName] !== undefined) {
    iterator.recordRemovedExtension(extensionName);
    delete object.extensions[extensionName];
  }
}

/**
 * Finds texture infos at any nesting level of a material, including KHR_materials_* extensions.
 * @param value material value to inspect
 * @returns texture infos using KHR_texture_transform
 */
function findTextureInfos(value: unknown): CompoundGLTFTextureInfo[] {
  if (!value || typeof value !== 'object') {
    return [];
  }
  const object = value as Record<string, unknown>;
  const textureInfos: CompoundGLTFTextureInfo[] = [];
  const extensions = object.extensions as Record<string, unknown> | undefined;
  if (Number.isFinite(object.index) && extensions?.[KHR_TEXTURE_TRANSFORM]) {
    textureInfos.push(object as CompoundGLTFTextureInfo);
  }
  for (const [key, nestedValue] of Object.entries(object)) {
    if (key !== 'extras') {
      textureInfos.push(...findTextureInfos(nestedValue));
    }
  }
  return textureInfos;
}

/** Returns the first TEXCOORD set index unused by every primitive. */
function getNextTexCoord(gltfData: GLTFWithBuffers): number {
  let maximumTexCoord = -1;
  for (const mesh of gltfData.json.meshes || []) {
    for (const primitive of mesh.primitives) {
      for (const attributeName of Object.keys(primitive.attributes)) {
        const match = /^TEXCOORD_(\d+)$/.exec(attributeName);
        if (match) {
          maximumTexCoord = Math.max(maximumTexCoord, Number(match[1]));
        }
      }
    }
  }
  return maximumTexCoord + 1;
}

/** Returns a stable key for transformations that can share generated attributes. */
function getTransformKey(sourceTexCoord: number, extension: TextureInfo): string {
  const {offset = [0, 0], rotation = 0, scale = [1, 1]} = extension;
  return JSON.stringify([sourceTexCoord, offset, rotation, scale]);
}

/**
 * Transform primitives of the particular material.
 * @param gltfData gltf data
 * @param materialIndex primitives with this material will be transformed
 * @param transformParameters source and generated texture coordinate sets
 * @returns true when every relevant primitive received the generated attribute
 */
function transformPrimitives(
  gltfData: GLTFWithBuffers,
  materialIndex: number,
  transformParameters: TransformParameters
): boolean {
  const primitives: GLTFMeshPrimitive[] = [];
  const meshes = gltfData.json.meshes || [];
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives) {
      const material = primitive.material;
      if (Number.isFinite(material) && materialIndex === material) {
        primitives.push(primitive);
      }
    }
  }
  if (
    primitives.length === 0 ||
    primitives.some(
      primitive => !canTransformPrimitive(gltfData, primitive, transformParameters.sourceTexCoord)
    )
  ) {
    return false;
  }
  for (const primitive of primitives) {
    transformPrimitive(gltfData, primitive, transformParameters);
  }
  return true;
}

/** Returns whether a primitive's source texture coordinates can be transformed without data loss. */
function canTransformPrimitive(
  gltfData: GLTFWithBuffers,
  primitive: GLTFMeshPrimitive,
  sourceTexCoord: number
): boolean {
  const texCoordAccessor = primitive.attributes[`TEXCOORD_${sourceTexCoord}`];
  if (!Number.isFinite(texCoordAccessor)) {
    return false;
  }
  const accessor = gltfData.json.accessors?.[texCoordAccessor];
  if (!accessor || accessor.bufferView === undefined || accessor.sparse) {
    return false;
  }
  const bufferView = gltfData.json.bufferViews?.[accessor.bufferView];
  return Boolean(bufferView && gltfData.buffers[bufferView.buffer]);
}

/**
 * Transform `TEXCOORD_0` attribute in the primitive
 * @param gltfData gltf data
 * @param primitive primitive object
 * @param transformParameters texCoord couple and transformation matrix
 */
function transformPrimitive(
  gltfData: GLTFWithBuffers,
  primitive: GLTFMeshPrimitive,
  transformParameters: TransformParameters
) {
  const {sourceTexCoord, texCoord, matrix} = transformParameters;
  const texCoordAccessor = primitive.attributes[`TEXCOORD_${sourceTexCoord}`];
  if (Number.isFinite(texCoordAccessor)) {
    // Get accessor of the `TEXCOORD_0` attribute
    const accessor = gltfData.json.accessors?.[texCoordAccessor];
    if (accessor && accessor.bufferView !== undefined) {
      // Get `bufferView` of the `accessor`
      const bufferView = gltfData.json.bufferViews?.[accessor.bufferView];
      if (bufferView) {
        // Get `arrayBuffer` the `bufferView` look at
        const {arrayBuffer, byteOffset: bufferByteOffset} = gltfData.buffers[bufferView.buffer];
        // Resulting byteOffset is sum of the buffer, accessor and bufferView byte offsets
        const byteOffset =
          (bufferByteOffset || 0) + (accessor.byteOffset || 0) + (bufferView.byteOffset || 0);
        // Deduce TypedArray type and its length from `accessor` and `bufferView` data
        const {ArrayType, length} = getAccessorArrayTypeAndLength(accessor, bufferView);
        // Number of bytes each component occupies
        const bytes = BYTES[accessor.componentType];
        // Number of components. For the `TEXCOORD_0` with `VEC2` type, it must return 2
        const components = COMPONENTS[accessor.type];
        // Multiplier to calculate the address of the `TEXCOORD_0` element in the arrayBuffer
        const elementAddressScale = bufferView.byteStride || bytes * components;
        // Data transform to Float32Array
        const result = new Float32Array(length);
        for (let i = 0; i < accessor.count; i++) {
          // Take [u, v] couple from the arrayBuffer
          const uv = new ArrayType(arrayBuffer, byteOffset + i * elementAddressScale, 2);
          // Set and transform Vector3 per https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform#overview
          scratchVector.set(uv[0], uv[1], 1);
          scratchVector.transformByMatrix3(matrix);
          // Save result in Float32Array
          result.set([scratchVector[0], scratchVector[1]], i * components);
        }
        createAttribute(texCoord, accessor, primitive, gltfData, result);
      }
    }
  }
}

/**
 *
 * @param newTexCoord new `texCoord` value
 * @param originalAccessor original accessor object, that store data before transformation
 * @param primitive primitive object
 * @param gltfData gltf data
 * @param newTexCoordArray typed array with data after transformation
 * @returns
 */
function createAttribute(
  newTexCoord: number,
  originalAccessor: GLTFAccessor,
  primitive: GLTFMeshPrimitive,
  gltfData: GLTFWithBuffers,
  newTexCoordArray: Float32Array
) {
  gltfData.buffers.push({
    arrayBuffer: ensureArrayBuffer(newTexCoordArray.buffer),
    byteOffset: 0,
    byteLength: newTexCoordArray.buffer.byteLength
  });
  gltfData.json.bufferViews = gltfData.json.bufferViews || [];
  const bufferViews = gltfData.json.bufferViews;
  bufferViews.push({
    buffer: gltfData.buffers.length - 1,
    byteLength: newTexCoordArray.buffer.byteLength,
    byteOffset: 0
  });
  const accessors = gltfData.json.accessors;
  if (!accessors) {
    return;
  }
  accessors.push({
    bufferView: bufferViews?.length - 1,
    byteOffset: 0,
    componentType: 5126,
    count: originalAccessor.count,
    type: 'VEC2'
  });
  primitive.attributes[`TEXCOORD_${newTexCoord}`] = accessors.length - 1;
}

/**
 * Construct transformation matrix from the extension data (transition, rotation, scale)
 * @param extensionData extension data
 * @returns transformation matrix
 */
function makeTransformationMatrix(extensionData: TextureInfo): Matrix3 {
  const {offset = [0, 0], rotation = 0, scale = [1, 1]} = extensionData;
  const translationMatrix = new Matrix3().set(1, 0, 0, 0, 1, 0, offset[0], offset[1], 1);
  const rotationMatrix = scratchRotationMatrix.set(
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
  return translationMatrix.multiplyRight(rotationMatrix).multiplyRight(scaleMatrix);
}
