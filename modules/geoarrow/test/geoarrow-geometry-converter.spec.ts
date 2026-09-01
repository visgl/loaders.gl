// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import * as arrow from 'apache-arrow';
import {expect, test, vi} from 'vitest';
import {fetchFile} from '@loaders.gl/core';
import {
  GEOARROW_LINE_WKT_FILE,
  GEOARROW_POINT_FILE,
  GEOARROW_POINT_WKB_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';
import type {Feature, Geometry} from '@loaders.gl/schema';
import {
  convertGeoArrowGeometry,
  convertGeoArrowToTable,
  convertTableToGeoArrow,
  convertFeaturesToGeoArrowTable,
  convertGeoArrowVector,
  convertGeoArrowVectorCellToGeoJSON,
  GeoArrowGeometryConverter,
  getGeometryColumnsFromSchema,
  inspectGeoArrowVector,
  getGeoArrowFieldInfo,
  validateGeoArrowField,
  validateGeoArrowVector,
  mapGeoArrowCoordinates,
  rewindGeoArrow
} from '@loaders.gl/geoarrow';
import {convertArrowToSchema, convert} from '@loaders.gl/schema-utils';
import {convertGeometryToWKB} from '@loaders.gl/gis';
import type {GeoArrowGeometryTarget} from '../src/geoarrow-converter/convert-geoarrow-geometry';

const GEOARROW_WKB_CONFORMANCE_CASES = [
  ...['point', 'linestring', 'polygon', 'multipoint', 'multilinestring', 'multipolygon'].flatMap(
    geometryName =>
      ['', '-z', '-m', '-zm'].map(dimensionSuffix => [
        `example_${geometryName}${dimensionSuffix}_wkb.arrows`,
        `geoarrow.${geometryName}`
      ])
  ),
  ...['', '-z', '-m', '-zm'].map(dimensionSuffix => [
    `example_geometry${dimensionSuffix}_wkb.arrows`,
    'geoarrow.geometry'
  ]),
  ...['', '-z', '-m', '-zm'].map(dimensionSuffix => [
    `example_geometrycollection${dimensionSuffix}_wkb.arrows`,
    'geoarrow.geometrycollection'
  ])
] as const satisfies readonly (readonly [string, GeoArrowGeometryTarget])[];

const GEOARROW_WKT_CONFORMANCE_CASES = GEOARROW_WKB_CONFORMANCE_CASES.map(
  ([fileName, targetEncoding]) => [fileName.replace('_wkb.', '_wkt.'), targetEncoding] as const
);

/**
 * Loads an Apache Arrow table from a GeoArrow fixture.
 * @param filePath Fixture path alias.
 * @returns Parsed Arrow table.
 */
async function loadArrowTable(filePath: string): Promise<arrow.Table> {
  const file = await fetchFile(filePath);
  return arrow.tableFromIPC(await file.arrayBuffer());
}

test.each(
  GEOARROW_WKB_CONFORMANCE_CASES
)('GeoArrow WKB conformance round trip: %s', async (fileName, targetEncoding) => {
  const table = await loadArrowTable(
    new URL(`./data/geoarrow-data/${fileName}`, import.meta.url).href
  );
  const native = convertGeoArrowGeometry(table, targetEncoding);
  const roundTrip = convertGeoArrowGeometry(native, 'geoarrow.wkb');
  const sourceGeometries = convertGeoArrowToTable(table, 'geojson-table').features.map(
    feature => feature.geometry
  );
  const roundTripGeometries = convertGeoArrowToTable(roundTrip, 'geojson-table').features.map(
    feature => feature.geometry
  );

  expect(roundTripGeometries).toEqual(sourceGeometries);
});

test.each(
  GEOARROW_WKT_CONFORMANCE_CASES
)('GeoArrow WKT conformance round trip: %s', async (fileName, targetEncoding) => {
  const table = await loadArrowTable(
    new URL(`./data/geoarrow-data/${fileName}`, import.meta.url).href
  );
  const native = convertGeoArrowGeometry(table, targetEncoding);
  const roundTrip = convertGeoArrowGeometry(native, 'geoarrow.wkb');
  const sourceGeometries = convertGeoArrowToTable(table, 'geojson-table').features.map(
    feature => feature.geometry
  );
  const roundTripGeometries = convertGeoArrowToTable(roundTrip, 'geojson-table').features.map(
    feature => feature.geometry
  );

  expect(roundTripGeometries).toEqual(sourceGeometries);
});

test('GeoArrow mixed WKB union preserves per-row Z and M dimensions', async () => {
  const table = await loadArrowTable(
    new URL('./data/geoarrow-data/example_geometry-mixed-dimensions_wkb.arrows', import.meta.url)
      .href
  );
  const sourceColumn = table.getChild('geometry')!;
  const unionColumn = convertGeoArrowVector(sourceColumn, 'geoarrow.wkb', 'geoarrow.geometry');
  const roundTripColumn = convertGeoArrowVector(unionColumn, 'geoarrow.geometry', 'geoarrow.wkb');

  const getWKBTypeCodes = (column: arrow.Vector): (number | null)[] =>
    Array.from({length: column.length}, (_, rowIndex) => {
      const bytes = column.get(rowIndex) as Uint8Array | null;
      if (!bytes) return null;
      const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const littleEndian = dataView.getUint8(0) === 1;
      return dataView.getUint32(1, littleEndian);
    });

  const sourceTypeCodes = getWKBTypeCodes(sourceColumn);
  expect(getWKBTypeCodes(roundTripColumn)).toEqual(
    sourceTypeCodes.map(typeCode => (typeCode === 7 ? 3007 : typeCode))
  );
});

/**
 * Rebuilds a table with GeoArrow field metadata on the geometry column.
 * @param table Source Arrow table.
 * @param encoding GeoArrow field encoding.
 * @returns Arrow table with updated geometry field metadata.
 */
function setGeometryFieldEncoding(table: arrow.Table, encoding: string): arrow.Table {
  const nextFields = table.schema.fields.map(field =>
    field.name === 'geometry'
      ? new arrow.Field(
          field.name,
          field.type,
          field.nullable,
          new Map([['ARROW:extension:name', encoding]])
        )
      : field
  );
  const nextSchema = new arrow.Schema(nextFields, table.schema.metadata);
  return new arrow.Table(
    new arrow.RecordBatch(
      nextSchema,
      arrow.makeData({
        type: new arrow.Struct(nextFields),
        length: table.numRows,
        nullCount: 0,
        children: nextFields.map(field => table.getChild(field.name)!.data[0])
      })
    )
  );
}
test('GeoArrowGeometryConverter converts WKB geometry columns to native point encoding', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const sourceField = table.schema.fields.find(field => field.name === 'geometry')!;
  const sourceInfo = getGeoArrowFieldInfo(sourceField)!;
  expect(sourceInfo.encoding).toBe('geoarrow.wkb');
  expect(sourceInfo.offsetType).toBe('int32');
  expect(validateGeoArrowField(sourceField).valid).toBe(true);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.point');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'updates the geometry column encoding metadata'
  ).toBe('geoarrow.point');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'builds a native point column'
  ).toBe('FixedSizeList[2]<Float64>');
  expect(
    JSON.parse(
      convertedTable.schema.fields
        .find(field => field.name === 'geometry')
        ?.metadata?.get('ARROW:extension:metadata') || '{}'
    ).geometry_types,
    'records header-derived geometry type metadata'
  ).toEqual(['Point']);
  expect(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    'preserves feature content after conversion'
  ).toEqual(convertGeoArrowToTable(table, 'geojson-table').features);
});
test('GeoArrow inspection classifies WKB headers without decoding coordinates', () => {
  const geometries = [
    new Uint8Array([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    new Uint8Array([1, 2, 0, 0, 0, 0, 0, 0, 0])
  ];
  const vector = arrow.vectorFromArray(geometries, new arrow.Binary());
  const inspection = inspectGeoArrowVector(vector, 'geoarrow.wkb');
  expect(inspection.rowCount).toBe(2);
  expect(inspection.geometryTypes).toEqual(['Point', 'LineString']);
  expect(inspection.malformedRowCount).toBe(0);
});

test('GeoArrow WKT inspection and conversion preserve per-row M and ZM dimensions', () => {
  const vector = arrow.vectorFromArray(
    ['POINT M (1 2 3)', 'LINESTRING ZM (0 1 2 3, 4 5 6 7)'],
    new arrow.Utf8()
  );
  const inspection = inspectGeoArrowVector(vector, 'geoarrow.wkt');
  expect(inspection.geometryTypes).toEqual(['Point M', 'LineString ZM']);
  expect(inspection.dimensions).toEqual(['xym', 'xyzm']);

  const wkb = convertGeoArrowVector(vector, 'geoarrow.wkt', 'geoarrow.wkb');
  const firstHeader = new DataView(
    wkb.get(0)!.buffer,
    wkb.get(0)!.byteOffset,
    wkb.get(0)!.byteLength
  );
  const secondHeader = new DataView(
    wkb.get(1)!.buffer,
    wkb.get(1)!.byteOffset,
    wkb.get(1)!.byteLength
  );
  expect(firstHeader.getUint32(1, true)).toBe(2001);
  expect(secondHeader.getUint32(1, true)).toBe(3002);
});

test.each([
  ['geoarrow.point', 'Point', 'POINT (1 2)'],
  ['geoarrow.linestring', 'LineString', 'LINESTRING (0 0, 3 4)'],
  ['geoarrow.polygon', 'Polygon', 'POLYGON ((0 0, 0 2, 2 2, 0 0))'],
  ['geoarrow.multipoint', 'MultiPoint', 'MULTIPOINT ((1 2), (3 4))'],
  ['geoarrow.multilinestring', 'MultiLineString', 'MULTILINESTRING ((0 0, 1 1), (2 2, 3 3))'],
  [
    'geoarrow.multipolygon',
    'MultiPolygon',
    'MULTIPOLYGON (((0 0, 0 2, 2 2, 0 0)), ((3 3, 3 4, 4 4, 3 3)))'
  ]
] as const)('direct WKT native decoding supports %s', (targetEncoding, geometryType, wkt) => {
  const wktVector = arrow.vectorFromArray([wkt], new arrow.Utf8());
  const wktSchema = new arrow.Schema([
    new arrow.Field(
      'geometry',
      new arrow.Utf8(),
      true,
      new Map([['ARROW:extension:name', 'geoarrow.wkt']])
    )
  ]);
  const wktTable = new arrow.Table(
    new arrow.RecordBatch(
      wktSchema,
      arrow.makeData({
        type: new arrow.Struct(wktSchema.fields),
        length: 1,
        nullCount: 0,
        children: [wktVector.data[0]]
      })
    )
  );
  const converted = convertGeoArrowGeometry(wktTable, targetEncoding, {
    coordinates: 'separated',
    offsetType: 'int64'
  });

  expect(
    converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toContain(targetEncoding === 'geoarrow.point' ? 'Struct' : 'LargeList');
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry?.type).toBe(
    geometryType
  );
});
test('GeoArrow point conversion writes a direct typed buffer from WKB', () => {
  const pointBytes = new Uint8Array(1 + 4 + 16);
  pointBytes[0] = 1;
  new DataView(pointBytes.buffer).setUint32(1, 1, true);
  new DataView(pointBytes.buffer).setFloat64(5, 12.5, true);
  new DataView(pointBytes.buffer).setFloat64(13, -4.25, true);
  const vector = arrow.vectorFromArray([pointBytes], new arrow.Binary());
  const convertedVector = convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.point');
  expect(convertedVector.type.toString()).toBe('FixedSizeList[2]<Float64>');
  expect(Array.from(convertedVector.get(0).toArray())).toEqual([12.5, -4.25]);
});

test('GeoArrow box conversion writes canonical bounds directly from WKB', () => {
  const geometry = {
    type: 'Polygon',
    coordinates: [
      [
        [170, -10],
        [-170, -10],
        [-170, 20],
        [170, 20],
        [170, -10]
      ]
    ]
  } as const;
  const bytes = new Uint8Array(convertGeometryToWKB(geometry));
  const vector = arrow.vectorFromArray([bytes], new arrow.Binary());
  const convertedVector = convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.box', {
    dimension: 'xy'
  });

  expect(convertedVector.type.toString()).toBe(
    'Struct<{xmin:Float64, ymin:Float64, xmax:Float64, ymax:Float64}>'
  );
  expect(convertedVector.get(0)).toMatchObject({
    xmin: -170,
    ymin: -10,
    xmax: 170,
    ymax: 20
  });
});

