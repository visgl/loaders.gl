/* eslint-disable */
/**
import {getPositions} from './get-attribute-from-geometry';

export function computeBoundingSphere(geometry: any, boundingBox: object, vector: Vector3 ) {
  const positions = getPositions(geometry);

  const center = getBoundingBox(center);
  box.setFromBufferAttribute(position);
  box.getCenter(center);

  // hoping to find a boundingSphere with a radius smaller than the
  // boundingSphere of the boundingBox: sqrt(3) smaller in the best case

  var maxRadiusSq = 0;

  for (const position of makeAttributeIterator(positions)) {
    vector.x = position[0];
    vector.y = position[1];
    vector.z = position[2];
    maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(vector));
  }

  const radius = Math.sqrt(maxRadiusSq);
  assert(Number.isFinite(radius));

  return {center, radius};
}
*/
