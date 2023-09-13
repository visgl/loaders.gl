import {Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import {GLTFPrimitiveModeString, PreprocessData} from '../types';
import {GLTF, GLTFLoader, GLTF_EXT_feature_metadata_GLTF} from '@loaders.gl/gltf';
import {parse} from '@loaders.gl/core';
import {EXT_FEATURE_METADATA} from '@loaders.gl/gltf';

/**
 * glTF primitive modes
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode
 */
export const GLTF_PRIMITIVE_MODES = [
  GLTFPrimitiveModeString.POINTS, // 0
  GLTFPrimitiveModeString.LINES, // 1
  GLTFPrimitiveModeString.LINE_LOOP, // 2
  GLTFPrimitiveModeString.LINE_STRIP, // 3
  GLTFPrimitiveModeString.TRIANGLES, // 4
  GLTFPrimitiveModeString.TRIANGLE_STRIP, // 5
  GLTFPrimitiveModeString.TRIANGLE_FAN // 6
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
  const defaultResult = {
    meshTopologyTypes: new Set<GLTFPrimitiveModeString>(),
    metadataClasses: new Set<string>()
  };
  if (!tileContent?.gltfArrayBuffer) {
    return defaultResult;
  }

  const gltfData = await parse(tileContent.gltfArrayBuffer, GLTFLoader, {
    gltf: {normalize: false, loadBuffers: false, loadImages: false, decompressMeshes: false}
  });
  const gltf = gltfData.json;

  if (!gltf) {
    return defaultResult;
  }
  const meshTopologyTypes = getMeshTypesFromGLTF(gltf);
  const metadataClasses = getMetadataClassesFromGLTF(gltf);
  return {
    meshTopologyTypes,
    metadataClasses
  };
};

/**
 * Get mesh topology types that the glb content has
 * @param gltfJson - JSON part of GLB content
 * @returns array of mesh types found
 */
const getMeshTypesFromGLTF = (gltfJson: GLTF): Set<GLTFPrimitiveModeString> => {
  const result: Set<GLTFPrimitiveModeString> = new Set();
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
 * Get feature metadata classes from glTF
 * The tileset might contain multiple metadata classes provided by EXT_feature_metadata and EXT_structural_metadata extensions.
 * Every class is a set of properties. But I3S can consume only one set of properties.
 * On the pre-process we collect all classes from the tileset in order to show the prompt to select one class for conversion to I3S.
 * @param gltfJson - JSON part of GLB content
 * @returns array of classes
 */
const getMetadataClassesFromGLTF = (gltfJson: GLTF): Set<string> => {
  const result: Set<string> = new Set();

  const classes = (gltfJson.extensions?.[EXT_FEATURE_METADATA] as GLTF_EXT_feature_metadata_GLTF)
    ?.schema?.classes;

  if (classes) {
    for (const classKey of Object.keys(classes)) {
      result.add(classKey);
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

  // Merge feature metadata classes
  for (const metadataClass of object2.metadataClasses) {
    object1.metadataClasses.add(metadataClass);
  }
};
