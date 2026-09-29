/**
 * luma.gl can not work without indices now:
 * https://github.com/visgl/luma.gl/blob/d8cad75b9f8ca3e578cf078ed9d19e619c2ddbc9/modules/experimental/src/gltf/gltf-instantiator.js#L115
 * This method generates syntetic indices array: [0, 1, 2, 3, .... , vertexCount-1]
 * @param {number} vertexCount - vertex count in the geometry
 * @returns {Uint32Array} indices array.
 */
export const generateSyntheticIndices = (vertexCount: number): Uint32Array => {
  const result = new Uint32Array(vertexCount);
  for (let index = 0; index < vertexCount; index++) {
    result[index] = index;
  }
  return result;
};
