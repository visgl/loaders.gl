import test, {Test} from 'tape-promise/tape';

import {Table as ApacheArrowTable} from 'apache-arrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/gis';
import {fetchFile, parse} from '@loaders.gl/core';
import {
  BINARY_GEOMETRY_TEMPLATE,
  ArrowLoader,
  getBinaryGeometriesFromArrow,
  serializeArrowSchema
} from '@loaders.gl/arrow';

import {
  POINT_ARROW_FILE,
  MULTIPOINT_ARROW_FILE,
  LINE_ARROW_FILE,
  MULTILINE_ARROW_FILE,
  POLYGON_ARROW_FILE,
  MULTIPOLYGON_ARROW_FILE
} from './convert-geoarrow-to-geojson.spec';

const expectedPointBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point',
        globalFeatureIds: {value: new Uint32Array([0]), size: 1},
        positions: {value: new Float64Array([1, 1]), size: 2},
        properties: [{index: 0}],
        featureIds: {value: new Uint32Array([0]), size: 1}
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
  bounds: [1, 1, 1, 1],
  featureTypes: {polygon: false, point: true, line: false}
};

const expectedMultiPointBinaryGeometry = {
  binaryGeometries: [
    {
      shape: 'binary-feature-collection',
      points: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Point',
        globalFeatureIds: {value: new Uint32Array([0, 0]), size: 1},
        positions: {value: new Float64Array([1, 1, 2, 2]), size: 2},
        properties: [{index: 0}],
        featureIds: {value: new Uint32Array([0, 0]), size: 1}
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
  featureTypes: {polygon: false, point: true, line: false}
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
        globalFeatureIds: {value: new Uint32Array([0, 0]), size: 1},
        positions: {value: new Float64Array([0, 0, 1, 1]), size: 2},
        properties: [{index: 0}],
        featureIds: {value: new Uint32Array([0, 0]), size: 1},
        pathIndices: {value: new Int32Array([0, 2]), size: 1}
      },
      polygons: {
        ...BINARY_GEOMETRY_TEMPLATE,
        type: 'Polygon',
        polygonIndices: {value: new Uint16Array(0), size: 1},
        primitivePolygonIndices: {value: new Uint16Array(0), size: 1}
      }
    }
  ],
  bounds: [0, 0, 1, 1],
  featureTypes: {polygon: false, point: false, line: true}
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
        globalFeatureIds: {value: new Uint32Array([0, 0, 0, 0]), size: 1},
        positions: {value: new Float64Array([1, 1, 2, 2, 3, 3, 4, 4]), size: 2},
        properties: [{index: 0}],
        featureIds: {value: new Uint32Array([0, 0, 0, 0]), size: 1},
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
  bounds: [1, 1, 4, 4],
  featureTypes: {polygon: false, point: false, line: true}
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
          value: new Uint32Array([0, 0, 0, 0]),
          size: 1
        },
        positions: {
          value: new Float64Array([0, 0, 1, 1, 2, 2, 0, 0]),
          size: 2
        },
        properties: [{index: 0}],
        featureIds: {value: new Uint32Array([0, 0, 0, 0]), size: 1},
        polygonIndices: {value: new Int32Array([0, 4]), size: 1},
        primitivePolygonIndices: {value: new Int32Array([0, 4]), size: 1}
      }
    }
  ],
  bounds: [0, 0, 2, 2],
  featureTypes: {polygon: true, point: false, line: false}
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
        primitivePolygonIndices: {value: new Int32Array([0, 5, 10]), size: 1}
      }
    }
  ],
  bounds: [0, 0, 3, 3],
  featureTypes: {polygon: true, point: false, line: false}
};

test('ArrowUtils#getBinaryGeometriesFromArrow', (t) => {
  const testCases = [
    [POINT_ARROW_FILE, expectedPointBinaryGeometry],
    [MULTIPOINT_ARROW_FILE, expectedMultiPointBinaryGeometry],
    [LINE_ARROW_FILE, expectedLineBinaryGeometry],
    [MULTILINE_ARROW_FILE, expectedMultiLineBinaryGeometry],
    [POLYGON_ARROW_FILE, expectedPolygonBinaryGeometry],
    [MULTIPOLYGON_ARROW_FILE, expectedMultiPolygonBinaryGeometry]
  ];

  testCases.forEach((testCase) => {
    testGetBinaryGeometriesFromArrow(t, testCase[0], testCase[1]);
  });

  t.end();
});

async function testGetBinaryGeometriesFromArrow(
  t: Test,
  arrowFile,
  expectedBinaryGeometries
): Promise<void> {
  const arrowTable = await parse(fetchFile(arrowFile), ArrowLoader, {
    worker: false,
    arrow: {
      shape: 'arrow-table'
    }
  });

  t.equal(arrowTable.shape, 'arrow-table');

  const table = arrowTable.data as ApacheArrowTable;
  const geoColumn = table.getChild('geometry');
  t.notEqual(geoColumn, null, 'geoColumn is not null');

  const schema = serializeArrowSchema(table.schema);
  const geometryColumns = getGeometryColumnsFromSchema(schema);
  const encoding = geometryColumns.geometry.encoding;

  t.notEqual(encoding, undefined, 'encoding is not undefined');
  if (geoColumn && encoding) {
    const binaryData = getBinaryGeometriesFromArrow(geoColumn, encoding);
    t.deepEqual(binaryData, expectedBinaryGeometries, 'binary geometries are correct');
  }

  return Promise.resolve();
}
