import type {BinaryFeatureCollection, BinaryGeometry, Feature} from '@loaders.gl/schema';

type TransformCoordinate = (coord: number[]) => number[];

/**
 * Apply transformation to every coordinate of binary features
 * @param  binaryFeatures binary features
 * @param  transformCoordinate Function to call on each coordinate
 * @return Transformed binary features
 */
export function transformBinaryCoords(
  binaryFeatures: BinaryFeatureCollection,
  transformCoordinate: TransformCoordinate
): BinaryFeatureCollection {
  if (binaryFeatures.points) {
    transformBinaryGeometryPositions(binaryFeatures.points, transformCoordinate);
  }
  if (binaryFeatures.lines) {
    transformBinaryGeometryPositions(binaryFeatures.lines, transformCoordinate);
  }
  if (binaryFeatures.polygons) {
    transformBinaryGeometryPositions(binaryFeatures.polygons, transformCoordinate);
  }
  return binaryFeatures;
}

/** Transform one binary geometry */
function transformBinaryGeometryPositions(binaryGeometry: BinaryGeometry, fn: TransformCoordinate) {
  const {positions} = binaryGeometry;
  for (let i = 0; i < positions.value.length; i += positions.size) {
    // @ts-ignore inclusion of bigint causes problems
    const coord: Array<number> = Array.from(positions.value.subarray(i, i + positions.size));
    const transformedCoord = fn(coord);
    // @ts-ignore typescript typing for .set seems to require bigint?
    positions.value.set(transformedCoord, i);
  }
}

/**
 * Apply transformation to every coordinate of GeoJSON features
 *
 * @param  features Array of GeoJSON features
 * @param  fn       Function to call on each coordinate
 * @return          Transformed GeoJSON features
 */
export function transformGeoJsonCoords(
  features: Feature[],
  fn: (coord: number[]) => number[]
): Feature[] {
  for (const feature of features) {
    // @ts-ignore
    feature.geometry.coordinates = coordMap(feature.geometry.coordinates, fn);
  }
  return features;
}

function coordMap(array: unknown, fn: (coord: number[]) => number[]): unknown[] {
  if (isCoord(array)) {
    return fn(array as number[]);
  }

  return (array as unknown[]).map((item) => {
    return coordMap(item, fn);
  });
}

function isCoord(array: unknown) {
  return Array.isArray(array) && Number.isFinite(array[0]) && Number.isFinite(array[1]);
}
