import {Vector3, Matrix4} from '@math.gl/core';
/**
 * Convert binary data from b3dm file to i3s resources
 *
 * @param tileContent - 3d tile content
 * @param options - converter options
 * @returns A promise that resolves to object with `geometry`, compressedGeometry`, `texture` and `sharedResources` appropriate
 *  for use  I3S tiles.
 */
export default function convertB3dmToI3sGeometry(
  tileContent: {
    batchTableJson: {
      id: [];
    };
    cartographicOrigin: Vector3;
    cartesianModelMatrix: Matrix4;
    gltf: {
      scene: {
        nodes: [];
      };
      images: [];
      materials: [];
    };
  },
  nodeId: number,
  featuresHashArray: any,
  attributeStorageInfo: any,
  draco: boolean
): Promise<{
  geometry: ArrayBuffer;
  compressedGeometry: ArrayBuffer;
  texture: any;
  sharedResources: any;
  meshMaterial: any;
  vertexCount: number;
  attributes: any;
  featureCount: number
}[]>;
