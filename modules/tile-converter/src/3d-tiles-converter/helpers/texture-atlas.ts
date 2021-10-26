/**
 * Apply uvRegions to texture coordinates.
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.7/geometryUVRegion.cmn.md
 * Shader formula vec2 uv = fract(texCoords) * (uvRegions.zw - uvRegions.xy) + uvRegions.xy;
 * @param texCoords
 * @param uvRegions
 */
export function convertTextureAtlas(texCoords: Float32Array, uvRegions: Uint16Array): Float32Array {
  const convertedTexCoords = new Float32Array(texCoords.length);

  for (let index = 0; index < texCoords.length; index += 2) {
    const uv = texCoords.subarray(index, index + 2);
    const regions = uvRegions.subarray(index * 2, index * 2 + 4);
    const normalizedRegions = normalizeRegions(regions);

    // fract(texCoords)
    const fractatedUV = fract(uv);
    // (uvRegions.zw - uvRegions.xy)
    const subtracted = [
      normalizedRegions[2] - normalizedRegions[0],
      normalizedRegions[3] - normalizedRegions[1]
    ];
    // fract(texCoords) * (uvRegions.zw - uvRegions.xy)
    const multiplicationResult = [fractatedUV[0] * subtracted[0], fractatedUV[1] * subtracted[1]];
    // fract(texCoords) * (uvRegions.zw - uvRegions.xy) + uvRegions.xy;
    const convertedUV = [
      multiplicationResult[0] + normalizedRegions[0],
      multiplicationResult[1] + normalizedRegions[1]
    ];

    convertedTexCoords[index] = convertedUV[0];
    convertedTexCoords[index + 1] = convertedUV[1];
  }

  return convertedTexCoords;
}

/**
 * Do fractation of UV array.
 * @param uv
 */
function fract(uv: number[2]): number[2] {
  return [uv[0] - Math.floor(uv[0]), uv[1] - Math.floor(uv[1])];
}

/**
 * Normalize uvRegions by dividing by the maximum Uint16 value
 * @param regions
 */
function normalizeRegions(regions: Uint16Array): number[4] {
  const MAX_UINT_16_VALUE = 65535;
  const normalizedRegions = [];

  for (let index = 0; index < regions.length; index++) {
    normalizedRegions[index] = regions[index] / MAX_UINT_16_VALUE;
  }

  return normalizedRegions;
}