test('GeoArrow box conversion handles WKT through the parser fallback', () => {
  const vector = arrow.vectorFromArray(['LINESTRING (4 8, -2 3)'], new arrow.Utf8());
  const convertedVector = convertGeoArrowVector(vector, 'geoarrow.wkt', 'geoarrow.box');
  expect(convertedVector.get(0)).toMatchObject({xmin: -2, ymin: 3, xmax: 4, ymax: 8});
});

test('GeoArrow converter registry exposes Box as a native target', async () => {
  const {GEOARROW_GEOMETRY_CONVERTERS} = await import('@loaders.gl/geoarrow');
  const converter = GEOARROW_GEOMETRY_CONVERTERS[0];

  expect(converter.to).toContain('geoarrow.box');
  expect(converter.canConvert('geoarrow', 'geoarrow.box')).toBe(true);
});

test.each([
  ['geoarrow.point', {type: 'Point', coordinates: [1, 2]}],
  [
    'geoarrow.linestring',
    {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 2]
      ]
    }
  ],
  [
    'geoarrow.polygon',
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [0, 2],
          [0, 0]
        ]
      ]
    }
  ],
  [
    'geoarrow.multipoint',
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    }
  ],
  [
    'geoarrow.multilinestring',
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 2]
        ],
        [
          [3, 4],
          [5, 6]
        ]
      ]
    }
  ],
  [
    'geoarrow.multipolygon',
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [2, 0],
            [0, 2],
            [0, 0]
          ]
        ]
      ]
    }
  ]
] as const)('writes %s native rows to WKB without a GeoJSON bridge', (encoding, geometry) => {
  const feature: Feature = {type: 'Feature', properties: {}, geometry};
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable([feature], {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const native = convertGeoArrowGeometry(source, encoding);
  const roundTrip = convertGeoArrowGeometry(native, 'geoarrow.wkb');
  expect(convertGeoArrowToTable(roundTrip, 'geojson-table').features[0].geometry).toEqual(geometry);
});
test('GeoArrow coordinate mapping updates native buffers in place', () => {
  const vector = arrow.vectorFromArray(
    [
      [1, 2],
      [3, 4]
    ],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float64(), false))
  );
  const mappedVector = mapGeoArrowCoordinates(vector, ([x, y]) => [x + 10, y - 1]);
  expect(mappedVector).toBe(vector);
  expect(Array.from(mappedVector.get(0).toArray())).toEqual([11, 1]);
  expect(Array.from(mappedVector.get(1).toArray())).toEqual([13, 3]);
});
test('GeoArrow coordinate mapping handles sliced native buffers', () => {
  const vector = arrow.vectorFromArray(
    [
      [1, 2],
      [3, 4]
    ],
    new arrow.FixedSizeList(2, new arrow.Field('value', new arrow.Float64(), false))
  );
  const slicedVector = vector.slice(1, 2);

  mapGeoArrowCoordinates(slicedVector, ([x, y]) => [x + 10, y - 1]);

  expect(Array.from(slicedVector.get(0).toArray())).toEqual([13, 3]);
});
test('GeoArrow coordinate mapping limits sliced nested ranges', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [1, 2],
          [3, 4]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [5, 6],
          [7, 8]
        ]
      }
    }
  ]).data;
  const native = convertGeoArrowGeometry(source, 'geoarrow.linestring');
  const slicedVector = native.getChild('geometry')!.slice(1, 2);

  mapGeoArrowCoordinates(slicedVector, ([x, y]) => [x + 10, y - 1]);

  expect(
    native
      .getChild('geometry')!
      .get(0)
      .toArray()
      .map((point: arrow.Vector) => Array.from(point.toArray()))
  ).toEqual([
    [1, 2],
    [3, 4]
  ]);
  expect(
    slicedVector
      .get(0)
      .toArray()
      .map((point: arrow.Vector) => Array.from(point.toArray()))
  ).toEqual([
    [15, 5],
    [17, 7]
  ]);
});
test('GeoArrow coordinate mapping limits sliced dense-union ranges', () => {
  const source = convertFeaturesToGeoArrowTable([
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [3, 4],
          [5, 6]
        ]
      }
    }
  ]).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
  const slicedVector = union.getChild('geometry')!.slice(1, 2);

  mapGeoArrowCoordinates(slicedVector, coordinate => coordinate.map(value => value + 10));

  expect(
    convertGeoArrowVectorCellToGeoJSON(union.getChild('geometry')!, 0, 'geoarrow.geometry')
  ).toEqual({
    type: 'Point',
    coordinates: [1, 2]
  });
  expect(convertGeoArrowVectorCellToGeoJSON(slicedVector, 0, 'geoarrow.geometry')).toEqual({
    type: 'LineString',
    coordinates: [
      [13, 14],
      [15, 16]
    ]
  });
});
test('GeoArrow polygon rewinding canonicalizes exterior ring orientation', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ]
      }
    }
  ];
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const converted = convertGeoArrowGeometry(source, 'geoarrow.polygon');
  rewindGeoArrow(converted.getChild('geometry')!, 'geoarrow.polygon');
  const result = convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry;
  expect(result?.type).toBe('Polygon');
  expect((result as any).coordinates[0][1]).toEqual([1, 0]);
});

