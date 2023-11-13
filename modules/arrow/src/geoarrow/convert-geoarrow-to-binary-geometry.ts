// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {earcut} from '@math/polygon';
import {BinaryFeatureCollection as BinaryFeatures} from '@loaders.gl/schema';
import {GeoArrowEncoding} from '@loaders.gl/gis';
import {updateBoundsFromGeoArrowSamples} from './get-arrow-bounds';

/**
 * Binary data from geoarrow column and can be used by e.g. deck.gl GeojsonLayer
 */
export type BinaryDataFromGeoArrow = {
  binaryGeometries: BinaryFeatures[];
  bounds: [number, number, number, number];
  featureTypes: {polygon: boolean; point: boolean; line: boolean};
};

type BinaryGeometryContent = {
  featureIds: Uint32Array;
  flatCoordinateArray: Float64Array;
  nDim: number;
  geomOffset: Int32Array;
  geometryIndicies: Uint16Array;
  triangles?: Uint32Array;
};

// binary geometry template, see deck.gl BinaryGeometry
export const BINARY_GEOMETRY_TEMPLATE = {
  globalFeatureIds: {value: new Uint32Array(0), size: 1},
  positions: {value: new Float32Array(0), size: 2},
  properties: [],
  numericProps: {},
  featureIds: {value: new Uint32Array(0), size: 1}
};

export type BinaryGeometriesFromArrowOptions = {
  meanCenter?: boolean;
};

/**
 * get binary geometries from geoarrow column
 *
 * @param geoColumn the geoarrow column, e.g. arrowTable.getChildAt(geoColumnIndex)
 * @param geoEncoding the geo encoding of the geoarrow column, e.g. getGeoArrowEncoding(arrowTable.schema, geoColumnName)
 * @param options options for getting binary geometries {meanCenter: boolean}
 * @returns BinaryDataFromGeoArrow
 */
export function getBinaryGeometriesFromArrow(
  geoColumn: arrow.Vector,
  geoEncoding: GeoArrowEncoding,
  options?: BinaryGeometriesFromArrowOptions
): BinaryDataFromGeoArrow {
  const featureTypes = {
    polygon: geoEncoding === 'geoarrow.multipolygon' || geoEncoding === 'geoarrow.polygon',
    point: geoEncoding === 'geoarrow.multipoint' || geoEncoding === 'geoarrow.point',
    line: geoEncoding === 'geoarrow.multilinestring' || geoEncoding === 'geoarrow.linestring'
  };

  const chunks = geoColumn.data;
  let bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let globalFeatureIdOffset = 0;
  const binaryGeometries: BinaryFeatures[] = [];

  chunks.forEach((chunk) => {
    const {featureIds, flatCoordinateArray, nDim, geomOffset, triangles, meanCenters} =
      getBinaryGeometriesFromChunk(chunk, geoEncoding, options);

    const globalFeatureIds = new Uint32Array(featureIds.length);
    for (let i = 0; i < featureIds.length; i++) {
      globalFeatureIds[i] = featureIds[i] + globalFeatureIdOffset;
    }

    const binaryContent = {
      globalFeatureIds: {value: globalFeatureIds, size: 1},
      positions: {
        value: flatCoordinateArray,
        size: nDim
      },
      featureIds: {value: featureIds, size: 1},
      properties: [...Array(chunk.length).keys()].map((i) => ({
        index: i + globalFeatureIdOffset
      }))
    };

    // TODO: check if chunks are sequentially accessed
    globalFeatureIdOffset += chunk.length;

    // NOTE: deck.gl defines the BinaryFeatures structure must have points, lines, polygons even if they are empty
    binaryGeometries.push({
      shape: 'binary-feature-collection',
      points: {
        type: 'Point',
        ...BINARY_GEOMETRY_TEMPLATE,
        ...(featureTypes.point ? binaryContent : {})
      },
      lines: {
        type: 'LineString',
        ...BINARY_GEOMETRY_TEMPLATE,
        ...(featureTypes.line ? binaryContent : {}),
        pathIndices: {value: featureTypes.line ? geomOffset : new Uint16Array(0), size: 1}
      },
      polygons: {
        type: 'Polygon',
        ...BINARY_GEOMETRY_TEMPLATE,
        ...(featureTypes.polygon ? binaryContent : {}),
        polygonIndices: {
          // use geomOffset as polygonIndices same as primitivePolygonIndices since we are using earcut to get triangule indices
          value: featureTypes.polygon ? geomOffset : new Uint16Array(0),
          size: 1
        },
        primitivePolygonIndices: {
          value: featureTypes.polygon ? geomOffset : new Uint16Array(0),
          size: 1
        },
        ...(triangles ? {triangles: {value: triangles, size: 1}} : {})
      }
    });

    bounds = updateBoundsFromGeoArrowSamples(flatCoordinateArray, nDim, bounds);
  });

  return {binaryGeometries, bounds, featureTypes};
}

