/**
 * Converts content of an I3S node to *.b3dm's file content
 */
export default class B3dmConverter {
  rtcCenter: Float32Array;
  i3sContent: any;

  constructor();

  /**
   * The starter of content conversion
   * @param i3sContent - content of I3S node
   * @returns - encoded content
   */
  convert(i3sContent: Object, attributes: any): ArrayBuffer;

  /**
   * Build and encode gltf
   * @param i3sContent - content of I3S node
   * @returns - encoded glb content
   */
  buildGltf(i3sContent): ArrayBuffer;
}
