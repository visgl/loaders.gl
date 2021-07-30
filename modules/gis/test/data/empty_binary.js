/** @type {import('@loaders.gl/schema').BinaryFeatures}  */
const EMPTY_BINARY_DATA = {
  points: {
    type: 'Point',
    positions: {value: new Float32Array(), size: -Infinity},
    globalFeatureIds: {value: new Uint16Array(), size: 1},
    featureIds: {value: new Uint16Array(), size: 1},
    numericProps: {},
    properties: [],
    fields: []
  },
  lines: {
    type: 'LineString',
    pathIndices: {value: new Uint16Array(1), size: 1},
    positions: {value: new Float32Array(), size: -Infinity},
    globalFeatureIds: {value: new Uint16Array(), size: 1},
    featureIds: {value: new Uint16Array(), size: 1},
    numericProps: {},
    properties: [],
    fields: []
  },
  polygons: {
    type: 'Polygon',
    polygonIndices: {value: new Uint16Array(1), size: 1},
    primitivePolygonIndices: {value: new Uint16Array(1), size: 1},
    positions: {value: new Float32Array(), size: -Infinity},
    globalFeatureIds: {value: new Uint16Array(), size: 1},
    featureIds: {value: new Uint16Array(), size: 1},
    numericProps: {},
    properties: [],
    fields: []
  }
};

export default EMPTY_BINARY_DATA;
