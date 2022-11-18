// loaders.gl, MIT license
// Forked from https://github.com/mapbox/geojson-vt under compatible ISC license

/**
 * Calculate simplification data using optimized Douglas-Peucker algorithm
 *
 * @param coords contiguous list of coordinates
 * @param first first coord to simplify
 * @param last last coord to simplify
 * @param sqTolerance tolerance (square distance)
 */
export function simplify(coords: number[], first: number, last: number, sqTolerance: number): void {
  let maxSqDist = sqTolerance;
  const mid = (last - first) >> 1;
  let minPosToMid = last - first;
  let index;

  const ax = coords[first];
  const ay = coords[first + 1];
  const bx = coords[last];
  const by = coords[last + 1];

  for (let i = first + 3; i < last; i += 3) {
    const d = getSqSegDist(coords[i], coords[i + 1], ax, ay, bx, by);

    if (d > maxSqDist) {
      index = i;
      maxSqDist = d;
    } else if (d === maxSqDist) {
      // a workaround to ensure we choose a pivot close to the middle of the list,
      // reducing recursion depth, for certain degenerate inputs
      // https://github.com/mapbox/geojson-vt/issues/104
      const posToMid = Math.abs(i - mid);
      if (posToMid < minPosToMid) {
        index = i;
        minPosToMid = posToMid;
      }
    }
  }

  if (maxSqDist > sqTolerance) {
    if (index - first > 3) simplify(coords, first, index, sqTolerance);
    coords[index + 2] = maxSqDist;
    if (last - index > 3) simplify(coords, index, last, sqTolerance);
  }
}

/** square distance from a point to a segment */
// eslint-disable-next-line max-params
function getSqSegDist(
  px: number,
  py: number,
  x: number,
  y: number,
  bx: number,
  by: number
): number {
  let dx = bx - x;
  let dy = by - y;

  if (dx !== 0 || dy !== 0) {
    const t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

    if (t > 1) {
      x = bx;
      y = by;
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }

  dx = px - x;
  dy = py - y;

  return dx * dx + dy * dy;
}