test('GeoArrow polygon rewinding supports separated coordinate buffers', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const converted = convertGeoArrowGeometry(source, 'geoarrow.polygon', {
    coordinates: 'separated'
  });

  rewindGeoArrow(converted.getChild('geometry')!, 'geoarrow.polygon');
  const result = convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry;
  expect((result as any).coordinates[0][1]).toEqual([1, 0]);
});
test('GeoArrow polygon rewinding handles a sliced native vector', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {id: 1},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: {id: 2},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [2, 2],
              [2, 3],
              [3, 3],
              [3, 2],
              [2, 2]
            ]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const converted = convertGeoArrowGeometry(source, 'geoarrow.polygon');
  const slicedGeometry = converted.getChild('geometry')?.slice(1, 2);

  expect(slicedGeometry).toBeTruthy();
  rewindGeoArrow(slicedGeometry!, 'geoarrow.polygon');
  expect(convertGeoArrowVectorCellToGeoJSON(slicedGeometry!, 0, 'geoarrow.polygon')).toEqual({
    type: 'Polygon',
    coordinates: [
      [
        [2, 2],
        [3, 2],
        [3, 3],
        [2, 3],
        [2, 2]
      ]
    ]
  });
});
test('GeoArrow polygon rewinding traverses mixed dense unions and collections', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [2, 2],
                  [2, 3],
                  [3, 3],
                  [3, 2],
                  [2, 2]
                ]
              ]
            ]
          }
        ]
      }
    }
  ]).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
  rewindGeoArrow(union.getChild('geometry')!, 'geoarrow.geometry');
  const result = convertGeoArrowToTable(union, 'geojson-table').features;

  expect((result[0]?.geometry as any).coordinates[0][1]).toEqual([1, 0]);
  expect((result[1]?.geometry as any).geometries[0].coordinates[0][0][1]).toEqual([3, 2]);
});
test('GeoArrow polygon rewinding leaves unreferenced sliced union children unchanged', () => {
  const source = convertFeaturesToGeoArrowTable([
    {
      type: 'Feature',
      properties: {id: 1},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {id: 2},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
            [2, 2]
          ]
        ]
      }
    }
  ]).data;
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry').getChild('geometry')!;
  const firstBefore = convertGeoArrowVectorCellToGeoJSON(union, 0, 'geoarrow.geometry');

  rewindGeoArrow(union.slice(1, 2), 'geoarrow.geometry');

  expect(convertGeoArrowVectorCellToGeoJSON(union, 0, 'geoarrow.geometry')).toEqual(firstBefore);
  expect(
    (convertGeoArrowVectorCellToGeoJSON(union, 1, 'geoarrow.geometry') as any).coordinates[0][1]
  ).toEqual([3, 2]);
});
test('GeoArrow LineString conversion writes direct coordinates and offsets from WKB', () => {
  const bytes = new Uint8Array(
    convertGeometryToWKB({
      type: 'LineString',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    })
  );
  const vector = arrow.vectorFromArray([bytes], new arrow.Binary());
  const convertedVector = convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.linestring', {
    offsetType: 'int64'
  });
  expect(convertedVector.type.toString()).toContain('LargeList');
  expect(Array.from(convertedVector.get(0).get(1).toArray())).toEqual([3, 4]);
});

test('direct WKB conversion rejects trailing bytes', () => {
  const bytes = new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}));
  const malformedBytes = new Uint8Array(bytes.byteLength + 1);
  malformedBytes.set(bytes);
  const vector = arrow.vectorFromArray([malformedBytes], new arrow.Binary());

  expect(() => convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.point')).toThrow(
    /WKB contains trailing bytes/
  );
});

test('GeoArrow conversion can reject the compatibility object fallback', () => {
  const bytes = new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}));
  const vector = arrow.vectorFromArray([bytes], new arrow.Binary());

  expect(() =>
    convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.wkt', {fallback: 'error'})
  ).toThrow(/No direct GeoArrow conversion kernel/);
});

const directWKBGeometryCases: readonly [GeoArrowGeometryTarget, Geometry][] = [
  [
    'geoarrow.multipoint',
    {
      type: 'MultiPoint',
      coordinates: [
        [1, 2],
        [3, 4]
      ]
    }
  ],
  [
    'geoarrow.polygon',
    {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [0, 2],
          [2, 2],
          [2, 0],
          [0, 0]
        ]
      ]
    }
  ],
  [
    'geoarrow.multilinestring',
    {
      type: 'MultiLineString',
      coordinates: [
        [
          [0, 0],
          [1, 1]
        ],
        [
          [2, 2],
          [3, 3]
        ]
      ]
    }
  ],
  [
    'geoarrow.multipolygon',
    {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [0, 0],
            [0, 1],
            [1, 1],
            [1, 0],
            [0, 0]
          ]
        ],
        [
          [
            [2, 2],
            [2, 3],
            [3, 3],
            [3, 2],
            [2, 2]
          ]
        ]
      ]
    }
  ]
];

test.each(directWKBGeometryCases)('directly decodes WKB into %s buffers', (target, geometry) => {
  const feature: Feature = {type: 'Feature', properties: {}, geometry};
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable([feature], {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const converted = convertGeoArrowGeometry(source, target, {
    offsetType: 'int64'
  });
  const result = convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry;
  expect(result).toEqual(geometry);
  if (target !== 'geoarrow.point') {
    expect(
      converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()
    ).toContain('LargeList');
  }
});

test('direct WKB conversion supports separated coordinate buffers', () => {
  const geometry: Geometry = {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [0, 1],
          [1, 1],
          [1, 0],
          [0, 0]
        ]
      ]
    ]
  };
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable([{type: 'Feature', properties: {}, geometry}], {
      geoarrow: {encoding: 'wkb'}
    }).data,
    'geoarrow.wkb'
  );
  const converted = convertGeoArrowGeometry(source, 'geoarrow.multipolygon', {
    coordinates: 'separated',
    offsetType: 'int64'
  });
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry).toEqual(geometry);
  expect(
    converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toContain('Struct');
});

test.each([
  ['geoarrow.multipoint', 'Point', 'MultiPoint'],
  ['geoarrow.multilinestring', 'LineString', 'MultiLineString'],
  ['geoarrow.multipolygon', 'Polygon', 'MultiPolygon']
] as const)('direct WKB conversion promotes %s input geometry', (target, inputType, outputType) => {
  const coordinates =
    inputType === 'Point'
      ? [5, 6]
      : inputType === 'LineString'
        ? [
            [0, 0],
            [1, 1]
          ]
        : [
            [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
              [0, 0]
            ]
          ];
  const geometry = {type: inputType, coordinates} as Geometry;
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable([{type: 'Feature', properties: {}, geometry}], {
      geoarrow: {encoding: 'wkb'}
    }).data,
    'geoarrow.wkb'
  );
  const converted = convertGeoArrowGeometry(source, target);
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry?.type).toBe(
    outputType
  );
});
test('GeoArrowGeometryConverter converts native point encoding to WKT', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.wkt');
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'updates the geometry column encoding metadata'
  ).toBe('geoarrow.wkt');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString(),
    'builds a WKT geometry column'
  ).toBe('Utf8');
  expect(
    convertGeoArrowToTable(convertedTable, 'geojson-table').features,
    'preserves feature content after conversion'
  ).toEqual(convertGeoArrowToTable(table, 'geojson-table').features);
});

