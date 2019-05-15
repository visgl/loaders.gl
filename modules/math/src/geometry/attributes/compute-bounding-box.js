/* eslint-disable */

export function computeBoundingBox(positions, target = new Box3()) {
  const min = [+Infinity, +Infinity, +Infinity];
  const max = [-Infinity, -Infinity, -Infinity];

  for (const position of attributeIterator(positions)) {
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

function validateBoundingBox(boundingBox) {
  assert(
    Number.isFinite(boundingBox.min[0]) &&
      Number.isFinite(boundingBox.min[1]) &&
      Number.isFinite(boundingBox.min[2]) &&
      Number.isFinite(boundingBox.max[0]) &&
      Number.isFinite(boundingBox.max[1]) &&
      Number.isFinite(boundingBox.max[2])
  );
}
