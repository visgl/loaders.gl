// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {expect, test} from 'vitest';
import {
  convertGeometryColumnToBinaryFeatureCollection,
  convertGeometryToWKB,
  convertGeometryValuesToBinaryFeatureCollection,
  GeoArrowBuilder,
  type GeometryColumnBinaryFeatureCollectionScratch
} from '@loaders.gl/gis';

test('gis#geometry-column-to-binary converts WKB geometry columns', () => {
  const table = {
    shape: 'object-row-table' as const,
    data: [
      {
        id: 1,
        geometry: new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]}))
      },
      {
        id: 2,
        geometry: new Uint8Array(
          convertGeometryToWKB({
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1]
            ]
          })
        )
      },
      {
        id: 3,
        geometry: new Uint8Array(
          convertGeometryToWKB({
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0]
              ]
            ]
          })
        )
      }
    ]
  };
  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry',
    geometryEncoding: 'wkb'
  });

  expect(binaryFeatures.points?.properties[0]?.id).toBe(1);
  expect(binaryFeatures.lines?.properties[0]?.id).toBe(2);
  expect(binaryFeatures.polygons?.properties[0]?.id).toBe(3);
  expect(Array.from(binaryFeatures.lines?.pathIndices.value || [])).toEqual([0, 2]);
  expect(binaryFeatures.polygons?.triangles?.value.length || 0).toBeGreaterThan(0);
});

test('gis#geometry-column-to-binary converts WKT geometry collections into multiple bins', () => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    ['GEOMETRYCOLLECTION (POINT (1 2), LINESTRING (0 0, 1 1), POLYGON ((0 0, 1 0, 1 1, 0 0)))'],
    {geometryEncoding: 'wkt', properties: [{name: 'collection'}]}
  );

  expect(binaryFeatures.points?.properties).toHaveLength(1);
  expect(binaryFeatures.lines?.properties).toHaveLength(1);
  expect(binaryFeatures.polygons?.properties).toHaveLength(1);
  expect(binaryFeatures.points?.globalFeatureIds.value[0]).toBe(0);
  expect(binaryFeatures.lines?.globalFeatureIds.value[0]).toBe(0);
  expect(binaryFeatures.polygons?.globalFeatureIds.value[0]).toBe(0);
  expect(binaryFeatures.points?.properties[0]).toEqual({name: 'collection'});
});

test('gis#geometry-column-to-binary converts multipart WKB with Z values', () => {
  const binaryFeatures = convertGeometryValuesToBinaryFeatureCollection(
    [
      new Uint8Array(
        convertGeometryToWKB(
          {
            type: 'MultiPoint',
            coordinates: [
              [1, 2, 3],
              [4, 5, 6]
            ]
          },
          {hasZ: true}
        )
      ),
      new Uint8Array(
        convertGeometryToWKB(
          {
            type: 'MultiLineString',
            coordinates: [
              [
                [0, 0, 1],
                [1, 1, 1]
              ],
              [
                [2, 2, 1],
                [3, 3, 1]
              ]
            ]
          },
          {hasZ: true}
        )
      ),
      new Uint8Array(
        convertGeometryToWKB(
          {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [0, 0, 1],
                  [2, 0, 1],
                  [0, 2, 1],
                  [0, 0, 1]
                ]
              ],
              [
                [
                  [3, 3, 1],
                  [5, 3, 1],
                  [3, 5, 1],
                  [3, 3, 1]
                ]
              ]
            ]
          },
          {hasZ: true}
        )
      ),
      null
    ],
    {
      getProperties: rowIndex => ({rowIndex}),
      globalFeatureIdOffset: 100,
      triangulate: false
    }
  );

  expect(binaryFeatures.points?.positions.size).toBe(3);
  expect(Array.from(binaryFeatures.points?.featureIds.value || [])).toEqual([0, 0]);
  expect(Array.from(binaryFeatures.points?.globalFeatureIds.value || [])).toEqual([100, 100]);
  expect(binaryFeatures.points?.properties).toEqual([{rowIndex: 0}]);
  expect(Array.from(binaryFeatures.lines?.pathIndices.value || [])).toEqual([0, 2, 4]);
  expect(Array.from(binaryFeatures.lines?.globalFeatureIds.value || [])).toEqual([
    101, 101, 101, 101
  ]);
  expect(Array.from(binaryFeatures.polygons?.polygonIndices.value || [])).toEqual([0, 4, 8]);
  expect(Array.from(binaryFeatures.polygons?.globalFeatureIds.value || [])).toEqual([
    102, 102, 102, 102, 102, 102, 102, 102
  ]);
  expect(binaryFeatures.polygons?.triangles).toBeUndefined();
});

