import {expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {convertGeoArrowGeometry, getGeoarrowVertexCount} from '@loaders.gl/geoarrow';
import {
  convertGeometryToWKB,
  makeWKBGeometryArrowTable,
  makeWKBGeometryData,
  makeWKBGeometryField
} from '@loaders.gl/gis';
import type {Schema} from '@loaders.gl/schema';
test('geoarrow#getGeoarrowVertexCount counts WKB Data/Vector/Table vertices', () => {
  const polygonWKB = convertGeometryToWKB({
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
        [0, 0]
      ],
      [
        [1, 1],
        [2, 1],
        [2, 2],
        [1, 2],
        [1, 1]
      ]
    ]
  });
  const multiPolygonWKB = convertGeometryToWKB({
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0]
        ]
      ],
      [
        [
          [2, 2],
          [3, 2],
          [3, 3],
          [2, 3],
          [2, 2]
        ]
      ]
    ]
  });
  const geometryData = makeWKBGeometryData([polygonWKB, null, multiPolygonWKB]);
  const geometryVector = new arrow.Vector([geometryData]);
  const schema: Schema = {
    fields: [makeWKBGeometryField('geometry')],
    metadata: {}
  };
  const geometryTable = makeWKBGeometryArrowTable([polygonWKB, null, multiPolygonWKB], schema)
    .data as arrow.Table;
  expect(getGeoarrowVertexCount(geometryData), 'counts WKB Data vertices').toBe(20);
  expect(getGeoarrowVertexCount(geometryVector), 'counts WKB Vector vertices').toBe(20);
  expect(getGeoarrowVertexCount(geometryTable), 'counts WKB Table vertices').toBe(20);
});
test('geoarrow#getGeoarrowVertexCount skips extra WKB ordinates', () => {
  const polygonWKB = convertGeometryToWKB(
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0, 1, 7],
          [1, 0, 2, 8],
          [1, 1, 3, 9],
          [0, 0, 1, 7]
        ]
      ]
    },
    {hasZ: true, hasM: true}
  );
  const geometryData = makeWKBGeometryData([polygonWKB]);
  expect(getGeoarrowVertexCount(geometryData), 'counts XYZM WKB vertices using source points').toBe(
    4
  );
});

test('geoarrow#getGeoarrowVertexCount counts every WKB geometry family', () => {
  const geometries = [
    {type: 'Point', coordinates: [1, 2]},
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    },
    {
      type: 'MultiPoint',
      coordinates: [
        [0, 0],
        [1, 1]
      ]
    },
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1]
        ],
        [
          [2, 2],
          [3, 3],
          [4, 4]
        ]
      ]
    },
    {
      type: 'GeometryCollection',
      geometries: [
        {type: 'Point', coordinates: [0, 0]},
        {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1]
          ]
        }
      ]
    }
  ] as const;
  const expectedCounts = [1, 3, 2, 5, 3];

  for (let index = 0; index < geometries.length; index++) {
    const geometryWKB = convertGeometryToWKB(geometries[index]);
    expect(getGeoarrowVertexCount(makeWKBGeometryData([geometryWKB]))).toBe(expectedCounts[index]);
  }
});

test.each([
  ['big-endian XY', createPointWKB(false, 1, 2), 1],
  ['ISO XYZ', createPointWKB(true, 1001, 3), 1],
  ['ISO XYM', createPointWKB(true, 2001, 3), 1],
  ['ISO XYZM', createPointWKB(true, 3001, 4), 1],
  ['EWKB Z', createPointWKB(true, 0x80000001, 3), 1],
  ['EWKB M', createPointWKB(true, 0x40000001, 3), 1],
  ['EWKB ZM', createPointWKB(true, 0xc0000001, 4), 1],
  ['EWKB SRID', createPointWKB(true, 0x20000001, 2, 4326), 1]
] as const)('geoarrow#getGeoarrowVertexCount handles %s headers', (_name, geometryWKB, expectedCount) => {
  expect(getGeoarrowVertexCount(makeWKBGeometryData([geometryWKB]))).toBe(expectedCount);
});

test('geoarrow#getGeoarrowVertexCount validates unsupported inputs and encodings', () => {
  expect(getGeoarrowVertexCount(arrow.tableFromArrays({value: [1, 2, 3]}))).toBe(0);
  expect(() => getGeoarrowVertexCount({} as arrow.Table)).toThrow(/Expected an Apache Arrow/);

  const textData = arrow.vectorFromArray(['POINT (1 2)'], new arrow.Utf8()).data[0];
  expect(() => getGeoarrowVertexCount(textData)).toThrow(/WKT vertex counting is not supported/);

  const integerData = arrow.vectorFromArray(new Int32Array([1])).data[0];
  expect(() => getGeoarrowVertexCount(integerData)).toThrow(/Unsupported GeoArrow data type/);

  const unsupportedWKB = new Uint8Array(5);
  unsupportedWKB[0] = 1;
  new DataView(unsupportedWKB.buffer).setUint32(1, 0, true);
  expect(() => getGeoarrowVertexCount(makeWKBGeometryData([unsupportedWKB]))).toThrow(
    /Unsupported geometry type/
  );
});

test.each([
  ['geoarrow.point', {type: 'Point', coordinates: [0, 0]}, 1],
  [
    'geoarrow.linestring',
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    },
    3
  ],
  [
    'geoarrow.multipoint',
    {
      type: 'MultiPoint',
      coordinates: [
        [0, 0],
        [1, 1]
      ]
    },
    2
  ],
  [
    'geoarrow.polygon',
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [0, 0]
        ]
      ]
    },
    3
  ],
  [
    'geoarrow.multilinestring',
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1]
        ]
      ]
    },
    2
  ],
  [
    'geoarrow.multipolygon',
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [1, 0],
            [0, 0]
          ]
        ]
      ]
    },
    3
  ]
] as const)('geoarrow#getGeoarrowVertexCount counts native %s arrays', (encoding, geometry, expectedCount) => {
  const wkb = convertGeometryToWKB(geometry);
  const schema: Schema = {fields: [makeWKBGeometryField('geometry')], metadata: {}};
  const table = makeWKBGeometryArrowTable([wkb, null], schema).data as arrow.Table;
  const nativeTable = convertGeoArrowGeometry(table, encoding);

  expect(getGeoarrowVertexCount(nativeTable)).toBe(expectedCount);
  expect(getGeoarrowVertexCount(nativeTable.getChild('geometry')!)).toBe(expectedCount);
});

function createPointWKB(
  littleEndian: boolean,
  geometryCode: number,
  dimensions: number,
  spatialReferenceId?: number
): Uint8Array {
  const byteLength = 5 + (spatialReferenceId === undefined ? 0 : 4) + dimensions * 8;
  const bytes = new Uint8Array(byteLength);
  const dataView = new DataView(bytes.buffer);
  bytes[0] = littleEndian ? 1 : 0;
  dataView.setUint32(1, geometryCode, littleEndian);
  let byteOffset = 5;
  if (spatialReferenceId !== undefined) {
    dataView.setUint32(byteOffset, spatialReferenceId, littleEndian);
    byteOffset += 4;
  }
  for (let dimension = 0; dimension < dimensions; dimension++) {
    dataView.setFloat64(byteOffset + dimension * 8, dimension + 1, littleEndian);
  }
  return bytes;
}