test.each([
  ['geoarrow.point', 'POINT (1 2)'],
  ['geoarrow.linestring', 'LINESTRING (0 0, 3 4)'],
  ['geoarrow.polygon', 'POLYGON ((0 0, 0 2, 2 2, 0 0))'],
  ['geoarrow.multipoint', 'MULTIPOINT ((1 2), (3 4))'],
  ['geoarrow.multilinestring', 'MULTILINESTRING ((0 0, 1 1), (2 2, 3 3))'],
  ['geoarrow.multipolygon', 'MULTIPOLYGON (((0 0, 0 2, 2 2, 0 0)), ((3 3, 3 4, 4 4, 3 3)))']
] as const)('GeoArrow writes %s to WKT without a GeoJSON bridge', (encoding, wkt) => {
  const source = arrow.vectorFromArray([wkt], new arrow.Utf8());
  const native = convertGeoArrowVector(source, 'geoarrow.wkt', encoding);
  const converted = convertGeoArrowVector(native, encoding, 'geoarrow.wkt');

  expect(converted.toArray()).toEqual([wkt]);
});

test('GeoArrow writes dense unions and nested collections directly to WKT', () => {
  const source = arrow.vectorFromArray(
    ['POINT Z (1 2 3)', 'LINESTRING M (0 0 7, 3 4 8)'],
    new arrow.Utf8()
  );
  const union = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometry');
  const convertedUnion = convertGeoArrowVector(union, 'geoarrow.geometry', 'geoarrow.wkt');

  expect(convertedUnion.toArray()).toEqual(['POINT Z (1 2 3)', 'LINESTRING M (0 0 7, 3 4 8)']);

  const collectionSource = arrow.vectorFromArray(
    ['GEOMETRYCOLLECTION (POINT Z (1 2 3), LINESTRING M (0 0 7, 3 4 8))'],
    new arrow.Utf8()
  );
  const collection = convertGeoArrowVector(
    collectionSource,
    'geoarrow.wkt',
    'geoarrow.geometrycollection'
  );
  const convertedCollection = convertGeoArrowVector(
    collection,
    'geoarrow.geometrycollection',
    'geoarrow.wkt'
  );

  expect(convertedCollection.toArray()).toEqual([
    'GEOMETRYCOLLECTION (POINT Z (1 2 3), LINESTRING M (0 0 7, 3 4 8))'
  ]);
});

test('GeoArrow inspection reports used union families and dimensions without decoding coordinates', () => {
  const source = arrow.vectorFromArray(
    ['POINT Z (1 2 3)', 'LINESTRING M (0 0 7, 3 4 8)'],
    new arrow.Utf8()
  );
  const union = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometry');
  const inspection = inspectGeoArrowVector(union, 'geoarrow.geometry');

  expect(inspection.geometryTypes).toEqual(['Point Z', 'LineString M']);
  expect(inspection.dimensions).toEqual(['xyz', 'xym']);
  expect(inspection.nullCount).toBe(0);
  expect(inspection.malformedRowCount).toBe(0);
});

test('GeoArrowGeometryConverter converts only selected geometry columns', async () => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const lineTable = await loadArrowTable(GEOARROW_LINE_WKT_FILE);
  const geometryVector = pointTable.getChild('geometry')!;
  const secondaryGeometryVector = lineTable.getChild('geometry')!;
  const table = arrow.makeTable({
    id: pointTable.getChild('id')!,
    name: pointTable.getChild('name')!,
    geometry: geometryVector,
    geometry2: secondaryGeometryVector
  });
  const schema = new arrow.Schema([
    pointTable.schema.fields.find(field => field.name === 'id')!,
    pointTable.schema.fields.find(field => field.name === 'name')!,
    pointTable.schema.fields.find(field => field.name === 'geometry')!,
    new arrow.Field(
      'geometry2',
      secondaryGeometryVector.type,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.wkt']])
    )
  ]);
  const tableWithSchema = new arrow.Table(
    new arrow.RecordBatch(
      schema,
      arrow.makeData({
        type: new arrow.Struct(schema.fields),
        length: table.numRows,
        nullCount: 0,
        children: [
          table.getChild('id')!.data[0],
          table.getChild('name')!.data[0],
          table.getChild('geometry')!.data[0],
          table.getChild('geometry2')!.data[0]
        ]
      })
    )
  );
  const convertedTable = convertGeoArrowGeometry(tableWithSchema, 'geoarrow.point', {
    geometryColumn: 'geometry'
  });
  const convertedSchema = convertArrowToSchema(convertedTable.schema);
  const convertedGeometryColumns = getGeometryColumnsFromSchema(convertedSchema);
  expect(convertedGeometryColumns.geometry?.encoding, 'converts the selected column').toBe(
    'geoarrow.point'
  );
  expect(convertedGeometryColumns.geometry2?.encoding, 'leaves unselected columns alone').toBe(
    'geoarrow.wkt'
  );
});
test('GeoArrowGeometryConverter rejects incompatible target encodings', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  expect(
    () => convertGeoArrowGeometry(table, 'geoarrow.linestring'),
    'rejects changing geometry type during encoding conversion'
  ).toThrow(/(?:cannot encode Point|cannot be represented as) geoarrow\.linestring/i);
});
test('GeoArrowGeometryConverter integrates with convert()', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const convertedTable = convert(table, 'geoarrow.point', [GeoArrowGeometryConverter]);
  const convertedSchema = convertArrowToSchema((convertedTable as arrow.Table).schema);
  expect(
    getGeometryColumnsFromSchema(convertedSchema).geometry?.encoding,
    'supports schema-utils convert() integration'
  ).toBe('geoarrow.point');
});
test('GeoArrowGeometryConverter converts mixed WKB tables to geoarrow.geometry', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {name: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {name: 'line'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    }
  ];
  const table = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.geometry');
  const roundTripTable = convertGeoArrowGeometry(convertedTable, 'geoarrow.wkt');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'updates geometry metadata to geoarrow.geometry'
  ).toBe('geoarrow.geometry');
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.constructor.name,
    'builds a dense union geometry column'
  ).toBe('DenseUnion');
  expect(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    'round-trips mixed geometry content through the union encoding'
  ).toEqual(features);
  expect(
    validateGeoArrowVector(convertedTable.getChild('geometry')!, 'geoarrow.geometry').valid
  ).toBe(true);
});

test('GeoArrowGeometryConverter writes compact direct union children for mixed WKB and null rows', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {kind: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2, 3]}
    },
    {
      type: 'Feature',
      properties: {kind: 'line'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    },
    {type: 'Feature', properties: {kind: 'null'}, geometry: null}
  ];
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const converted = convertGeoArrowGeometry(source, 'geoarrow.geometry', {
    offsetType: 'int64'
  });
  const geometryVector = converted.getChild('geometry')!;
  expect(geometryVector.type.toString()).toContain('Union<');
  const childTypeNames = (geometryVector.type as arrow.DenseUnion).children.map(field =>
    field.type.toString()
  );
  expect(childTypeNames.some(typeName => typeName.includes('FixedSizeList[3]'))).toBe(true);
  expect(childTypeNames.some(typeName => typeName.includes('LargeList'))).toBe(true);
  const roundTripFeatures = convertGeoArrowToTable(converted, 'geojson-table').features;
  expect(roundTripFeatures[0]).toEqual(features[0]);
  expect(roundTripFeatures[1]?.geometry).toEqual({
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 1]
    ]
  });
  expect(roundTripFeatures[2]).toEqual(features[2]);
});

