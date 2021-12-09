import {Feature} from '@loaders.gl/schema';
import type {BinaryFeatures} from '@loaders.gl/schema';
import {geojsonToFlatGeojson} from './geojson-to-flatGeojson';
import {flatGeojsonToBinary} from './flatGeojson-to-binary';

export type GeojsonToBinaryOptions = {
  coordLength?: number;
  numericPropKeys?: string[];
  PositionDataType?: Float32ArrayConstructor | Float64ArrayConstructor;
};

/** Convert GeoJSON features to flat binary arrays */
export function geojsonToBinary(
  features: Feature[],
  options: GeojsonToBinaryOptions = {}
): BinaryFeatures {
  const firstPassData = firstPass(features);
  const flatFeatures = geojsonToFlatGeojson(features);
  return flatGeojsonToBinary(flatFeatures, firstPassData, {
    coordLength: options.coordLength || firstPassData.coordLength,
    numericPropKeys: options.numericPropKeys || firstPassData.numericPropKeys,
    PositionDataType: options.PositionDataType || Float32Array
  });
}

export const TEST_EXPORTS = {
  firstPass
};

type PropArrayConstructor = Float32ArrayConstructor | Float64ArrayConstructor | ArrayConstructor;

type FirstPassData = {
  coordLength: number;
  numericPropKeys: string[];
  propArrayTypes: {[key: string]: PropArrayConstructor};

  pointPositionsCount: number;
  pointFeaturesCount: number;
  linePositionsCount: number;
  linePathsCount: number;
  lineFeaturesCount: number;
  polygonPositionsCount: number;
  polygonObjectsCount: number;
  polygonRingsCount: number;
  polygonFeaturesCount: number;
};

/**
 *  Initial scan over GeoJSON features
 *  Counts number of coordinates of each geometry type and
 *  keeps track of the max coordinate dimensions
 */
// eslint-disable-next-line complexity, max-statements
function firstPass(features: Feature[]): FirstPassData {
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
  const propArrayTypes = {};

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
        polygonPositionsCount += flatten(geometry.coordinates).length;

        for (const coord of flatten(geometry.coordinates)) {
          coordLengths.add(coord.length);
        }
        break;
      case 'MultiPolygon':
        polygonFeaturesCount++;
        for (const polygon of geometry.coordinates) {
          polygonObjectsCount++;
          polygonRingsCount += polygon.length;
          polygonPositionsCount += flatten(polygon).length;

          // eslint-disable-next-line max-depth
          for (const coord of flatten(polygon)) {
            coordLengths.add(coord.length);
          }
        }
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }

    if (feature.properties) {
      for (const key in feature.properties) {
        const val = feature.properties[key];

        // If property has not been seen before, or if property has been numeric
        // in all previous features, check if numeric in this feature
        // If not numeric, Array is stored to prevent rechecking in the future
        // Additionally, detects if 64 bit precision is required
        propArrayTypes[key] = deduceArrayType(val, propArrayTypes[key]);
      }
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
    polygonFeaturesCount,

    // Array of keys whose values are always numeric
    numericPropKeys: Object.keys(propArrayTypes).filter((k) => propArrayTypes[k] !== Array),
    propArrayTypes
  };
}

// TODO - how does this work? Different `coordinates` have different nesting
function flatten(arrays): number[][] {
  return [].concat(...arrays);
}

function deduceArrayType(x: any, constructor: PropArrayConstructor): PropArrayConstructor {
  if (constructor === Array || !Number.isFinite(x)) {
    return Array;
  }

  // If this or previous value required 64bits use Float64Array
  return constructor === Float64Array || Math.fround(x) !== x ? Float64Array : Float32Array;
}
