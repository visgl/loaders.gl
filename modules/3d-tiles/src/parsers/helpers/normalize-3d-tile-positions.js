import {Vector3} from 'math.gl';

const scratchPosition = new Vector3();

export function normalize3DTilePositionAttribute(tile, positions) {
  if (tile.isQuantized) {
    // https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/TileFormats/Instanced3DModel/README.md#quantized-positions
    // POSITION_QUANTIZED * QUANTIZED_VOLUME_SCALE / 65535.0 + QUANTIZED_VOLUME_OFFSET
    const decodedArray = new Float32Array(tile.pointCount * 3);
    for (let i = 0; i < tile.pointCount; i++) {
      scratchPosition
        .set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
        .multiply(tile.quantizedVolumeScale)
        .scale(1 / tile.quantizedRange)
        .add(tile.quantizedVolumeOffset);

      scratchPosition.toArray(decodedArray, i * 3);
    }

    return decodedArray;
  }

  return positions;
}
