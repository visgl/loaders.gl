import {makeAttributeIterator} from '../iterators/attribute-iterator';
import {assert} from '../utils/assert';

/**
 * Type for Bounding Box computing
 */
type BoundingBox = {
  min: number[];
  max: number[];
};
/**
 * Getting bounding box geometry according to positions parameters
 * @param positions
 * @returns Bounding Box
 */
export function computeBoundingBox(positions: any = []) {
  const min = [Number(Infinity), Number(Infinity), Number(Infinity)];
  const max = [-Infinity, -Infinity, -Infinity];
  // @ts-ignore
  for (const position of makeAttributeIterator(positions)) {
    const x = position[0];
    const y = position[1];
    const z = position[2];

    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;

    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  }

  const boundingBox = {min, max};
  validateBoundingBox(boundingBox);
  return boundingBox;
}

function validateBoundingBox(boundingBox: BoundingBox) {
  assert(
    Number.isFinite(boundingBox.min[0]) &&
      Number.isFinite(boundingBox.min[1]) &&
      Number.isFinite(boundingBox.min[2]) &&
      Number.isFinite(boundingBox.max[0]) &&
      Number.isFinite(boundingBox.max[1]) &&
      Number.isFinite(boundingBox.max[2])
  );
}
