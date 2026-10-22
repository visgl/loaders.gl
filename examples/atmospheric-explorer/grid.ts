/** Coordinates for a reduced Gaussian grid, in latitude-row order. */
export type GaussianGrid = {latitudes: number[]; pointsPerLatitude: number[]; longitudes?: number[]};
export type FieldPoint = {position: [number, number]; value: number; index: number};

/** Expand one flat scalar field into georeferenced points without assuming a rectangular raster. */
export function expandReducedGaussianGrid(values: ArrayLike<number>, grid: GaussianGrid): FieldPoint[] {
  const {latitudes, pointsPerLatitude, longitudes} = grid;
  if (latitudes.length !== pointsPerLatitude.length) throw new Error('Grid latitude and row-count lengths differ');
  const expected = pointsPerLatitude.reduce((sum, count) => {
    if (!Number.isSafeInteger(count) || count <= 0) throw new Error('Invalid reduced Gaussian row length');
    return sum + count;
  }, 0);
  if (expected !== values.length) throw new Error(`Field has ${values.length} values; grid expects ${expected}`);
  if (longitudes && longitudes.length !== expected) throw new Error('Longitude coordinate count does not match field');
  const points: FieldPoint[] = [];
  let offset = 0;
  for (let row = 0; row < latitudes.length; row++) {
    const lat = latitudes[row];
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) throw new Error('Invalid latitude');
    const count = pointsPerLatitude[row];
    for (let column = 0; column < count; column++) {
      const index = offset + column;
      const value = values[index];
      const lon = longitudes ? longitudes[index] : 360 * column / count;
      if (!Number.isFinite(lon)) throw new Error('Invalid longitude');
      if (Number.isFinite(value)) points.push({position: [((lon + 180) % 360 + 360) % 360 - 180, lat], value, index});
    }
    offset += count;
  }
  return points;
}

export function finiteRange(values: ArrayLike<number>): [number, number] {
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) {min = Math.min(min, v); max = Math.max(max, v);}
  }
  if (min === Infinity) throw new Error('No finite values in field');
  return [min, max];
}

export function colorForValue(value: number, min: number, max: number): [number, number, number, number] {
  const t = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0.5;
  return [Math.round(255 * t), Math.round(180 * (1 - Math.abs(2 * t - 1))), Math.round(255 * (1 - t)), 210];
}

/** Build latitude rows from the archive's explicit point coordinates in storage order. */
export function createGaussianGridFromCoordinates(
  latitudes: ArrayLike<number>,
  longitudes: ArrayLike<number>
): GaussianGrid {
  if (latitudes.length !== longitudes.length || !latitudes.length) {
    throw new Error('Coordinate arrays must have the same nonzero length');
  }
  const grid: GaussianGrid = {latitudes: [], pointsPerLatitude: [], longitudes: Array.from(longitudes)};
  for (let index = 0; index < latitudes.length; index++) {
    const latitude = latitudes[index];
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitudes[index])) {
      throw new Error('Invalid point coordinates');
    }
    const row = grid.latitudes.length - 1;
    if (row < 0 || latitude !== grid.latitudes[row]) {
      grid.latitudes.push(latitude);
      grid.pointsPerLatitude.push(1);
    } else {
      grid.pointsPerLatitude[row]++;
    }
  }
  return grid;
}