test('GeoArrowGeometryConverter promotes representable native union families without GeoJSON', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {kind: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {kind: 'multipoint'},
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [3, 4],
          [5, 6]
        ]
      }
    },
    {type: 'Feature', properties: {kind: 'null'}, geometry: null}
  ];
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
  const promoted = convertGeoArrowGeometry(union, 'geoarrow.multipoint');

  expect(promoted.getChild('geometry')?.type.toString()).toBe('List<FixedSizeList[2]<Float64>>');
  expect(convertGeoArrowToTable(promoted, 'geojson-table').features).toEqual([
    {
      ...features[0],
      geometry: {type: 'MultiPoint', coordinates: [[1, 2]]}
    },
    features[1],
    features[2]
  ]);
});

test('GeoArrow native union promotion preserves XYM semantics from child names', () => {
  const source = arrow.vectorFromArray(
    ['POINT M (1 2 9)', 'MULTIPOINT M ((3 4 8), (5 6 7))'],
    new arrow.Utf8()
  );
  const union = convertGeoArrowVector(source, 'geoarrow.wkt', 'geoarrow.geometry');
  const promoted = convertGeoArrowVector(union, 'geoarrow.geometry', 'geoarrow.multipoint');

  expect(promoted.type.toString()).toBe('List<FixedSizeList[3]<Float64>>');
  const wkt = convertGeoArrowVector(promoted, 'geoarrow.multipoint', 'geoarrow.wkt', {
    dimension: 'xym'
  });
  expect(wkt.toArray()).toEqual(['MULTIPOINT M ((1 2 9))', 'MULTIPOINT M ((3 4 8), (5 6 7))']);
});

test('GeoArrowGeometryConverter converts geometry collections to geoarrow.geometrycollection', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {name: 'collection'},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [1, 2]},
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1]
            ]
          }
        ]
      }
    }
  ];
  const table = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkt'}}).data,
    'geoarrow.wkt'
  );
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.geometrycollection');
  const roundTripTable = convertGeoArrowGeometry(convertedTable, 'geoarrow.wkb');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get('ARROW:extension:name'),
    'updates geometry metadata to geoarrow.geometrycollection'
  ).toBe('geoarrow.geometrycollection');
  expect(
    convertedTable.schema.fields
      .find(field => field.name === 'geometry')
      ?.type.toString()
      .startsWith('List<Union<'),
    'builds a list of dense union members for geometry collections'
  ).toBeTruthy();
  expect(
    convertGeoArrowToTable(roundTripTable, 'geojson-table').features,
    'round-trips geometry collections through the collection encoding'
  ).toEqual(features);
});

test('GeoArrowGeometryConverter decodes WKB GeometryCollections without a GeoJSON bridge', () => {
  const geometry = {
    type: 'GeometryCollection' as const,
    geometries: [
      {type: 'Point' as const, coordinates: [1, 2]},
      {
        type: 'LineString' as const,
        coordinates: [
          [0, 0],
          [3, 4]
        ]
      }
    ]
  };
  const source = convertFeaturesToGeoArrowTable([{type: 'Feature', properties: {}, geometry}], {
    geoarrow: {encoding: 'wkb'}
  }).data;
  const converted = convertGeoArrowGeometry(source, 'geoarrow.geometrycollection');

  expect(
    converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toContain('List<Union<');
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry).toEqual(geometry);

  const largeOffsetCollection = convertGeoArrowGeometry(source, 'geoarrow.geometrycollection', {
    offsetType: 'int64'
  });
  expect(
    largeOffsetCollection.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toContain('LargeList<Union<');
});

test('GeoArrowGeometryConverter supports recursive native GeometryCollections', () => {
  const geometry: Geometry = {
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2]},
      {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [3, 4]
            ]
          },
          {type: 'Point', coordinates: [5, 6]}
        ]
      }
    ]
  };
  const source = convertFeaturesToGeoArrowTable([{type: 'Feature', properties: {}, geometry}], {
    geoarrow: {encoding: 'wkb'}
  }).data;

  const collection = convertGeoArrowGeometry(source, 'geoarrow.geometrycollection');
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');

  expect(convertGeoArrowToTable(collection, 'geojson-table').features[0].geometry).toEqual(
    geometry
  );
  expect(convertGeoArrowToTable(union, 'geojson-table').features[0].geometry).toEqual(geometry);

  const wkb = source.getChild('geometry');
  expect(wkb?.length).toBe(1);
});

test('GeoArrowGeometryConverter bounds GeometryCollection recursion', () => {
  const source = setGeometryFieldEncoding(
    arrow.tableFromArrays({
      geometry: ['GEOMETRYCOLLECTION (GEOMETRYCOLLECTION (POINT (1 2)))']
    }),
    'geoarrow.wkt'
  );

  expect(() =>
    convertGeoArrowGeometry(source, 'geoarrow.geometrycollection', {
      maxGeometryCollectionDepth: 1
    })
  ).toThrow(/maxGeometryCollectionDepth \(1\)/);
  expect(() =>
    convertGeoArrowGeometry(source, 'geoarrow.geometrycollection', {
      maxGeometryCollectionDepth: 0
    })
  ).toThrow(/maxGeometryCollectionDepth \(0\)/);
  expect(() =>
    convertGeoArrowGeometry(source, 'geoarrow.geometrycollection', {
      maxGeometryCollectionDepth: -1
    })
  ).toThrow(/non-negative safe integer/);

  const wkbSource = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'GeometryCollection',
          geometries: [
            {
              type: 'GeometryCollection',
              geometries: [{type: 'Point', coordinates: [1, 2]}]
            }
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  expect(() =>
    convertGeoArrowGeometry(wkbSource, 'geoarrow.geometrycollection', {
      maxGeometryCollectionDepth: 1
    })
  ).toThrow(/maxGeometryCollectionDepth \(1\)/);
});

test('GeoArrow vector validation rejects unknown dense-union type ids', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1]
        ]
      }
    }
  ];
  const table = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data,
    'geoarrow.wkb'
  );
  const convertedTable = convertGeoArrowGeometry(table, 'geoarrow.geometry');
  const unionData = convertedTable.getChild('geometry')!.data[0] as any;
  unionData.typeIds[unionData.offset] = 99;
  const validation = validateGeoArrowVector(
    convertedTable.getChild('geometry')!,
    'geoarrow.geometry'
  );
  expect(validation.valid).toBe(false);
  expect(validation.issues[0].message).toContain('Unknown dense union type id');
});

test('GeoArrowGeometryConverter round-trips every union geometry kind and null', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {kind: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2, 3, 4]}
    },
    {
      type: 'Feature',
      properties: {kind: 'line'},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0, 1, 2],
          [1, 1, 2, 3]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {kind: 'polygon'},
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0, 1, 2],
            [2, 0, 1, 2],
            [0, 2, 1, 2],
            [0, 0, 1, 2]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {kind: 'multipoint'},
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [1, 2, 3, 4],
          [5, 6, 7, 8]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {kind: 'multiline'},
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0, 1, 2],
            [1, 1, 2, 3]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      properties: {kind: 'multipolygon'},
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0, 1, 2],
              [2, 0, 1, 2],
              [0, 2, 1, 2],
              [0, 0, 1, 2]
            ]
          ]
        ]
      }
    }
  ];
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkt'}}).data,
    'geoarrow.wkt'
  );
  const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
  const roundTrip = convertGeoArrowGeometry(union, 'geoarrow.wkt');

  expect(union.getChild('geometry')?.type.toString()).toContain('Union<');
  expect(convertGeoArrowToTable(roundTrip, 'geojson-table').features).toEqual(features);
});