test('gis#geometry-column-to-binary reuses scratch arrays when capacity is sufficient', () => {
  const scratch: GeometryColumnBinaryFeatureCollectionScratch = {};
  const first = convertGeometryValuesToBinaryFeatureCollection(
    [
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})),
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [3, 4]}))
    ],
    {geometryEncoding: 'wkb', scratch}
  );
  const originalPositions = scratch.points?.positions;
  const originalFeatureIds = scratch.points?.featureIds;

  const second = convertGeometryValuesToBinaryFeatureCollection(
    [new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [5, 6]}))],
    {geometryEncoding: 'wkb', scratch}
  );

  expect(scratch.points?.positions).toBe(originalPositions);
  expect(scratch.points?.featureIds).toBe(originalFeatureIds);
  expect(first.points?.positions.value.buffer).toBe(originalPositions?.buffer);
  expect(second.points?.positions.value.buffer).toBe(originalPositions?.buffer);
});

test('gis#geometry-column-to-binary grows scratch arrays when capacity is insufficient', () => {
  const scratch: GeometryColumnBinaryFeatureCollectionScratch = {
    points: {
      positions: new Float64Array(2),
      featureIds: new Uint32Array(1),
      globalFeatureIds: new Uint32Array(1)
    }
  };

  convertGeometryValuesToBinaryFeatureCollection(
    [
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [1, 2]})),
      new Uint8Array(convertGeometryToWKB({type: 'Point', coordinates: [3, 4]}))
    ],
    {geometryEncoding: 'wkb', scratch}
  );

  expect(scratch.points?.positions?.length || 0).toBeGreaterThanOrEqual(4);
  expect(scratch.points?.featureIds?.length || 0).toBeGreaterThanOrEqual(2);
  expect(scratch.points?.globalFeatureIds?.length || 0).toBeGreaterThanOrEqual(2);
});

test('gis#geometry-column-to-binary reads Arrow string columns', () => {
  const arrowTable = arrow.tableFromArrays({
    id: [1],
    geometry: ['LINESTRING (0 0, 1 1)']
  });
  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(arrowTable, {
    geometryColumn: 'geometry',
    geometryEncoding: 'wkt'
  });

  expect(binaryFeatures.lines?.properties[0]?.id).toBe(1);
  expect(Array.from(binaryFeatures.lines?.positions.value || [])).toEqual([0, 0, 1, 1]);
});

test('gis#geometry-column-to-binary compacts null typed GeoArrow points', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginPoint();
        builder.writeCoordinate(1, 2, 3);
      },
      null,
      builder => {
        builder.beginPoint();
        builder.writeCoordinate(4, 5, 6);
      }
    ],
    {encoding: 'geoarrow.point', hasZ: true}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.point',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10, 20, 30]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry',
    globalFeatureIdOffset: 7
  });

  expect(Array.from(binaryFeatures.points?.positions.value || [])).toEqual([1, 2, 3, 4, 5, 6]);
  expect(binaryFeatures.points?.positions.size).toBe(3);
  expect(Array.from(binaryFeatures.points?.featureIds.value || [])).toEqual([0, 1]);
  expect(Array.from(binaryFeatures.points?.globalFeatureIds.value || [])).toEqual([7, 9]);
  expect(binaryFeatures.points?.properties).toEqual([{id: 10}, {id: 30}]);
});

test('gis#geometry-column-to-binary converts typed GeoArrow multipoints', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginMultiPoint(2);
        builder.writeCoordinate(0, 0);
        builder.writeCoordinate(1, 1);
      },
      builder => {
        builder.beginMultiPoint(1);
        builder.writeCoordinate(2, 2);
      }
    ],
    {encoding: 'geoarrow.multipoint'}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.multipoint',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10, 20]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry'
  });

  expect(binaryFeatures.points?.positions.value.buffer).toBe(geometryArray.coordinates.buffer);
  expect(Array.from(binaryFeatures.points?.featureIds.value || [])).toEqual([0, 0, 1]);
  expect(Array.from(binaryFeatures.points?.globalFeatureIds.value || [])).toEqual([0, 0, 1]);
  expect(binaryFeatures.points?.properties).toEqual([{id: 10}, {id: 20}]);
});

test('gis#geometry-column-to-binary converts typed GeoArrow line strings', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginLineString(2);
        builder.writeCoordinate(0, 0);
        builder.writeCoordinate(1, 1);
      },
      builder => {
        builder.beginLineString(3);
        builder.writeCoordinate(2, 2);
        builder.writeCoordinate(3, 3);
        builder.writeCoordinate(4, 4);
      }
    ],
    {encoding: 'geoarrow.linestring'}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.linestring',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10, 20]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry'
  });

  expect(binaryFeatures.lines?.positions.value.buffer).toBe(geometryArray.coordinates.buffer);
  expect(Array.from(binaryFeatures.lines?.pathIndices.value || [])).toEqual([0, 2, 5]);
  expect(Array.from(binaryFeatures.lines?.featureIds.value || [])).toEqual([0, 0, 1, 1, 1]);
  expect(binaryFeatures.lines?.properties).toEqual([{id: 10}, {id: 20}]);
});

