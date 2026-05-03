// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {earcut} from '@math.gl/polygon';
import type {BinaryFeatureCollection} from '@loaders.gl/schema';
import {TypedArray} from '@loaders.gl/loader-utils';
import type {GeoArrowEncoding} from '../../metadata/geoarrow-metadata';
import {updateBoundsFromGeoArrowSamples} from '../../get-arrow-bounds';

enum BinaryGeometryType {
  points = 'points',
  lines = 'lines',
  polygons = 'polygons'
}

/**
 * Binary data from a GeoArrow column.
 */
export type BinaryDataFromGeoArrow = {
  binaryGeometries: BinaryFeatureCollection[];
  bounds: [number, number, number, number];
  featureTypes: {polygon: boolean; point: boolean; line: boolean};
  meanCenters?: number[][];
};

type BinaryGeometryContent = {
  featureIds: Uint32Array;
  flatCoordinateArray: Float64Array;
  nDim: number;
  geomOffset: Int32Array;
  geometryIndexes: Uint16Array;
  triangles?: Uint32Array;
  meanCenters?: Float64Array;
};

export type BinaryGeometriesFromArrowOptions = {
  chunkIndex?: number;
  chunkOffset?: number;
  calculateMeanCenters?: boolean;
  triangulate?: boolean;
};

/**
 * Converts a GeoArrow geometry column to binary feature collections.
 */
export function convertGeoArrowToBinaryFeatureCollection(
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
    options?.chunkIndex !== undefined && options.chunkIndex >= 0
      ? [geoColumn.data[options.chunkIndex]]
      : geoColumn.data;
  let bounds: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  let globalFeatureIdOffset = options?.chunkOffset || 0;
  const binaryGeometries: BinaryFeatureCollection[] = [];

  chunks.forEach(chunk => {
    const {featureIds, flatCoordinateArray, nDim, geomOffset, triangles} =
      getBinaryGeometriesFromChunk(chunk, geoEncoding, options);

    const globalFeatureIds = new Uint32Array(featureIds.length);
    for (let featureIndex = 0; featureIndex < featureIds.length; featureIndex++) {
      globalFeatureIds[featureIndex] = featureIds[featureIndex] + globalFeatureIdOffset;
    }

    const binaryContent = {
      globalFeatureIds: {value: globalFeatureIds, size: 1},
      positions: {value: flatCoordinateArray, size: nDim},
      featureIds: {value: featureIds, size: 1},
      properties: [...Array(chunk.length).keys()].map(index => ({
        index: index + globalFeatureIdOffset
      }))
    };

    globalFeatureIdOffset += chunk.length;
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

export function getBinaryGeometryTemplate() {
  return {
    globalFeatureIds: {value: new Uint32Array(0), size: 1},
    positions: {value: new Float32Array(0), size: 2},
    properties: [],
    numericProps: {},
    featureIds: {value: new Uint32Array(0), size: 1}
  };
}

export function getMeanCentersFromBinaryGeometries(
  binaryGeometries: BinaryFeatureCollection[]
): number[][] {
  const globalMeanCenters: number[][] = [];
  binaryGeometries.forEach(binaryGeometry => {
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
      const primitivePolygonIndices =
        binaryContent.type === 'Polygon' ? binaryContent.primitivePolygonIndices?.value : undefined;

      getMeanCentersFromGeometry(
        binaryContent.featureIds.value,
        binaryContent.positions.value,
        binaryContent.positions.size,
        binaryGeometryType,
        primitivePolygonIndices
      ).forEach(center => {
        globalMeanCenters.push(center);
      });
    }
  });

  return globalMeanCenters;
}

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
  let coordinateIndex = 0;
  let primitiveIndex = 0;
  while (vertexIndex < vertexCount) {
    const featureId = featureIds[vertexIndex / nDim];
    const center = [0, 0];
    let vertexCountInFeature = 0;
    while (vertexIndex < vertexCount && featureIds[coordinateIndex] === featureId) {
      if (
        geometryType === BinaryGeometryType.polygons &&
        primitivePolygonIndices?.[primitiveIndex] === coordinateIndex
      ) {
        vertexIndex += nDim;
        primitiveIndex++;
      } else {
        center[0] += flatCoordinateArray[vertexIndex];
        center[1] += flatCoordinateArray[vertexIndex + 1];
        vertexIndex += nDim;
        vertexCountInFeature++;
      }
      coordinateIndex += 1;
    }
    center[0] /= vertexCountInFeature;
    center[1] /= vertexCountInFeature;
    meanCenters.push(center);
  }
  return meanCenters;
}

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

export function getTriangleIndices(
  polygonIndices: Uint16Array,
  primitivePolygonIndices: Int32Array,
  flatCoordinateArray: Float64Array,
  nDim: number
): Uint32Array | null {
  try {
    let primitiveIndex = 0;
    const triangles: number[] = [];
    for (let polygonIndex = 0; polygonIndex < polygonIndices.length - 1; polygonIndex++) {
      const startIndex = polygonIndices[polygonIndex];
      const endIndex = polygonIndices[polygonIndex + 1];
      const slicedFlatCoords = flatCoordinateArray.subarray(startIndex * nDim, endIndex * nDim);
      const holeIndices: number[] = [];
      while (primitivePolygonIndices[primitiveIndex] < endIndex) {
        if (primitivePolygonIndices[primitiveIndex] > startIndex) {
          holeIndices.push(primitivePolygonIndices[primitiveIndex] - startIndex);
        }
        primitiveIndex++;
      }
      const triangleIndices = earcut(
        slicedFlatCoords,
        holeIndices.length > 0 ? holeIndices : undefined,
        nDim
      );
      if (triangleIndices.length === 0) {
        throw Error('earcut failed e.g. invalid polygon');
      }
      for (let triangleIndex = 0; triangleIndex < triangleIndices.length; triangleIndex++) {
        triangles.push(triangleIndices[triangleIndex] + startIndex);
      }
    }

    const trianglesUint32 = new Uint32Array(triangles.length);
    for (let triangleIndex = 0; triangleIndex < triangles.length; triangleIndex++) {
      trianglesUint32[triangleIndex] = triangles[triangleIndex];
    }
    return trianglesUint32;
  } catch {
    return null;
  }
}

function getBinaryPolygonsFromChunk(
  chunk: arrow.Data,
  geoEncoding: string,
  options?: BinaryGeometriesFromArrowOptions
): BinaryGeometryContent {
  const isMultiPolygon = geoEncoding === 'geoarrow.multipolygon';

  const polygonData = isMultiPolygon ? chunk.children[0] : chunk;
  const polygonOffset = polygonData.valueOffsets;
  const partData = isMultiPolygon
    ? chunk.valueOffsets.map(index => polygonOffset.at(index) || index)
    : chunk.valueOffsets;
  const ringData = polygonData.children[0];
  const pointData = ringData.children[0];
  const coordData = pointData.children[0];
  const nDim = pointData.stride;
  const geomOffset = ringData.valueOffsets;
  const flatCoordinateArray = coordData.values;

  const geometryIndexes = new Uint16Array(polygonOffset.length);
  for (let polygonIndex = 0; polygonIndex < polygonOffset.length; polygonIndex++) {
    geometryIndexes[polygonIndex] = geomOffset[polygonOffset[polygonIndex]];
  }

  const numVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numVertices);
  for (let featureIndex = 0; featureIndex < partData.length - 1; featureIndex++) {
    const startIndex = geomOffset[partData[featureIndex]];
    const endIndex = geomOffset[partData[featureIndex + 1]];
    for (let vertexIndex = startIndex; vertexIndex < endIndex; vertexIndex++) {
      featureIds[vertexIndex] = featureIndex;
    }
  }

  const triangles = options?.triangulate
    ? getTriangleIndices(geometryIndexes, geomOffset, flatCoordinateArray, nDim)
    : null;

  return {
    featureIds,
    nDim,
    flatCoordinateArray,
    geomOffset,
    geometryIndexes,
    ...(options?.triangulate && triangles ? {triangles} : {})
  };
}

