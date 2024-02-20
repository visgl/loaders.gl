// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {earcut} from '@math.gl/polygon';
import {BinaryFeatureCollection as BinaryFeatures} from '@loaders.gl/schema';
import {GeoArrowEncoding} from '@loaders.gl/gis';
import {updateBoundsFromGeoArrowSamples} from './get-arrow-bounds';
import {TypedArray} from '@loaders.gl/loader-utils';

/**
 * Binary geometry type
 */
enum BinaryGeometryType {
  points = 'points',
  lines = 'lines',
  polygons = 'polygons'
}

/**
 * Binary data from geoarrow column and can be used by e.g. deck.gl GeojsonLayer
 */
export type BinaryDataFromGeoArrow = {
  /** Binary format geometries, an array of BinaryFeatureCollection */
  binaryGeometries: BinaryFeatures[];
  /** Boundary of the binary geometries */
  bounds: [number, number, number, number];
  /** Feature types of the binary geometries */
  featureTypes: {polygon: boolean; point: boolean; line: boolean};
  /** (Optional) mean centers of the binary geometries for e.g. polygon filtering */
  meanCenters?: number[][];
};

/**
 * Binary geometry content returned from getBinaryGeometriesFromChunk
 */
type BinaryGeometryContent = {
  // Array of Point feature indexes by vertex
  featureIds: Uint32Array;
  /** Flat coordinate array of e.g. x, y or x,y,z */
  flatCoordinateArray: Float64Array;
  /** Dimention of each position */
  nDim: number;
  /** Array of geometry offsets: the start index of primitive geometry */
  geomOffset: Int32Array;
  /** Array of geometry indicies: the start index of each geometry */
  geometryIndicies: Uint16Array;
  /** (Optional) indices of triangels returned from polygon triangulation (Polygon only) */
  triangles?: Uint32Array;
  /** (Optional) array of mean center of each geometry */
  meanCenters?: Float64Array;
};

/**
 * binary geometry template, see deck.gl BinaryGeometry
 */
export function getBinaryGeometryTemplate() {
  return {
    globalFeatureIds: {value: new Uint32Array(0), size: 1},
    positions: {value: new Float32Array(0), size: 2},
    properties: [],
    numericProps: {},
    featureIds: {value: new Uint32Array(0), size: 1}
  };
}