test('gis#geometry-column-to-binary converts typed GeoArrow polygons', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginPolygon(1);
        builder.beginLinearRing(4);
        builder.writeCoordinate(0, 0);
        builder.writeCoordinate(2, 0);
        builder.writeCoordinate(0, 2);
        builder.writeCoordinate(0, 0);
      }
    ],
    {encoding: 'geoarrow.polygon'}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.polygon',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry',
    triangulate: false
  });

  expect(binaryFeatures.polygons?.positions.value.buffer).toBe(geometryArray.coordinates.buffer);
  expect(Array.from(binaryFeatures.polygons?.polygonIndices.value || [])).toEqual([0, 4]);
  expect(Array.from(binaryFeatures.polygons?.primitivePolygonIndices.value || [])).toEqual([0, 4]);
  expect(Array.from(binaryFeatures.polygons?.featureIds.value || [])).toEqual([0, 0, 0, 0]);
  expect(binaryFeatures.polygons?.triangles).toBeUndefined();
});

test('gis#geometry-column-to-binary converts typed GeoArrow multipolygons', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginMultiPolygon(2);
        builder.beginPolygon(1);
        builder.beginLinearRing(4);
        builder.writeCoordinate(0, 0);
        builder.writeCoordinate(2, 0);
        builder.writeCoordinate(0, 2);
        builder.writeCoordinate(0, 0);
        builder.beginPolygon(1);
        builder.beginLinearRing(4);
        builder.writeCoordinate(3, 3);
        builder.writeCoordinate(5, 3);
        builder.writeCoordinate(3, 5);
        builder.writeCoordinate(3, 3);
      }
    ],
    {encoding: 'geoarrow.multipolygon'}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.multipolygon',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry'
  });

  expect(binaryFeatures.polygons?.positions.value.buffer).toBe(geometryArray.coordinates.buffer);
  expect(Array.from(binaryFeatures.polygons?.polygonIndices.value || [])).toEqual([0, 4, 8]);
  expect(Array.from(binaryFeatures.polygons?.primitivePolygonIndices.value || [])).toEqual([
    0, 4, 8
  ]);
  expect(Array.from(binaryFeatures.polygons?.featureIds.value || [])).toEqual([
    0, 0, 0, 0, 0, 0, 0, 0
  ]);
  expect(binaryFeatures.polygons?.triangles?.value.length || 0).toBeGreaterThan(0);
});

test('gis#geometry-column-to-binary reuses typed GeoArrow coordinate buffers', () => {
  const geometryArray = GeoArrowBuilder.buildGeometryArray(
    [
      builder => {
        builder.beginMultiLineString(2);
        builder.beginLineString(2);
        builder.writeCoordinate(0, 0);
        builder.writeCoordinate(1, 1);
        builder.beginLineString(2);
        builder.writeCoordinate(2, 2);
        builder.writeCoordinate(3, 3);
      },
      builder => {
        builder.beginMultiLineString(1);
        builder.beginLineString(2);
        builder.writeCoordinate(4, 4);
        builder.writeCoordinate(5, 5);
      }
    ],
    {encoding: 'geoarrow.multilinestring'}
  );
  const table = makeGeoArrowTestTable(
    'geoarrow.multilinestring',
    GeoArrowBuilder.makeGeometryData(geometryArray),
    [10, 20]
  );

  const binaryFeatures = convertGeometryColumnToBinaryFeatureCollection(table, {
    geometryColumn: 'geometry'
  });

  expect(binaryFeatures.lines?.positions.value.buffer).toBe(geometryArray.coordinates.buffer);
  expect(Array.from(binaryFeatures.lines?.pathIndices.value || [])).toEqual([0, 2, 4, 6]);
  expect(Array.from(binaryFeatures.lines?.featureIds.value || [])).toEqual([0, 0, 0, 0, 1, 1]);
  expect(binaryFeatures.lines?.properties[0]?.id).toBe(10);
  expect(binaryFeatures.lines?.properties[1]?.id).toBe(20);
});

function makeGeoArrowTestTable(
  encoding: string,
  geometryData: arrow.Data,
  ids: number[]
): arrow.Table {
  const idData = arrow.makeData({
    type: new arrow.Int32(),
    data: Int32Array.from(ids)
  } as any);
  const schema = new arrow.Schema([
    new arrow.Field('id', new arrow.Int32(), false),
    new arrow.Field(
      'geometry',
      geometryData.type,
      true,
      new Map([['ARROW:extension:name', encoding]])
    )
  ]);
  const structData = new arrow.Data(new arrow.Struct(schema.fields), 0, ids.length, 0, undefined, [
    idData,
    geometryData
  ]);
  return new arrow.Table(schema, [new arrow.RecordBatch(schema, structData)]);
}
