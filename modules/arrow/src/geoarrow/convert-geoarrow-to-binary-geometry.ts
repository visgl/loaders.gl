// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import {Data, Vector} from 'apache-arrow';
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
};

// binary geometry template, see deck.gl BinaryGeometry
export const BINARY_GEOMETRY_TEMPLATE = {
  globalFeatureIds: {value: new Uint32Array(0), size: 1},
  positions: {value: new Float32Array(0), size: 2},
  properties: [],
  numericProps: {},
  featureIds: {value: new Uint32Array(0), size: 1}
};

/**
 * get binary geometries from geoarrow column
 *
 * @param geoColumn the geoarrow column, e.g. arrowTable.getChildAt(geoColumnIndex)
 * @param geoEncoding the geo encoding of the geoarrow column, e.g. getGeoArrowEncoding(arrowTable.schema, geoColumnName)
 * @returns BinaryDataFromGeoArrow
 */
export function getBinaryGeometriesFromArrow(
  geoColumn: Vector,
  geoEncoding: GeoArrowEncoding
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
    const {featureIds, flatCoordinateArray, nDim, geomOffset} = getBinaryGeometriesFromChunk(
      chunk,
      geoEncoding
    );

    const numOfVertices = flatCoordinateArray.length / nDim;
    const globalFeatureIds = new Uint32Array(numOfVertices);
    for (let i = 0; i < numOfVertices; i++) {
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
          // TODO why deck.gl's tessellatePolygon performance is not good when using geometryIndicies
          // even when there is no hole in any polygon
          value: featureTypes.polygon ? geomOffset : new Uint16Array(0),
          size: 1
        },
        primitivePolygonIndices: {
          value: featureTypes.polygon ? geomOffset : new Uint16Array(0),
          size: 1
        }
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
 * @returns BinaryGeometryContent
 */
function getBinaryGeometriesFromChunk(
  chunk: Data,
  geoEncoding: GeoArrowEncoding
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
      return getBinaryPolygonsFromChunk(chunk, geoEncoding);
    default:
      throw Error('invalid geoarrow encoding');
  }
}

/**
 * get binary polygons from geoarrow polygon column
 * @param chunk one chunk of geoarrow polygon column
 * @param geoEncoding the geo encoding of the geoarrow polygon column
 * @returns BinaryGeometryContent
 */
function getBinaryPolygonsFromChunk(chunk: Data, geoEncoding: string): BinaryGeometryContent {
  const isMultiPolygon = geoEncoding === 'geoarrow.multipolygon';

  const polygonData = isMultiPolygon ? chunk.children[0] : chunk;
  const ringData = polygonData.children[0];
  const pointData = ringData.children[0];
  const coordData = pointData.children[0];
  const nDim = pointData.stride;
  const geomOffset = ringData.valueOffsets;
  const flatCoordinateArray = coordData.values;

  const geometryIndicies = new Uint16Array(chunk.length + 1);
  for (let i = 0; i < chunk.length; i++) {
    geometryIndicies[i] = geomOffset[chunk.valueOffsets[i]];
  }
  geometryIndicies[chunk.length] = flatCoordinateArray.length / nDim;

  const numOfVertices = flatCoordinateArray.length / nDim;
  const featureIds = new Uint32Array(numOfVertices);
  for (let i = 0; i < chunk.length - 1; i++) {
    const startIdx = geomOffset[chunk.valueOffsets[i]];
    const endIdx = geomOffset[chunk.valueOffsets[i + 1]];
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
 * get binary lines from geoarrow line column
 * @param chunk one chunk/batch of geoarrow column
 * @param geoEncoding the geo encoding of the geoarrow column
 * @returns BinaryGeometryContent
 */
function getBinaryLinesFromChunk(chunk: Data, geoEncoding: string): BinaryGeometryContent {
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
function getBinaryPointsFromChunk(chunk: Data, geoEncoding: string): BinaryGeometryContent {
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
