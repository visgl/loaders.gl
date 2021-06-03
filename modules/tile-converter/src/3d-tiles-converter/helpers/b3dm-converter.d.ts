/**
 * Converts content of an I3S node to *.b3dm's file content
 */
export default class B3dmConverter {
  rtcCenter: Float32Array;
  i3sTile: any;

  constructor();

  /**
   * The starter of content conversion
   * @param i3sTile - Tile3D instance for I3S node
   * @returns - encoded content
   */
  convert(i3sTile: Object, attributes?: any): ArrayBuffer;

  /**
   * Build and encode gltf
   * @param i3sTile - Tile3D instance for I3S node
   * @returns - encoded glb content
   */
  buildGltf(i3sTile): ArrayBuffer;
}