export type BinaryGeometriesFromArrowOptions = {
  /** option to specify which chunk to get binary geometries from, for progressive rendering */
  chunkIndex?: number;
  /** The offset (beginning index of rows) of input chunk. Used for reconstructing globalFeatureIds in web workers */
  chunkOffset?: number;
  /** option to get mean centers from geometries, for polygon filtering */
  calculateMeanCenters?: boolean;
  /** option to compute the triangle indices by tesselating polygons */
  triangulate?: boolean;
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

  const chunks =
    options?.chunkIndex !== undefined && options?.chunkIndex >= 0
      ? [geoColumn.data[options?.chunkIndex]]
      : geoColumn.data;
  let bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let globalFeatureIdOffset = options?.chunkOffset || 0;
  const binaryGeometries: BinaryFeatures[] = [];

  chunks.forEach((chunk) => {
    const {featureIds, flatCoordinateArray, nDim, geomOffset, triangles} =
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
      // eslint-disable-next-line no-loop-func
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
        ...getBinaryGeometryTemplate(),
        ...(featureTypes.point ? binaryContent : {})
      },
      lines: {
        type: 'LineString',
        ...getBinaryGeometryTemplate(),
        ...(featureTypes.line ? binaryContent : {}),
        pathIndices: {value: featureTypes.line ? geomOffset : new Uint16Array(0), size: 1}
      },
      polygons: {
        type: 'Polygon',
        ...getBinaryGeometryTemplate(),
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

  return {
    binaryGeometries,
    bounds,
    featureTypes,
    ...(options?.calculateMeanCenters
      ? {meanCenters: getMeanCentersFromBinaryGeometries(binaryGeometries)}
      : {})
  };
}

/**
 * Get mean centers from binary geometries
 * @param binaryGeometries binary geometries from geoarrow column, an array of BinaryFeatureCollection
 * @returns mean centers of the binary geometries
 */
export function getMeanCentersFromBinaryGeometries(binaryGeometries: BinaryFeatures[]): number[][] {
  const globalMeanCenters: number[][] = [];
  binaryGeometries.forEach((binaryGeometry: BinaryFeatures) => {
    let binaryGeometryType: keyof typeof BinaryGeometryType | null = null;
    if (binaryGeometry.points && binaryGeometry.points.positions.value.length > 0) {
      binaryGeometryType = BinaryGeometryType.points;
    } else if (binaryGeometry.lines && binaryGeometry.lines.positions.value.length > 0) {
      binaryGeometryType = BinaryGeometryType.lines;
    } else if (binaryGeometry.polygons && binaryGeometry.polygons.positions.value.length > 0) {
      binaryGeometryType = BinaryGeometryType.polygons;
    }

    const binaryContent = binaryGeometryType ? binaryGeometry[binaryGeometryType] : null;
    if (binaryContent && binaryGeometryType !== null) {
      const featureIds = binaryContent.featureIds.value;
      const flatCoordinateArray = binaryContent.positions.value;
      const nDim = binaryContent.positions.size;
      const primitivePolygonIndices =
        binaryContent.type === 'Polygon' ? binaryContent.primitivePolygonIndices?.value : undefined;

      const meanCenters = getMeanCentersFromGeometry(
        featureIds,
        flatCoordinateArray,
        nDim,
        binaryGeometryType,
        primitivePolygonIndices
      );
      meanCenters.forEach((center) => {
        globalMeanCenters.push(center);
      });
    }
  });
  return globalMeanCenters;
}

/**
 * Get mean centers from raw coordinates and feature ids
 * @param featureIds Array of feature ids indexes by vertex
 * @param flatCoordinateArray  Array of vertex, e.g. x, y or x, y, z, positions
 * @param nDim number of dimensions per position
 * @returns - mean centers of each polygon
 */
function getMeanCentersFromGeometry(
  featureIds: TypedArray,
  flatCoordinateArray: TypedArray,
  nDim: number,
  geometryType: keyof typeof BinaryGeometryType,
  primitivePolygonIndices?: TypedArray
) {
  const meanCenters: number[][] = [];
  const vertexCount = flatCoordinateArray.length;
  let vertexIndex = 0;
  let coordIdx = 0;
  let primitiveIdx = 0;
  while (vertexIndex < vertexCount) {
    const featureId = featureIds[vertexIndex / nDim];
    const center = [0, 0];
    let vertexCountInFeature = 0;
    while (vertexIndex < vertexCount && featureIds[coordIdx] === featureId) {
      if (
        geometryType === BinaryGeometryType.polygons &&
        primitivePolygonIndices?.[primitiveIdx] === coordIdx
      ) {
        // skip the first point since it is the same as the last point in each ring for polygons
        vertexIndex += nDim;
        primitiveIdx++;
      } else {
        center[0] += flatCoordinateArray[vertexIndex];
        center[1] += flatCoordinateArray[vertexIndex + 1];
        vertexIndex += nDim;
        vertexCountInFeature++;
      }
      coordIdx += 1;
    }
    center[0] /= vertexCountInFeature;
    center[1] /= vertexCountInFeature;
    meanCenters.push(center);
  }
  return meanCenters;
}

/**
 * get binary geometries from geoarrow column
 * @param chunk one chunk/batch of geoarrow column
 * @param geoEncoding geo encoding of the geoarrow column
 * @param options options for getting binary geometries
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
 * @returns triangle indices or null if invalid polygon and earcut fails
 */
export function getTriangleIndices(
  polygonIndices: Uint16Array,
  primitivePolygonIndices: Int32Array,
  flatCoordinateArray: Float64Array,
  nDim: number
): Uint32Array | null {
  try {
    let primitiveIndex = 0;
    const triangles: number[] = [];
    // loop polygonIndices to get triangles
    for (let i = 0; i < polygonIndices.length - 1; i++) {
      const startIdx = polygonIndices[i];
      const endIdx = polygonIndices[i + 1];
      // get subarray of flatCoordinateArray
      const slicedFlatCoords = flatCoordinateArray.subarray(startIdx * nDim, endIdx * nDim);
      // get holeIndices for earcut
      const holeIndices: number[] = [];
      while (primitivePolygonIndices[primitiveIndex] < endIdx) {
        if (primitivePolygonIndices[primitiveIndex] > startIdx) {
          holeIndices.push(primitivePolygonIndices[primitiveIndex] - startIdx);
        }
        primitiveIndex++;
      }
      // TODO check if each ring is closed
      const triangleIndices = earcut(
        slicedFlatCoords,
        holeIndices.length > 0 ? holeIndices : undefined,
        nDim
      );
      if (triangleIndices.length === 0) {
        throw Error('earcut failed e.g. invalid polygon');
      }
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
  } catch (error) {
    // if earcut fails, return null
    return null;
  }
}

/**
 * get binary polygons from geoarrow polygon column
 * @param chunk one chunk of geoarrow polygon column
 * @param geoEncoding the geo encoding of the geoarrow polygon column
 * @param options options for getting binary geometries
 * @returns BinaryGeometryContent
 */
// eslint-disable-next-line complexity
function getBinaryPolygonsFromChunk(
  chunk: arrow.Data,
  geoEncoding: string,
  options?: BinaryGeometriesFromArrowOptions
): BinaryGeometryContent {
  const isMultiPolygon = geoEncoding === 'geoarrow.multipolygon';

  const polygonData = isMultiPolygon ? chunk.children[0] : chunk;
  const ringData = polygonData.children[0];
  const pointData = ringData.children[0];
  const coordData = pointData.children[0];
  const nDim = pointData.stride;
  const flatCoordinateArray = coordData.values;

  const geomOffset =
    ringData.length === ringData.valueOffsets.length - 1
      ? ringData.valueOffsets
      : ringData.valueOffsets.slice(0, ringData.length + 1);

  const polygonOffset = polygonData.valueOffsets;

  // const partData = isMultiPolygon
  //   ? chunk.valueOffsets.map((i) => polygonOffset.at(i) || i)
  //   : chunk.valueOffsets;
  const partData: number[] = [];
  for (let i = 0; i < chunk.length + 1; i++) {
    partData.push(
      isMultiPolygon ? polygonOffset[chunk.valueOffsets[i]] || i : chunk.valueOffsets[i]
    );
  }

  // const geometryIndicies = new Uint16Array(polygonOffset.length);
  const geometryIndicies = new Uint16Array(polygonData.length + 1);
  for (let i = 0; i < polygonData.length + 1; i++) {
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

  const triangles = options?.triangulate
    ? getTriangleIndices(geometryIndicies, geomOffset, flatCoordinateArray, nDim)
    : null;

  return {
    featureIds,
    nDim,
    flatCoordinateArray,
    geomOffset,
    geometryIndicies,
    ...(options?.triangulate && triangles ? {triangles} : {})
  };
}

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

  if (isMultiLineString) {
    const partData = chunk.valueOffsets;
    for (let i = 0; i < partData.length - 1; i++) {
      const startIdx = geomOffset[partData[i]];
      const endIdx = geomOffset[partData[i + 1]];
      for (let j = startIdx; j < endIdx; j++) {
        featureIds[j] = i;
      }
    }
  } else {
    for (let i = 0; i < chunk.length; i++) {
      const startIdx = geomOffset[i];
      const endIdx = geomOffset[i + 1];
      for (let j = startIdx; j < endIdx; j++) {
        featureIds[j] = i;
      }
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

  if (isMultiPoint) {
    const partData = chunk.valueOffsets;
    for (let i = 0; i < partData.length - 1; i++) {
      const startIdx = partData[i];
      const endIdx = partData[i + 1];
      for (let j = startIdx; j < endIdx; j++) {
        featureIds[j] = i;
      }
    }
  } else {
    for (let i = 0; i < chunk.length; i++) {
      featureIds[i] = i;
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