test('GeoArrowGeometryConverter handles null and empty geometry collections', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {kind: 'empty'},
      geometry: {type: 'GeometryCollection', geometries: []}
    },
    {
      type: 'Feature',
      properties: {kind: 'nested'},
      geometry: {
        type: 'GeometryCollection',
        geometries: [
          {type: 'Point', coordinates: [1, 2, 3]},
          {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0, 0],
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 0]
              ]
            ]
          }
        ]
      }
    }
  ];
  const source = setGeometryFieldEncoding(
    convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkt'}}).data,
    'geoarrow.wkt'
  );
  const collection = convertGeoArrowGeometry(source, 'geoarrow.geometrycollection');
  const union = convertGeoArrowGeometry(collection, 'geoarrow.geometry');
  const roundTrip = convertGeoArrowGeometry(union, 'geoarrow.wkb');

  expect(convertGeoArrowToTable(roundTrip, 'geojson-table').features).toEqual(features);

  const nullableWKT = setGeometryFieldEncoding(
    arrow.tableFromArrays({geometry: [null, 'POINT (1 2)']}),
    'geoarrow.wkt'
  );
  const nullableUnion = convertGeoArrowGeometry(nullableWKT, 'geoarrow.geometry');
  expect(nullableUnion.numRows).toBe(2);
  expect(nullableUnion.getChild('geometry')?.get(0)).toBeNull();
});

test('GeoArrowGeometryConverter preserves mixed WKT dimensions in direct union children', () => {
  const source = setGeometryFieldEncoding(
    arrow.tableFromArrays({
      geometry: ['POINT Z (1 2 3)', 'LINESTRING M (0 0 7, 3 4 8)']
    }),
    'geoarrow.wkt'
  );
  const converted = convertGeoArrowGeometry(source, 'geoarrow.geometry', {
    coordinates: 'separated',
    offsetType: 'int64'
  });
  const geometry = converted.getChild('geometry')!;
  const unionType = geometry.type as arrow.DenseUnion;

  expect(Array.from(unionType.typeIds)).toEqual([11, 22]);
  expect(unionType.children.map(child => child.name)).toEqual(['Point Z', 'LineString M']);
  expect(geometry.type.toString()).toContain('Struct<{x:Float64, y:Float64, z:Float64}>');
  expect(geometry.type.toString()).toContain(
    'LargeList<Struct<{x:Float64, y:Float64, m:Float64}>>'
  );

  const roundTrip = convertGeoArrowGeometry(converted, 'geoarrow.wkb');
  expect(convertGeoArrowToTable(roundTrip, 'geojson-table').features).toEqual([
    {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2, 3]}},
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0, 7],
          [3, 4, 8]
        ]
      }
    }
  ]);
});

test('GeoArrowGeometryConverter preserves mixed dimensions in direct WKT collections', () => {
  const source = setGeometryFieldEncoding(
    arrow.tableFromArrays({
      geometry: ['GEOMETRYCOLLECTION (POINT Z (1 2 3), LINESTRING M (0 0 7, 3 4 8))']
    }),
    'geoarrow.wkt'
  );
  const converted = convertGeoArrowGeometry(source, 'geoarrow.geometrycollection', {
    coordinates: 'separated',
    offsetType: 'int64'
  });
  const collection = converted.getChild('geometry')!;
  expect(collection.type.toString()).toContain('LargeList<Union<');
  const collectionUnionType = (collection.type as arrow.LargeList).valueType as arrow.DenseUnion;
  expect(collectionUnionType.children.map(child => child.name)).toEqual([
    'Point Z',
    'LineString M'
  ]);

  const roundTrip = convertGeoArrowGeometry(converted, 'geoarrow.wkb');
  expect(convertGeoArrowToTable(roundTrip, 'geojson-table').features[0].geometry).toEqual({
    type: 'GeometryCollection',
    geometries: [
      {type: 'Point', coordinates: [1, 2, 3]},
      {
        type: 'LineString',
        coordinates: [
          [0, 0, 7],
          [3, 4, 8]
        ]
      }
    ]
  });
});

test('GeoArrowGeometryConverter validates column selection and collection targets', async () => {
  const plainTable = arrow.tableFromArrays({value: [1]});
  expect(() => convertGeoArrowGeometry(plainTable, 'geoarrow.wkt')).toThrow(
    /requires at least one geometry column/
  );

  const pointTable = await loadArrowTable(GEOARROW_POINT_FILE);
  expect(() =>
    convertGeoArrowGeometry(pointTable, 'geoarrow.wkt', {geometryColumn: 'missing'})
  ).toThrow(/could not find geometry column/);
  expect(() =>
    convertGeoArrowGeometry(pointTable, 'geoarrow.wkt', {
      geometryColumn: 'geometry',
      geometryColumns: ['geometry']
    })
  ).toThrow(/Specify only one/);
  expect(() => convertGeoArrowGeometry(pointTable, 'geoarrow.geometrycollection')).toThrow(
    /(?:cannot encode Point|cannot be represented as) geoarrow.geometrycollection/
  );
});

test('GeoArrow conversion enforces opt-in WKB byte and vertex budgets', () => {
  const point = new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}));
  const line = new Uint8Array(
    convertGeometryToWKB({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2]
      ]
    })
  );
  const vector = arrow.vectorFromArray([point, line], new arrow.Binary());

  expect(() =>
    convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.geometry', {
      maxGeometryBytes: point.byteLength + line.byteLength - 1
    })
  ).toThrow(/maxGeometryBytes/);
  expect(() =>
    convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.geometry', {
      maxGeometryVertices: 3
    })
  ).toThrow(/maxGeometryVertices/);
  expect(
    convertGeoArrowVector(vector, 'geoarrow.wkb', 'geoarrow.geometry', {
      maxGeometryBytes: point.byteLength + line.byteLength,
      maxGeometryVertices: 4
    }).length
  ).toBe(2);
});

test('GeoArrow conversion enforces vertex budgets for native and WKT vectors', () => {
  const wktVector = arrow.vectorFromArray(
    ['POINT (1 2)', 'LINESTRING (0 0, 1 1)'],
    new arrow.Utf8()
  );
  expect(() =>
    convertGeoArrowVector(wktVector, 'geoarrow.wkt', 'geoarrow.point', {maxGeometryVertices: 2})
  ).toThrow(/maxGeometryVertices/);

  const nativeVector = arrow.vectorFromArray(
    [
      [
        [1, 2],
        [3, 4]
      ],
      [[5, 6]]
    ],
    new arrow.List(
      new arrow.Field(
        'vertices',
        new arrow.FixedSizeList(2, new arrow.Field('xy', new arrow.Float64()))
      )
    )
  );
  expect(() =>
    convertGeoArrowVector(nativeVector, 'geoarrow.linestring', 'geoarrow.wkb', {
      maxGeometryVertices: 2
    })
  ).toThrow(/maxGeometryVertices/);
});

test('GeoArrow resource budgets validate identity conversions and option values', async () => {
  const pointTable = await loadArrowTable(GEOARROW_POINT_WKB_FILE);
  const pointVector = pointTable.getChild('geometry')!;
  const pointBytes = (pointVector.get(0) as Uint8Array).byteLength;

  expect(() =>
    convertGeoArrowVector(pointVector, 'geoarrow.wkb', 'geoarrow.wkb', {
      maxGeometryBytes: pointBytes - 1
    })
  ).toThrow(/maxGeometryBytes/);
  expect(() =>
    convertGeoArrowGeometry(pointTable, 'geoarrow.wkb', {maxGeometryBytes: pointBytes - 1})
  ).toThrow(/maxGeometryBytes/);
  expect(() =>
    convertGeoArrowVector(pointVector, 'geoarrow.wkb', 'geoarrow.wkt', {
      maxGeometryVertices: -1
    })
  ).toThrow(/maxGeometryVertices must be a non-negative safe integer/);
  expect(() =>
    convertGeoArrowVector(pointVector, 'geoarrow.wkb', 'geoarrow.wkt', {
      maxGeometryBytes: Number.POSITIVE_INFINITY
    })
  ).toThrow(/maxGeometryBytes must be a non-negative safe integer/);
});

