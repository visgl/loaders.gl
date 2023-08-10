import {Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import {GltfPrimitiveModeString, PreprocessData} from '../types';
import {GLTF, GLTFLoader} from '@loaders.gl/gltf';
import {parse} from '@loaders.gl/core';

/**
 * glTF primitive modes
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode
 */
export const GLTF_PRIMITIVE_MODES = [
  GltfPrimitiveModeString.POINTS, // 0
  GltfPrimitiveModeString.LINES, // 1
  GltfPrimitiveModeString.LINE_LOOP, // 2
  GltfPrimitiveModeString.LINE_STRIP, // 3
  GltfPrimitiveModeString.TRIANGLES, // 4
  GltfPrimitiveModeString.TRIANGLE_STRIP, // 5
  GltfPrimitiveModeString.TRIANGLE_FAN // 6
];

/**
 * Analyze tile content. This function is used during preprocess stage of
 * conversion
 * @param tileContent - 3DTiles tile content ArrayBuffer
 * @returns
 */
export const analyzeTileContent = async (
  tileContent: Tiles3DTileContent | null
): Promise<PreprocessData> => {
  const result: PreprocessData = {
    meshTopologyTypes: new Set()
  };
  if (!tileContent?.gltfArrayBuffer) {
    return result;
  }

  const gltfData = await parse(tileContent.gltfArrayBuffer, GLTFLoader, {
    gltf: {normalize: false, loadBuffers: false, loadImages: false, decompressMeshes: false}
  });
  const gltf = gltfData.json;

  if (!gltf) {
    return result;
  }
  const meshTypes = getMeshTypesFromGltf(gltf);
  result.meshTopologyTypes = meshTypes;
  return result;
};

/**
 * Get mesh topology types that the glb content has
 * @param gltfJson - JSON part of GLB content
 * @returns array of mesh types found
 */
const getMeshTypesFromGltf = (gltfJson: GLTF): Set<GltfPrimitiveModeString> => {
  const result: Set<GltfPrimitiveModeString> = new Set();
  for (const mesh of gltfJson.meshes || []) {
    for (const primitive of mesh.primitives) {
      let {mode} = primitive;
      if (typeof mode !== 'number') {
        mode = 4; // Default is 4 - TRIANGLES
      }
      result.add(GLTF_PRIMITIVE_MODES[mode]);
    }
  }
  return result;
};

/**
 * Merge object2 into object1
 * @param object1
 * @param object2
 * @returns nothing
 */
export const mergePreprocessData = (object1: PreprocessData, object2: PreprocessData): void => {
  // Merge topology mesh types info
  for (const type of object2.meshTopologyTypes) {
    object1.meshTopologyTypes.add(type);
  }
};