/**
 * get binary geometries from geoarrow column
 * @param chunk one chunk/batch of geoarrow column
 * @param geoEncoding geo encoding of the geoarrow column
 * @param options options for getting binary geometries {meanCenter: boolean}
 * @returns BinaryGeometryContent
 */
function getBinaryGeometriesFromChunk(
  chunk: arrow.Data,
  geoEncoding: GeoArrowEncoding,
  options?: BinaryGeometriesFromArrowOptions
): BinaryGeometryContent {
  switch (geoEncoding) {
    case 'geoarrow.point':
    case 'geoarrow.multipoint':
      return getBinaryPointsFromChunk(chunk, geoEncoding);
    case 'geoarrow.linestring':
    case 'geoarrow.multilinestring':
      return getBinaryLinesFromChunk(chunk, geoEncoding);
    case 'geoarrow.polygon':
    case 'geoarrow.multipolygon':
      return getBinaryPolygonsFromChunk(chunk, geoEncoding, options);
    default:
      throw Error('invalid geoarrow encoding');
  }
}

/**
 * get triangle indices. Allows deck.gl to skip performing costly triangulation on main thread.
 * @param polygonIndices Indices within positions of the start of each simple Polygon
 * @param primitivePolygonIndices Indices within positions of the start of each primitive Polygon/ring
 * @param flatCoordinateArray Array of x, y or x, y, z positions
 * @param nDim - number of dimensions per position
 * @returns
 */
function getTriangleIndices(
  polygonIndices: Uint16Array,
  primitivePolygonIndices: Int32Array,
  flatCoordinateArray: Float64Array,
  nDim: number
): Uint32Array {
  let k = 0;
  const triangles: number[] = [];
  // loop polygonIndices to get triangles
  for (let i = 0; i < polygonIndices.length - 1; i++) {
    const startIdx = polygonIndices[i];
    const endIdx = polygonIndices[i + 1];
    // get subarray of flatCoordinateArray
    const slicedFlatCoords = flatCoordinateArray.subarray(startIdx * nDim, endIdx * nDim);
    // get holeIndices for earcut
    const holeIndices: number[] = [];
    while (primitivePolygonIndices[k] < endIdx) {
      if (primitivePolygonIndices[k] > startIdx) {
        holeIndices.push(primitivePolygonIndices[k] - startIdx);
      }
      k++;
    }
    const triangleIndices = earcut(slicedFlatCoords, holeIndices, nDim);
    for (let j = 0; j < triangleIndices.length; j++) {
      triangles.push(triangleIndices[j] + startIdx);
    }
  }
  // convert traingles to Uint32Array
  const trianglesUint32 = new Uint32Array(triangles.length);
  for (let i = 0; i < triangles.length; i++) {
    trianglesUint32[i] = triangles[i];
  }
  return trianglesUint32;
}

/**
 * get mean centers from polygons
 * @param partOffset Indices within positions of the start of each Polygon/MultiPolygon
 * @param ringOffset Indices within positions of the start of each primitive ring
 * @param flatCoordinateArray  Array of x, y or x, y, z positions
 * @param nDim number of dimensions per position
 * @returns - mean centers of each polygon
 */
function getMeanCentersFromPolygons(
  partOffset: Int32Array,
  ringOffset: Int32Array,
  flatCoordinateArray: Float64Array,
  nDim: number
): Float64Array {
  const centers = new Float64Array(partOffset.length * 2);
  for (let i = 0; i < partOffset.length - 1; i++) {
    const startIdx = ringOffset[partOffset[i]];
    const endIdx = ringOffset[partOffset[i + 1]];
    const center = [0, 0];
    for (let j = startIdx; j < endIdx; j++) {
      center[0] += flatCoordinateArray[j * nDim];
      center[1] += flatCoordinateArray[j * nDim + 1];
    }
    center[0] /= endIdx - startIdx;
    center[1] /= endIdx - startIdx;
    centers[i * 2] = center[0];
    centers[i * 2 + 1] = center[1];
  }
  return centers;
}

