/**
 * Converts content of an I3S node to *.b3dm's file content
 */
export default class B3dmConverter {
  rtcCenter: Float32Array;

  constructor();

  /**
   * The starter of content conversion
   * @param i3sContent - content of I3S node
   * @returns - encoded content
   */
  convert(i3sContent: Object): ArrayBuffer;

  /**
   * Build and encode gltf
   * @param i3sContent - content of I3S node
   * @returns - encoded glb content
   */
  buildGltf(i3sContent): ArrayBuffer;

  // PRIVATE

  /**
   * Positions in I3S are represented in Float64Array.
   * GLTF doesn't have component type for Float64Array
   * This method deduce the `rtcCenter` vector and subtract it from each vertex
   * After this operation positions array is converted to Float32Array
   * @param positions - the source array of positions
   * @returns - the converted positions array
   */
  _shrinkPositions(positions: Float64Array): Float32Array;

  /**
   * Calculate average positions value for some particular axis (x, y, z)
   * @param arr - the source array
   * @param axisNumber - number of an axis. Possible values are 0, 1 or 2
   * @returns - The average value for some axis
   */
  _axisAvg(arr: Float64Array, axisNumber: number): number;
}
