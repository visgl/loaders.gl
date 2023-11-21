// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

import test, {Test} from 'tape-promise/tape';

import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';
import {load} from '@loaders.gl/core';
import {
  BINARY_GEOMETRY_TEMPLATE,
  ArrowLoader,
  getBinaryGeometriesFromArrow,
  serializeArrowSchema
} from '@loaders.gl/arrow';

import {
  GEOARROW_POINT_FILE,
  GEOARROW_MULTIPOINT_FILE,
  GEOARROW_LINE_FILE,
  GEOARROW_MULTILINE_FILE,
  GEOARROW_POLYGON_FILE,
  GEOARROW_MULTIPOLYGON_FILE,
  GEOARROW_MULTIPOLYGON_HOLE_FILE
} from '../data/geoarrow/test-cases';

const expectedPointBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point',
        globalFeatureIds: {value: new Uint32Array([0, 1]), size: 1},
        positions: {value: new Float64Array([1, 1, 2, 2]), size: 2},
        properties: [{index: 0}, {index: 1}],
        featureIds: {value: new Uint32Array([0, 1]), size: 1}
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        pathIndices: {value: new Uint16Array(0), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        polygonIndices: {value: new Uint16Array(0), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(0), size: 1}
      }
    }
  ],
  bounds: [1, 1, 2, 2],
  featureTypes: {polygon: false, point: true, line: false},
  meanCenters: [
    [1, 1],
    [2, 2]
  ]
};

const expectedMultiPointBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point',
        globalFeatureIds: {value: new Uint32Array([0, 0, 1, 1]), size: 1},
        positions: {value: new Float64Array([1, 1, 2, 2, 3, 3, 4, 4]), size: 2},
        properties: [{index: 0}, {index: 1}],
        featureIds: {value: new Uint32Array([0, 0, 1, 1]), size: 1}
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        pathIndices: {value: new Uint16Array(0), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        polygonIndices: {value: new Uint16Array(0), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(0), size: 1}
      }
    }
  ],
  bounds: [1, 1, 4, 4],
  featureTypes: {polygon: false, point: true, line: false},
  meanCenters: [
    [1.5, 1.5],
    [3.5, 3.5]
  ]
};

const expectedLineBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point'
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        globalFeatureIds: {value: new Uint32Array([0, 0, 1, 1]), size: 1},
        positions: {value: new Float64Array([0, 0, 1, 1, 2, 2, 3, 3]), size: 2},
        properties: [{index: 0}, {index: 1}],
        featureIds: {value: new Uint32Array([0, 0, 1, 1]), size: 1},
        pathIndices: {value: new Int32Array([0, 2, 4]), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        polygonIndices: {value: new Uint16Array(0), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(0), size: 1}
      }
    }
  ],
  bounds: [0, 0, 3, 3],
  featureTypes: {polygon: false, point: false, line: true},
  meanCenters: [
    [0.5, 0.5],
    [2.5, 2.5]
  ]
};

const expectedMultiLineBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point'
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        globalFeatureIds: {value: new Uint32Array([0, 0, 0, 0, 1, 1, 1, 1]), size: 1},
        positions: {
          value: new Float64Array([1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8]),
          size: 2
        },
        properties: [{index: 0}, {index: 1}],
        featureIds: {value: new Uint32Array([0, 0, 0, 0, 1, 1, 1, 1]), size: 1},
        pathIndices: {value: new Int32Array([0, 2, 4, 6, 8]), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        polygonIndices: {value: new Uint16Array(0), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(0), size: 1}
      }
    }
  ],
  bounds: [1, 1, 8, 8],
  featureTypes: {polygon: false, point: false, line: true},
  meanCenters: [
    [2.5, 2.5],
    [6.5, 6.5]
  ]
};

const expectedPolygonBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point'
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        pathIndices: {value: new Uint16Array(0), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        globalFeatureIds: {
          value: new Uint32Array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1]),
          size: 1
        },
        positions: {
          value: new Float64Array([
            0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 10, 10, 10, 11, 11, 11, 11, 10, 10, 10
          ]),
          size: 2
        },
        properties: [{index: 0}, {index: 1}],
        featureIds: {value: new Uint32Array([0, 0, 0, 0, 0, 1, 1, 1, 1, 1]), size: 1},
        polygonIndices: {value: new Int32Array([0, 5, 10]), size: 1},
        primitivePolygonIndices: {value: new Int32Array([0, 5, 10]), size: 1},
        triangles: {value: new Uint32Array([1, 4, 3, 3, 2, 1, 6, 9, 8, 8, 7, 6]), size: 1}
      }
    }
  ],
  bounds: [0, 0, 11, 11],
  featureTypes: {polygon: true, point: false, line: false},
  meanCenters: [
    [0.5, 0.5],
    [10.5, 10.5]
  ]
};

const expectedMultiPolygonBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point'
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        pathIndices: {value: new Uint16Array(0), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        globalFeatureIds: {
          value: new Uint32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          size: 1
        },
        positions: {
          value: new Float64Array([0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2]),
          size: 2
        },
        properties: [{index: 0}],
        featureIds: {
          value: new Uint32Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
          size: 1
        },
        polygonIndices: {value: new Int32Array([0, 5, 10]), size: 1},
        primitivePolygonIndices: {value: new Int32Array([0, 5, 10]), size: 1},
        triangles: {value: new Uint32Array([1, 4, 3, 3, 2, 1, 6, 9, 8, 8, 7, 6]), size: 1}
      }
    }
  ],
  bounds: [0, 0, 3, 3],
  featureTypes: {polygon: true, point: false, line: false},
  meanCenters: [[1.5, 1.5]]
};

const expectedMultiPolygonHolesBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point'
      },
      lines: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'LineString',
        pathIndices: {value: new Uint16Array(0), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        globalFeatureIds: {
          value: new Uint32Array([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
          ]),
          size: 1
        },
        positions: {
          value: new Float64Array([
            0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0.25, 0.25, 0.25, 0.75, 0.75, 0.75, 0.75, 0.25, 0.25,
            0.25, 2, 2, 2, 3, 3, 3, 3, 2, 2, 2, 10, 10, 10, 11, 11, 11, 11, 10, 10, 10, 10.25,
            10.25, 10.25, 10.75, 10.75, 10.75, 10.75, 10.25, 10.25, 10.25, 12, 12, 12, 13, 13, 13,
            13, 12, 12, 12
          ]),
          size: 2
        },
        properties: [{index: 0}, {index: 1}],
        featureIds: {
          value: new Uint32Array([
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
          ]),
          size: 1
        },
        // NOTE: should polygonIndices be [0, 15, 30] or [0, 10, 15, 25, 30]?
        polygonIndices: {value: new Int32Array([0, 5, 10, 15, 20, 25, 30]), size: 1},
        primitivePolygonIndices: {value: new Int32Array([0, 5, 10, 15, 20, 25, 30]), size: 1},
        triangles: {
          value: new Uint32Array([
            4, 5, 6, 8, 5, 4, 1, 4, 6, 8, 4, 3, 2, 1, 6, 7, 8, 3, 2, 6, 7, 7, 3, 2, 11, 14, 13, 13,
            12, 11, 19, 20, 21, 23, 20, 19, 16, 19, 21, 23, 19, 18, 17, 16, 21, 22, 23, 18, 17, 21,
            22, 22, 18, 17, 26, 29, 28, 28, 27, 26
          ]),
          size: 1
        }
      }
    }
  ],
  bounds: [0, 0, 13, 13],
  featureTypes: {polygon: true, point: false, line: false},
  meanCenters: [
    [1.1666666666666667, 1.1666666666666667],
    [11.166666666666666, 11.166666666666666]
  ]
};

test('ArrowUtils#getBinaryGeometriesFromArrow', async (t) => {
  const testCases = [
    [GEOARROW_POINT_FILE, expectedPointBinaryGeometry],
    [GEOARROW_MULTIPOINT_FILE, expectedMultiPointBinaryGeometry],
    [GEOARROW_LINE_FILE, expectedLineBinaryGeometry],
    [GEOARROW_MULTILINE_FILE, expectedMultiLineBinaryGeometry],
    [GEOARROW_POLYGON_FILE, expectedPolygonBinaryGeometry],
    [GEOARROW_MULTIPOLYGON_FILE, expectedMultiPolygonBinaryGeometry],
    [GEOARROW_MULTIPOLYGON_HOLE_FILE, expectedMultiPolygonHolesBinaryGeometry]
  ];

  for (const testCase of testCases) {
    await testGetBinaryGeometriesFromArrow(t, testCase[0], testCase[1]);
  }

  t.end();
});

async function testGetBinaryGeometriesFromArrow(
  t: Test,
  arrowFile,
  expectedBinaryGeometries
): Promise<void> {
  const arrowTable = await load(arrowFile, ArrowLoader, {
    worker: false,
    arrow: {
      shape: 'arrow-table'
    }
  });

  t.equal(arrowTable.shape, 'arrow-table');

  if (arrowTable.shape === 'arrow-table') {
    const table = arrowTable.data;
    const geoColumn = table.getChild('geometry');
    t.notEqual(geoColumn, null, 'geoColumn is not null');

    const schema = serializeArrowSchema(table.schema);
    const geometryColumns = getGeometryColumnsFromSchema(schema);
    const encoding = geometryColumns.geometry.encoding;

    t.notEqual(encoding, undefined, 'encoding is not undefined');
    if (geoColumn && encoding) {
      const options = {meanCenter: true};
      const binaryData = getBinaryGeometriesFromArrow(geoColumn, encoding, options);
      t.deepEqual(binaryData, expectedBinaryGeometries, 'binary geometries are correct');
    }
  }

  return Promise.resolve();
}