/**
 * get binary polygons from geoarrow polygon column
 * @param chunk one chunk of geoarrow polygon column
 * @param geoEncoding the geo encoding of the geoarrow polygon column
 * @returns BinaryGeometryContent
 */
function getBinaryPolygonsFromChunk(
  chunk: arrow.Data,
  geoEncoding: string,
  options?: BinaryGeometriesFromArrowOptions
): BinaryGeometryContent {
  const isMultiPolygon = geoEncoding === 'geoarrow.multipolygon';

  const polygonData = isMultiPolygon ? chunk.children[0] : chunk;
  const polygonOffset = polygonData.valueOffsets;
  const partData = isMultiPolygon
    ? chunk.valueOffsets.map((i) => polygonOffset.at(i) || i)
    : chunk.valueOffsets;
  const ringData = polygonData.children[0];
  const pointData = ringData.children[0];
  const coordData = pointData.children[0];
  const nDim = pointData.stride;
  const geomOffset = ringData.valueOffsets;
  const flatCoordinateArray = coordData.values;

  const geometryIndicies = new Uint16Array(polygonOffset.length);
  for (let i = 0; i < polygonOffset.length; i++) {
    geometryIndicies[i] = geomOffset[polygonOffset[i]];
  }

  const numOfVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numOfVertices);
  for (let i = 0; i < partData.length - 1; i++) {
    const startIdx = geomOffset[partData[i]];
    const endIdx = geomOffset[partData[i + 1]];
    for (let j = startIdx; j < endIdx; j++) {
      featureIds[j] = i;
    }
  }

  const triangles = getTriangleIndices(geometryIndicies, geomOffset, flatCoordinateArray, nDim);

  return {
    featureIds,
    flatCoordinateArray,
    nDim,
    geomOffset,
    geometryIndicies,
    triangles,
    ...(options?.meanCenter
      ? {meanCenters: getMeanCentersFromPolygons(partData, geomOffset, flatCoordinateArray, nDim)}
      : {})
  };
}

// function getMeanCentersFromLines(): Float64Array {
//   return new Float64Array(0);
// }

/**
 * get binary lines from geoarrow line column
 * @param chunk one chunk/batch of geoarrow column
 * @param geoEncoding the geo encoding of the geoarrow column
 * @returns BinaryGeometryContent
 */
function getBinaryLinesFromChunk(chunk: arrow.Data, geoEncoding: string): BinaryGeometryContent {
  const isMultiLineString = geoEncoding === 'geoarrow.multilinestring';

  const lineData = isMultiLineString ? chunk.children[0] : chunk;
  const pointData = lineData.children[0];
  const coordData = pointData.children[0];

  const nDim = pointData.stride;
  const geomOffset = lineData.valueOffsets;
  const flatCoordinateArray = coordData.values;

  // geometryIndicies is not needed for line string
  const geometryIndicies = new Uint16Array(0);

  const numOfVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numOfVertices);
  for (let i = 0; i < chunk.length; i++) {
    const startIdx = geomOffset[i];
    const endIdx = geomOffset[i + 1];
    for (let j = startIdx; j < endIdx; j++) {
      featureIds[j] = i;
    }
  }

  return {
    featureIds,
    flatCoordinateArray,
    nDim,
    geomOffset,
    geometryIndicies
  };
}

/**
 * get binary points from geoarrow point column
 * @param chunk one chunk/batch of geoarrow column
 * @param geoEncoding  geo encoding of the geoarrow column
 * @returns BinaryGeometryContent
 */
function getBinaryPointsFromChunk(chunk: arrow.Data, geoEncoding: string): BinaryGeometryContent {
  const isMultiPoint = geoEncoding === 'geoarrow.multipoint';

  const pointData = isMultiPoint ? chunk.children[0] : chunk;
  const coordData = pointData.children[0];

  const nDim = pointData.stride;
  const flatCoordinateArray = coordData.values;

  // geometryIndices is not needed for point
  const geometryIndicies = new Uint16Array(0);
  // geomOffset is not needed for point
  const geomOffset = new Int32Array(0);

  const numOfVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numOfVertices);
  for (let i = 0; i < chunk.length; i++) {
    featureIds[i] = i;
  }

  return {
    featureIds,
    flatCoordinateArray,
    nDim,
    geomOffset,
    geometryIndicies
  };
}
