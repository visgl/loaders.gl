import {
  Tiles3DTileContent,
  Tiles3DTileJSONPostprocessed,
  parseBatchedModel
} from '@loaders.gl/3d-tiles';
import {GltfPrimitiveModeString, PreprocessData} from '../types';
import {GLTF, GLTFLoader} from '@loaders.gl/gltf';
import {parse} from '@loaders.gl/core';
import {getMagicString} from '@loaders.gl/loader-utils';

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

export const analyzeTileContent = async (
  tile: Tiles3DTileJSONPostprocessed,
  tileContentBuffer: ArrayBuffer | null
): Promise<PreprocessData> => {
  const result: PreprocessData = {
    meshTopologyTypes: []
  };
  if (!tileContentBuffer) {
    return result;
  }

  const contentType = getMagicString(tileContentBuffer, 0, 4);
  let gltf;
  if (contentType === 'b3dm') {
    gltf = await getGltfJsonFromB3dm(tileContentBuffer);
  } else if (contentType === 'glTF') {
    const gltfData = await parse(tileContentBuffer, GLTFLoader);
    gltf = gltfData.json;
  }

  if (!gltf) {
    return result;
  }
  const meshTypes = getMeshTypesFromGltf(gltf);
  result.meshTopologyTypes = meshTypes;
  return result;
};

const getGltfJsonFromB3dm = async (tileContentBuffer: ArrayBuffer): Promise<GLTF | null> => {
  const tile: Tiles3DTileContent = {};
  parseBatchedModel(tile, tileContentBuffer, 0);
  if (!tile.gltfArrayBuffer) {
    return null;
  }
  const gltf = await parse(tile.gltfArrayBuffer, GLTFLoader);
  return gltf.json;
};

const getMeshTypesFromGltf = (gltfJson: GLTF): GltfPrimitiveModeString[] => {
  const result: GltfPrimitiveModeString[] = [];
  for (const mesh of gltfJson.meshes || []) {
    for (const primitive of mesh.primitives) {
      let {mode} = primitive;
      if (typeof mode !== 'number') {
        mode = 4; // Default is 4 - TRIANGLES
      }
      result.push(GLTF_PRIMITIVE_MODES[mode]);
    }
  }
  return result;
};

export const mergePreprocessData = (
  object1: PreprocessData,
  object2: PreprocessData
): PreprocessData => {
  const uniqueMeshTypes = new Set<GltfPrimitiveModeString>();
  for (const type of object1.meshTopologyTypes) {
    uniqueMeshTypes.add(type);
  }
  for (const type of object2.meshTopologyTypes) {
    uniqueMeshTypes.add(type);
  }
  return {
    meshTopologyTypes: Array.from(uniqueMeshTypes.values())
  };
};
