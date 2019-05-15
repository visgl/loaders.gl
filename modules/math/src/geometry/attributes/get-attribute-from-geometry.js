import isGeometry from '../is-geometry';
import assert from '../utils/assert';

export function getPositions(geometry) {
  // If geometry, extract positions
  if (isGeometry(geometry)) {
    const {attributes} = geometry;
    const position = attributes.POSITION || attributes.positions;
    assert(position);
    return position;
  }

  // If arraybuffer, assume 3 components
  if (ArrayBuffer.isView(geometry)) {
    return {values: geometry, size: 3};
  }

  // Else assume accessor object
  if (geometry) {
    assert(geometry.values);
    return geometry;
  }

  return assert(false);
}