test('GeoArrowGeometryConverter selects concrete native encoding from GeoParquet types', () => {
  const features: Feature[] = [
    {
      type: 'Feature',
      properties: {kind: 'point'},
      geometry: {type: 'Point', coordinates: [1, 2]}
    },
    {
      type: 'Feature',
      properties: {kind: 'multipoint'},
      geometry: {
        type: 'MultiPoint',
        coordinates: [
          [3, 4],
          [5, 6]
        ]
      }
    }
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data;
  const converted = convertGeoArrowGeometry(source, 'native');
  const convertedGeometry = converted.getChild('geometry');

  expect(convertedGeometry?.type.toString()).toBe('List<FixedSizeList[2]<Float64>>');
  expect(Array.from(convertedGeometry?.get(0)?.get(0)?.toArray() || [])).toEqual([1, 2]);
  expect(Array.from(convertedGeometry?.get(1)?.get(0)?.toArray() || [])).toEqual([3, 4]);
  expect(Array.from(convertedGeometry?.get(1)?.get(1)?.toArray() || [])).toEqual([5, 6]);
});

test('GeoArrowGeometryConverter uses a union for mixed Z and M dimensions', () => {
  const geometryVector = arrow.vectorFromArray(
    [
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2, 3]}, {hasZ: true})),
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [4, 5, 6]}, {hasM: true}))
    ],
    new arrow.Binary()
  );
  const geometryField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.wkb']])
  );
  const source = setGeometryFieldEncoding(
    new arrow.Table(new arrow.Schema([geometryField]), [
      new arrow.RecordBatch(
        new arrow.Schema([geometryField]),
        arrow.makeData({
          type: new arrow.Struct([geometryField]),
          length: geometryVector.length,
          nullCount: 0,
          children: [geometryVector.data[0]]
        })
      )
    ]),
    'geoarrow.wkb'
  );

  const converted = convertGeoArrowGeometry(source, 'native');
  const geometry = converted.getChild('geometry')!;
  expect(geometry.type).toBeInstanceOf(arrow.DenseUnion);
  expect(convertGeoArrowToTable(converted, 'geojson-table').features).toHaveLength(2);
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[0].geometry).toEqual({
    type: 'Point',
    coordinates: [1, 2, 3]
  });
  expect(convertGeoArrowToTable(converted, 'geojson-table').features[1].geometry).toEqual({
    type: 'Point',
    coordinates: [4, 5, 6]
  });
});

test('GeoArrowGeometryConverter carries WKB M semantics into native layout conversion', () => {
  const geometryBytes = new Uint8Array(
    convertGeometryToWKB({type: 'Point', coordinates: [1, 2, 7]}, {hasM: true})
  );
  const geometryVector = arrow.vectorFromArray([geometryBytes], new arrow.Binary());
  const geometryField = new arrow.Field(
    'geometry',
    new arrow.Binary(),
    true,
    new Map([['ARROW:extension:name', 'geoarrow.wkb']])
  );
  const source = new arrow.Table(new arrow.Schema([geometryField]), [
    new arrow.RecordBatch(
      new arrow.Schema([geometryField]),
      arrow.makeData({
        type: new arrow.Struct([geometryField]),
        length: 1,
        nullCount: 0,
        children: [geometryVector.data[0]]
      })
    )
  ]);

  const native = convertGeoArrowGeometry(source, 'native');
  const separated = convertGeoArrowGeometry(native, 'native', {coordinates: 'separated'});

  expect(separated.getChild('geometry')?.type.toString()).toBe(
    'Struct<{x:Float64, y:Float64, m:Float64}>'
  );
  expect(convertGeoArrowToTable(separated, 'geojson-table').features[0].geometry).toEqual({
    type: 'Point',
    coordinates: [1, 2, 7]
  });
});

test('GeoArrowGeometryConverter preserves record batch boundaries', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [3, 4]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data;
  const sourceBatch = source.batches[0];
  const chunkedSource = new arrow.Table(source.schema, [
    sourceBatch.slice(0, 1),
    sourceBatch.slice(1)
  ]);
  const converted = convertGeoArrowGeometry(chunkedSource, 'native');

  expect(converted.batches).toHaveLength(2);
  expect(converted.batches.map(batch => batch.numRows)).toEqual([1, 1]);
  expect(Array.from(converted.batches[1].getChild('geometry')?.get(0) || [])).toEqual([3, 4]);
});

test('GeoArrowGeometryConverter keeps mixed union schemas stable across record batches', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {
      type: 'Feature',
      properties: {id: 2},
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 0],
          [3, 4]
        ]
      }
    }
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}}).data;
  const sourceBatch = source.batches[0];
  const chunkedSource = new arrow.Table(source.schema, [
    sourceBatch.slice(0, 1),
    sourceBatch.slice(1)
  ]);

  const converted = convertGeoArrowGeometry(chunkedSource, 'geoarrow.geometry');
  const unionTypes = converted.batches.map(batch => {
    const geometryType = batch.getChild('geometry')?.type;
    return geometryType instanceof arrow.DenseUnion
      ? geometryType.children.map(field => field.name)
      : [];
  });

  expect(unionTypes[0]).toEqual(['Point', 'LineString']);
  expect(unionTypes[1]).toEqual(unionTypes[0]);
  expect(
    convertGeoArrowToTable(converted, 'geojson-table').features.map(feature => feature.geometry)
  ).toEqual(features.map(feature => feature.geometry));
});

test('GeoArrowGeometryConverter returns the original vector for same-encoding conversion', async () => {
  const table = await loadArrowTable(GEOARROW_POINT_FILE);
  const vector = table.getChild('geometry')!;

  expect(convertGeoArrowVector(vector, 'geoarrow.point', 'geoarrow.point')).toBe(vector);
  expect(convertGeoArrowGeometry(table, 'geoarrow.point')).toBe(table);
});

test('GeoArrowGeometryConverter honors explicit native physical layout requests', () => {
  const source = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}}],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const nativeSource = convertGeoArrowGeometry(source, 'geoarrow.point');
  const vector = nativeSource.getChild('geometry')!;

  const separated = convertGeoArrowVector(vector, 'geoarrow.point', 'geoarrow.point', {
    coordinates: 'separated'
  });
  expect(separated).not.toBe(vector);
  expect(separated.type.toString()).toBe('Struct<{x:Float64, y:Float64}>');

  const convertedTable = convertGeoArrowGeometry(nativeSource, 'native', {
    geometryColumn: 'geometry',
    coordinates: 'separated'
  });
  expect(convertedTable).not.toBe(nativeSource);
  expect(
    convertedTable.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toBe('Struct<{x:Float64, y:Float64}>');
});

test('GeoArrowGeometryConverter uses Arrow buffers for native layout conversion', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [3, 4]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const nativeSource = convertGeoArrowGeometry(source, 'geoarrow.point');
  const vector = nativeSource.getChild('geometry')!;
  const getValue = vi.spyOn(vector, 'get').mockImplementation(() => {
    throw new Error('native buffer conversion must not call Vector.get');
  });

  const converted = convertGeoArrowVector(vector, 'geoarrow.point', 'geoarrow.point', {
    coordinates: 'separated'
  });

  getValue.mockRestore();
  expect(converted.type.toString()).toBe('Struct<{x:Float64, y:Float64}>');
});

test('GeoArrowGeometryConverter keeps sliced native conversions on the buffer kernel', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [3, 4]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const nativeSource = convertGeoArrowGeometry(source, 'geoarrow.point');
  const slicedVector = nativeSource.getChild('geometry')!.slice(1, 2);
  const getValue = vi.spyOn(slicedVector, 'get').mockImplementation(() => {
    throw new Error('sliced native buffer conversion must not call Vector.get');
  });

  const converted = convertGeoArrowVector(slicedVector, 'geoarrow.point', 'geoarrow.point', {
    coordinates: 'separated'
  });

  getValue.mockRestore();
  expect(converted.type.toString()).toBe('Struct<{x:Float64, y:Float64}>');
  expect(converted.get(0)).toMatchObject({x: 3, y: 4});
});

test('GeoArrowGeometryConverter normalizes offsets for sliced nested native conversions', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 1],
            [2, 3]
          ]
        }
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [4, 5],
            [6, 7]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const nativeSource = convertGeoArrowGeometry(source, 'geoarrow.linestring');
  const slicedVector = nativeSource.getChild('geometry')!.slice(1, 2);

  const converted = convertGeoArrowVector(
    slicedVector,
    'geoarrow.linestring',
    'geoarrow.linestring',
    {coordinates: 'separated'}
  );

  expect(
    converted
      .get(0)
      .toArray()
      .map((point: {x: number; y: number}) => [point.x, point.y])
  ).toEqual([
    [4, 5],
    [6, 7]
  ]);
});

