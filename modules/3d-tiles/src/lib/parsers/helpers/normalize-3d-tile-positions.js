import {Vector3} from '@math.gl/core';
import {GL} from '@loaders.gl/math';

// Prepare attribute for positions
export function normalize3DTilePositionAttribute(tile, positions, options) {
  if (!tile.isQuantized) {
    return positions;
  }

  // For quantized posititions, either expand to Float32Array or return custom accessor
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/TileFormats/Instanced3DModel/README.md#quantized-positions

  // Optionally decodes quantized positions on GPU, for simpler renderers that don't accept normalized attributes
  if (options.decodeQuantizedPositions) {
    tile.isQuantized = false;
    return decodeQuantizedPositions(tile, positions);
  }

  // Default: Use normalized shorts directly, no copying/processing.
  // NOTE: The "missing" offset/scaling operations are automatically added to modelMatrix if `tile.isQuantized === true`
  return {
    type: GL.UNSIGNED_SHORT,
    value: positions,
    size: 3,
    normalized: true
  };
}

// Pre-scale quantized positions on CPU
function decodeQuantizedPositions(tile, positions) {
  const scratchPosition = new Vector3();
  const decodedArray = new Float32Array(tile.pointCount * 3);

  for (let i = 0; i < tile.pointCount; i++) {
    // POSITION = POSITION_QUANTIZED / 65535.0 * QUANTIZED_VOLUME_SCALE + QUANTIZED_VOLUME_OFFSET
    scratchPosition
      .set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      .scale(1 / tile.quantizedRange)
      .multiply(tile.quantizedVolumeScale)
      .add(tile.quantizedVolumeOffset)
      .toArray(decodedArray, i * 3);
  }

  return decodedArray;
}
