export const INTERSECT = Object.freeze({
  OUTSIDE: -1, // Represents that an object is not contained within the frustum.
  INTERSECTING: 0, // Represents that an object intersects one of the frustum's planes.
  INSIDE: 1 // Represents that an object is fully within the frustum.
});

export const Intersect = INTERSECT;