function getBinaryLinesFromChunk(chunk: arrow.Data, geoEncoding: string): BinaryGeometryContent {
  const isMultiLineString = geoEncoding === 'geoarrow.multilinestring';

  const lineData = isMultiLineString ? chunk.children[0] : chunk;
  const pointData = lineData.children[0];
  const coordData = pointData.children[0];

  const nDim = pointData.stride;
  const geomOffset = lineData.valueOffsets;
  const flatCoordinateArray = coordData.values;
  const geometryIndexes = new Uint16Array(0);

  const numVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numVertices);

  if (isMultiLineString) {
    const partData = chunk.valueOffsets;
    for (let featureIndex = 0; featureIndex < partData.length - 1; featureIndex++) {
      const startIndex = geomOffset[partData[featureIndex]];
      const endIndex = geomOffset[partData[featureIndex + 1]];
      for (let vertexIndex = startIndex; vertexIndex < endIndex; vertexIndex++) {
        featureIds[vertexIndex] = featureIndex;
      }
    }
  } else {
    for (let featureIndex = 0; featureIndex < chunk.length; featureIndex++) {
      const startIndex = geomOffset[featureIndex];
      const endIndex = geomOffset[featureIndex + 1];
      for (let vertexIndex = startIndex; vertexIndex < endIndex; vertexIndex++) {
        featureIds[vertexIndex] = featureIndex;
      }
    }
  }

  return {
    featureIds,
    flatCoordinateArray,
    nDim,
    geomOffset,
    geometryIndexes
  };
}

function getBinaryPointsFromChunk(chunk: arrow.Data, geoEncoding: string): BinaryGeometryContent {
  const isMultiPoint = geoEncoding === 'geoarrow.multipoint';

  const pointData = isMultiPoint ? chunk.children[0] : chunk;
  const coordData = pointData.children[0];

  const nDim = pointData.stride;
  const flatCoordinateArray = coordData.values;
  const geometryIndexes = new Uint16Array(0);
  const geomOffset = new Int32Array(0);

  const numVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numVertices);

  if (isMultiPoint) {
    const partData = chunk.valueOffsets;
    for (let featureIndex = 0; featureIndex < partData.length - 1; featureIndex++) {
      const startIndex = partData[featureIndex];
      const endIndex = partData[featureIndex + 1];
      for (let vertexIndex = startIndex; vertexIndex < endIndex; vertexIndex++) {
        featureIds[vertexIndex] = featureIndex;
      }
    }
  } else {
    for (let featureIndex = 0; featureIndex < chunk.length; featureIndex++) {
      featureIds[featureIndex] = featureIndex;
    }
  }

  return {
    featureIds,
    flatCoordinateArray,
    nDim,
    geomOffset,
    geometryIndexes
  };
}