test('GeoArrowGeometryConverter preserves nulls in sliced native buffers', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float64(), true)
  );
  const vector = arrow.vectorFromArray([[1, 2], null, [5, 6]], coordinateType);
  const converted = convertGeoArrowVector(vector.slice(1, 3), 'geoarrow.point', 'geoarrow.point', {
    coordinates: 'separated'
  });

  expect(converted.get(0)).toBeNull();
  expect(converted.get(1)).toMatchObject({x: 5, y: 6});
});

test('GeoArrowGeometryConverter preserves Float32 native coordinate precision', () => {
  const coordinateType = new arrow.FixedSizeList(
    2,
    new arrow.Field('item', new arrow.Float32(), true)
  );
  const vector = arrow.vectorFromArray(
    [
      [1, 2],
      [3, 4]
    ],
    coordinateType
  );
  const converted = convertGeoArrowVector(vector, 'geoarrow.point', 'geoarrow.point', {
    coordinates: 'separated'
  });

  expect(converted.type.toString()).toBe('Struct<{x:Float32, y:Float32}>');
  expect(converted.get(1)).toMatchObject({x: 3, y: 4});
});

test.each([
  ['xym', ['x', 'y', 'm'], [1, 2, 7]] as const,
  ['xyzm', ['x', 'y', 'z', 'm'], [1, 2, 3, 7]] as const
])('native-to-native conversion preserves separated %s semantic axes', (dimension, names, values) => {
  const source = setGeometryFieldEncoding(
    arrow.tableFromArrays({
      geometry: [
        dimension === 'xym' ? `POINT M (${values.join(' ')})` : `POINT ZM (${values.join(' ')})`
      ]
    }),
    'geoarrow.wkt'
  );
  const separated = convertGeoArrowGeometry(source, 'geoarrow.point', {
    dimension,
    coordinates: 'separated'
  });
  const interleaved = convertGeoArrowGeometry(separated, 'geoarrow.point', {
    coordinates: 'interleaved'
  });
  const separatedField = separated.schema.fields.find(field => field.name === 'geometry');
  const interleavedField = interleaved.schema.fields.find(field => field.name === 'geometry');

  expect(separatedField?.type.toString()).toBe(
    `Struct<{${names.map(name => `${name}:Float64`).join(', ')}}>`
  );
  expect(Array.from(interleaved.getChild('geometry')?.get(0)?.toArray() || [])).toEqual(values);
  expect(interleavedField?.metadata?.get('ARROW:extension:metadata')).toContain(
    dimension === 'xym' ? 'Point M' : 'Point ZM'
  );
});

test('GeoArrowGeometryConverter promotes native geometry without GeoJSON materialization', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [3, 4]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const points = convertGeoArrowGeometry(source, 'geoarrow.point');
  const multipoints = convertGeoArrowGeometry(points, 'geoarrow.multipoint', {
    coordinates: 'separated',
    offsetType: 'int64'
  });
  const geometryField = multipoints.schema.fields.find(field => field.name === 'geometry');

  expect(geometryField?.type.toString()).toBe('LargeList<Struct<{x:Float64, y:Float64}>>');
  expect(convertGeoArrowToTable(multipoints, 'geojson-table').features).toEqual([
    {type: 'Feature', properties: {}, geometry: {type: 'MultiPoint', coordinates: [[1, 2]]}},
    {type: 'Feature', properties: {}, geometry: {type: 'MultiPoint', coordinates: [[3, 4]]}}
  ]);
});

test('GeoArrowGeometryConverter writes separated coordinates with large offsets', async () => {
  const table = await loadArrowTable(GEOARROW_LINE_WKT_FILE);
  const converted = convertGeoArrowGeometry(table, 'geoarrow.linestring', {
    coordinates: 'separated',
    offsetType: 'int64'
  });

  expect(converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()).toBe(
    'LargeList<Struct<{x:Float64, y:Float64}>>'
  );
  expect(convertGeoArrowToTable(converted, 'geojson-table').features).toEqual(
    convertGeoArrowToTable(table, 'geojson-table').features
  );
});

test('GeoArrowGeometryConverter narrows representable native offsets without row materialization', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 1],
            [2, 3]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const large = convertGeoArrowGeometry(source, 'geoarrow.linestring', {
    offsetType: 'int64'
  });
  const largeVector = large.getChild('geometry')!;
  const getValue = vi.spyOn(largeVector, 'get').mockImplementation(() => {
    throw new Error('offset conversion must not call Vector.get');
  });

  const narrowed = convertGeoArrowVector(
    largeVector,
    'geoarrow.linestring',
    'geoarrow.linestring',
    {offsetType: 'int32'}
  );

  getValue.mockRestore();
  expect(narrowed.type.toString()).toBe('List<FixedSizeList[2]<Float64>>');
  expect(
    narrowed
      .get(0)
      .toArray()
      .map((point: number[]) => Array.from(point))
  ).toEqual([
    [0, 1],
    [2, 3]
  ]);
});

test('GeoArrowGeometryConverter preserves XYM semantics when writing WKB', () => {
  const source = setGeometryFieldEncoding(
    arrow.tableFromArrays({geometry: ['POINT M (1 2 7)']}),
    'geoarrow.wkt'
  );
  const native = convertGeoArrowGeometry(source, 'geoarrow.point', {dimension: 'xym'});
  const wkb = convertGeoArrowGeometry(native, 'geoarrow.wkb');
  const bytes = wkb.getChild('geometry')?.get(0) as Uint8Array;
  const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  expect(dataView.getUint32(1, true)).toBe(2001);
  expect(convertGeoArrowToTable(wkb, 'geojson-table').features[0].geometry).toEqual({
    type: 'Point',
    coordinates: [1, 2, 7]
  });
});

test.each([
  ['geoarrow.point', 'Point'],
  ['geoarrow.geometry', 'Point'],
  ['geoarrow.box', 'Box']
] as const)('table conversion writes requested %s output', (encoding, expectedEncoding) => {
  const table = {
    shape: 'geojson-table' as const,
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        properties: {id: 1},
        geometry: {type: 'Point' as const, coordinates: [1, 2]}
      }
    ]
  };
  const converted = convertTableToGeoArrow(table, {
    geoarrow: {encoding, coordinates: 'separated'}
  });

  expect(
    converted.schema.fields
      .find(field => field.name === 'geometry')
      ?.metadata?.get?.('ARROW:extension:name')
  ).toBe(expectedEncoding === 'Box' ? 'geoarrow.box' : encoding);
  expect(converted.numRows).toBe(1);
});

test('table conversion applies native options to an existing GeoArrow Arrow table', () => {
  const source = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {}, geometry: {type: 'Point', coordinates: [1, 2]}}],
    {geoarrow: {encoding: 'wkb'}}
  ).data;
  const converted = convertTableToGeoArrow(
    {shape: 'arrow-table', data: source},
    {geoarrow: {encoding: 'geoarrow.point', coordinates: 'separated'}}
  );

  expect(converted.schema.fields.find(field => field.name === 'geometry')?.type.toString()).toBe(
    'Struct<{x:Float64, y:Float64}>'
  );
});

test.each([
  {
    shape: 'object-row-table' as const,
    data: [{id: 1, location: {type: 'Point' as const, coordinates: [1, 2]}}]
  },
  {
    shape: 'columnar-table' as const,
    data: {id: [1], location: [{type: 'Point' as const, coordinates: [1, 2]}]}
  }
])('table conversion adapts %s geometry rows to native GeoArrow', table => {
  const converted = convertTableToGeoArrow(table, {
    geoarrow: {encoding: 'geoarrow.point', geometryColumn: 'location'}
  });

  expect(converted.schema.fields.map(field => field.name)).toEqual(['id', 'location']);
  expect(converted.schema.fields.find(field => field.name === 'location')?.type.toString()).toBe(
    'FixedSizeList[2]<Float64>'
  );
});

test('table conversion rejects conflicting exact and preferred encodings', () => {
  expect(() =>
    convertTableToGeoArrow(
      {
        shape: 'object-row-table',
        data: [{geometry: {type: 'Point', coordinates: [1, 2]}}]
      },
      {geoarrow: {encoding: 'geoarrow.point', encodingPreference: 'optimized'}}
    )
  ).toThrow('both encoding and encodingPreference');
});
