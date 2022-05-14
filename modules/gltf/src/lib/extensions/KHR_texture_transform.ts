/**
 * https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_texture_transform/README.md
 */

import {Vector3, Matrix3} from '@math.gl/core';
import type {GLTFMeshPrimitive, GLTFWithBuffers} from '../types/gltf-types';
import type {GLTFLoaderOptions} from '../../gltf-loader';
import {getAccessorArrayTypeAndLength} from '../gltf-utils/gltf-utils';
import {BYTES, COMPONENTS} from '../gltf-utils/gltf-constants';
import {
  Accessor,
  BufferView,
  MaterialNormalTextureInfo,
  MaterialOcclusionTextureInfo,
  TextureInfo as GLTFTextureInfo
} from '../types/gltf-json-schema';
import GLTFScenegraph from '../api/gltf-scenegraph';

/** Extension name */
const EXT_MESHOPT_TRANSFORM = 'KHR_texture_transform';

export const name = EXT_MESHOPT_TRANSFORM;

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
  MaterialNormalTextureInfo &
  MaterialOcclusionTextureInfo;
/** Parameters for TEXCOORD transformation */
type TransformParameters = {
  /** Original texCoord value https://www.khronos.org/registry/glTF/specs/2.0/glTF-2.0.html#_textureinfo_texcoord */
  originalTexCoord: number;
  /** New texCoord value from extension https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_texture_transform#gltf-schema-updates */
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
  const gltfScenegraph = new GLTFScenegraph(gltfData);
  const extension = gltfScenegraph.getExtension(EXT_MESHOPT_TRANSFORM);
  if (!extension) {
    return;
  }
  const materials = gltfData.json.materials || [];
  for (let i = 0; i < materials.length; i++) {
    transformTexCoords(i, gltfData);
  }
}

/**
 * Transform TEXCOORD by material
 * @param materialIndex processing material index
 * @param gltfData gltf buffers and json
 */
function transformTexCoords(materialIndex: number, gltfData: GLTFWithBuffers): void {
  // Save processed texCoords in order no to process the same twice
  const processedTexCoords: [number, number][] = [];
  const material = gltfData.json.materials?.[materialIndex];
  const baseColorTexture = material?.pbrMetallicRoughness?.baseColorTexture;
  if (baseColorTexture) {
    transformPrimitives(gltfData, materialIndex, baseColorTexture, processedTexCoords);
  }
  const emisiveTexture = material?.emissiveTexture;
  if (emisiveTexture) {
    transformPrimitives(gltfData, materialIndex, emisiveTexture, processedTexCoords);
  }
  const normalTexture = material?.normalTexture;
  if (normalTexture) {
    transformPrimitives(gltfData, materialIndex, normalTexture, processedTexCoords);
  }
  const occlusionTexture = material?.occlusionTexture;
  if (occlusionTexture) {
    transformPrimitives(gltfData, materialIndex, occlusionTexture, processedTexCoords);
  }
  const metallicRoughnessTexture = material?.pbrMetallicRoughness?.metallicRoughnessTexture;
  if (metallicRoughnessTexture) {
    transformPrimitives(gltfData, materialIndex, metallicRoughnessTexture, processedTexCoords);
  }
}

/**
 * Transform primitives of the particular material
 * @param gltfData gltf data
 * @param materialIndex primitives with this material will be transformed
 * @param texture texture object
 * @param processedTexCoords storage to save already processed texCoords
 */
function transformPrimitives(
  gltfData: GLTFWithBuffers,
  materialIndex: number,
  texture: CompoundGLTFTextureInfo,
  processedTexCoords: [number, number][]
) {
  const transformParameters = getTransformParameters(texture, processedTexCoords);
  if (!transformParameters) {
    return;
  }
  const meshes = gltfData.json.meshes || [];
  for (const mesh of meshes) {
    for (const primitive of mesh.primitives) {
      const material = primitive.material;
      if (Number.isFinite(material) && materialIndex === material) {
        transformPrimitive(gltfData, primitive, transformParameters);
      }
    }
  }
}

/**
 * Get parameters for TEXCOORD transformation
 * @param texture texture object
 * @param processedTexCoords storage to save already processed texCoords
 * @returns texCoord couple and transformation matrix
 */
function getTransformParameters(
  texture: CompoundGLTFTextureInfo,
  processedTexCoords: [number, number][]
): TransformParameters | null {
  const textureInfo = texture.extensions?.[EXT_MESHOPT_TRANSFORM];
  const {texCoord: originalTexCoord = 0} = texture;
  // If texCoord is not set in the extension, original attribute data will be replaced
  const {texCoord = originalTexCoord} = textureInfo;
  // Make sure that couple [originalTexCoord, extensionTexCoord] is not processed twice
  const isProcessed =
    processedTexCoords.findIndex(
      ([original, newTexCoord]) => original === originalTexCoord && newTexCoord === texCoord
    ) !== -1;
  if (!isProcessed) {
    const matrix = makeTransformationMatrix(textureInfo);
    if (originalTexCoord !== texCoord) {
      texture.texCoord = texCoord;
    }
    processedTexCoords.push([originalTexCoord, texCoord]);
    return {originalTexCoord, texCoord, matrix};
  }
  return null;
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
  const {originalTexCoord, texCoord, matrix} = transformParameters;
  const texCoordAccessor = primitive.attributes[`TEXCOORD_${originalTexCoord}`];
  if (Number.isFinite(texCoordAccessor)) {
    // Get accessor of the `TEXCOORD_0` attribute
    const accessor = gltfData.json.accessors?.[texCoordAccessor];
    if (accessor && accessor.bufferView) {
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
        // If texCoord the same, replace gltf structural data
        if (originalTexCoord === texCoord) {
          updateGltf(accessor, bufferView, gltfData.buffers, result);
        } else {
          // If texCoord change, create new attribute
          createAttribute(texCoord, accessor, primitive, gltfData, result);
        }
      }
    }
  }
}

/**
 * Update GLTF structural objects with new data as we create new `Float32Array` for `TEXCOORD_0`.
 * @param accessor accessor to change
 * @param bufferView bufferView to change
 * @param buffers binary buffers
 * @param newTexcoordArray typed array with data after transformation
 */
function updateGltf(
  accessor: Accessor,
  bufferView: BufferView,
  buffers: {arrayBuffer: ArrayBuffer; byteOffset: number; byteLength: number}[],
  newTexCoordArray: Float32Array
): void {
  accessor.componentType = 5126;
  buffers.push({
    arrayBuffer: newTexCoordArray.buffer,
    byteOffset: 0,
    byteLength: newTexCoordArray.buffer.byteLength
  });
  bufferView.buffer = buffers.length - 1;
  bufferView.byteLength = newTexCoordArray.buffer.byteLength;
  bufferView.byteOffset = 0;
  delete bufferView.byteStride;
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
  originalAccessor: Accessor,
  primitive: GLTFMeshPrimitive,
  gltfData: GLTFWithBuffers,
  newTexCoordArray: Float32Array
) {
  gltfData.buffers.push({
    arrayBuffer: newTexCoordArray.buffer,
    byteOffset: 0,
    byteLength: newTexCoordArray.buffer.byteLength
  });
  const bufferViews = gltfData.json.bufferViews;
  if (!bufferViews) {
    return;
  }
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
