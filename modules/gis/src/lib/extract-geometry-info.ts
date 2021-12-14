import {Feature, GeojsonGeometryInfo} from '@loaders.gl/schema';

/**
 *  Initial scan over GeoJSON features
 *  Counts number of coordinates of each geometry type and
 *  keeps track of the max coordinate dimensions
 */
// eslint-disable-next-line complexity, max-statements
export function extractGeometryInfo(features: Feature[]): GeojsonGeometryInfo {
  // Counts the number of _positions_, so [x, y, z] counts as one
  let pointPositionsCount = 0;
  let pointFeaturesCount = 0;
  let linePositionsCount = 0;
  let linePathsCount = 0;
  let lineFeaturesCount = 0;
  let polygonPositionsCount = 0;
  let polygonObjectsCount = 0;
  let polygonRingsCount = 0;
  let polygonFeaturesCount = 0;
  const coordLengths = new Set<number>();

  for (const feature of features) {
    const geometry = feature.geometry;
    switch (geometry.type) {
      case 'Point':
        pointFeaturesCount++;
        pointPositionsCount++;
        coordLengths.add(geometry.coordinates.length);
        break;
      case 'MultiPoint':
        pointFeaturesCount++;
        pointPositionsCount += geometry.coordinates.length;
        for (const point of geometry.coordinates) {
          coordLengths.add(point.length);
        }
        break;
      case 'LineString':
        lineFeaturesCount++;
        linePositionsCount += geometry.coordinates.length;
        linePathsCount++;

        for (const coord of geometry.coordinates) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiLineString':
        lineFeaturesCount++;
        for (const line of geometry.coordinates) {
          linePositionsCount += line.length;
          linePathsCount++;

          // eslint-disable-next-line max-depth
          for (const coord of line) {
            coordLengths.add(coord.length);
          }
        }
        break;
      case 'Polygon':
        polygonFeaturesCount++;
        polygonObjectsCount++;
        polygonRingsCount += geometry.coordinates.length;
        const flattened = geometry.coordinates.flat();
        polygonPositionsCount += flattened.length;

        for (const coord of flattened) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiPolygon':
        polygonFeaturesCount++;
        for (const polygon of geometry.coordinates) {
          polygonObjectsCount++;
          polygonRingsCount += polygon.length;
          const flattened = polygon.flat();
          polygonPositionsCount += flattened.length;

          // eslint-disable-next-line max-depth
          for (const coord of flattened) {
            coordLengths.add(coord.length);
          }
        }
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  return {
    coordLength: coordLengths.size > 0 ? Math.max(...coordLengths) : 2,

    pointPositionsCount,
    pointFeaturesCount,
    linePositionsCount,
    linePathsCount,
    lineFeaturesCount,
    polygonPositionsCount,
    polygonObjectsCount,
    polygonRingsCount,
    polygonFeaturesCount
  };
}
