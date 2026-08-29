import {describe, expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  convertGeoArrowVector,
  getGeoArrowNativeGeometry,
  getGeoArrowGeometryInfo,
  getGeoArrowFieldInfo,
  isGeoArrowGeometry,
  isGeoArrowBox,
  isGeoArrowLineString,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPoint,
  isGeoArrowMultiPolygon,
  isGeoArrowPoint,
  isGeoArrowPolygon,
  inspectGeoArrowVector
} from '@loaders.gl/geoarrow';
import {GeoArrowGeometryInfo} from '../src/get-geoarrow-geometry-info';
// fix a bug that map bounds are not updated correctly from arrow samples
test('geoarrow#getGeoArrowGeometryInfo', () => {
  const testCases: {
    field: arrow.Field;
    info: Partial<GeoArrowGeometryInfo>;
  }[] = [
    // {
    //   field: new arrow.Field('point', new arrow.Float(arrow.Precision.DOUBLE)),
    //   info: {
    //     compatibleEncodings: ['geoarrow.wkt'],
    //     nesting: 0,
    //     dimension: 2,
    //     coordinates: 'interleaved',
    //     valueType: 'double'
    //   }
    // },
    {
      field: new arrow.Field('line', new arrow.Utf8()),
      info: {
        compatibleEncodings: ['geoarrow.wkt']
        // nesting: 1,
        // dimension: 2,
        // coordinates: 'interleaved',
        // valueType: 'double'
      }
    },
    {
      field: new arrow.Field('line', new arrow.Binary()),
      info: {
        compatibleEncodings: ['geoarrow.wkb']
        // nesting: 1,
        // dimension: 2,
        // coordinates: 'interleaved',
        // valueType: 'double'
      }
    }
  ];
  for (const testCase of testCases) {
    const info = getGeoArrowGeometryInfo(testCase.field);
    expect(info, testCase.field.toString()).toMatchObject(testCase.info);
  }
});

describe('GeoArrow nested geometry recognition', () => {
  const point = new arrow.FixedSizeList(
    2,
    new arrow.Field('coordinate', new arrow.Float64(), false)
  );
  const lineString = new arrow.List(new arrow.Field('points', point, false));
  const polygon = new arrow.List(new arrow.Field('rings', lineString, false));
  const multiPolygon = new arrow.List(new arrow.Field('polygons', polygon, false));

  test('describes interleaved point through multipolygon fields', () => {
    const fields = [point, lineString, polygon, multiPolygon].map(
      (type, index) => new arrow.Field(`geometry-${index}`, type, true)
    );

    expect(getGeoArrowGeometryInfo(fields[0])).toMatchObject({
      compatibleEncodings: ['geoarrow.point'],
      nesting: 0,
      dimension: 2,
      coordinates: 'interleaved'
    });
    expect(getGeoArrowGeometryInfo(fields[1])?.nesting).toBe(1);
    expect(getGeoArrowGeometryInfo(fields[2])?.nesting).toBe(2);
    expect(getGeoArrowGeometryInfo(fields[3])?.nesting).toBe(3);
  });

  test('recognizes nested GeoArrow data types', () => {
    expect(isGeoArrowPoint(point)).toBe(true);
    expect(isGeoArrowLineString(lineString)).toBe(true);
    expect(isGeoArrowMultiPoint(lineString)).toBe(true);
    expect(isGeoArrowPolygon(polygon)).toBe(true);
    expect(isGeoArrowMultiLineString(polygon)).toBe(true);
    expect(isGeoArrowMultiPolygon(multiPolygon)).toBe(true);
    expect(isGeoArrowGeometry(multiPolygon)).toBe(true);
  });

  test('rejects invalid dimensions, coordinate types, and nesting', () => {
    const oneDimensional = new arrow.FixedSizeList(
      1,
      new arrow.Field('coordinate', new arrow.Float64())
    );
    const integerCoordinates = new arrow.FixedSizeList(
      2,
      new arrow.Field('coordinate', new arrow.Int32())
    );
    const structCoordinates = new arrow.Struct([
      new arrow.Field('x', new arrow.Float64()),
      new arrow.Field('y', new arrow.Float64())
    ]);
    const invalidStruct = new arrow.Struct([
      new arrow.Field('x', new arrow.Float64()),
      new arrow.Field('y', new arrow.Int32())
    ]);

    expect(isGeoArrowPoint(oneDimensional)).toBe(false);
    expect(isGeoArrowPoint(integerCoordinates)).toBe(false);
    expect(isGeoArrowLineString(new arrow.Utf8())).toBe(false);
    expect(isGeoArrowPolygon(lineString)).toBe(false);
    expect(getGeoArrowGeometryInfo(new arrow.Field('struct', structCoordinates))).toMatchObject({
      coordinates: 'separated',
      dimension: 2
    });
    expect(isGeoArrowPoint(structCoordinates)).toBe(true);
    expect(getGeoArrowGeometryInfo(new arrow.Field('invalid', invalidStruct))).toBeNull();
    expect(getGeoArrowGeometryInfo(new arrow.Field('scalar', new arrow.Int32()))).toBeNull();
  });

  test('recognizes canonical GeoArrow Box structs', () => {
    const box = new arrow.Struct([
      new arrow.Field('xmin', new arrow.Float64()),
      new arrow.Field('ymin', new arrow.Float64()),
      new arrow.Field('xmax', new arrow.Float64()),
      new arrow.Field('ymax', new arrow.Float64())
    ]);
    expect(getGeoArrowGeometryInfo(new arrow.Field('box', box))).toMatchObject({
      compatibleEncodings: ['geoarrow.box'],
      dimension: 2,
      coordinates: 'separated'
    });
    expect(isGeoArrowBox(box)).toBe(true);
    expect(isGeoArrowGeometry(box)).toBe(false);
  });

  test('recognizes Arrow view storage for WKB and WKT', () => {
    expect(getGeoArrowGeometryInfo(new arrow.Field('wkt', new arrow.Utf8View()))).toMatchObject({
      compatibleEncodings: ['geoarrow.wkt'],
      nesting: 0
    });
    expect(getGeoArrowGeometryInfo(new arrow.Field('wkb', new arrow.BinaryView()))).toMatchObject({
      compatibleEncodings: ['geoarrow.wkb'],
      nesting: 0
    });
  });

  test('preserves XYM and XYZM semantics from separated child names', () => {
    const xym = new arrow.Struct([
      new arrow.Field('x', new arrow.Float64()),
      new arrow.Field('y', new arrow.Float64()),
      new arrow.Field('m', new arrow.Float64())
    ]);
    const xyzm = new arrow.Struct([
      new arrow.Field('x', new arrow.Float64()),
      new arrow.Field('y', new arrow.Float64()),
      new arrow.Field('z', new arrow.Float64()),
      new arrow.Field('m', new arrow.Float64())
    ]);
    const xymField = new arrow.Field(
      'xym',
      xym,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.point']])
    );
    const xyzmField = new arrow.Field(
      'xyzm',
      xyzm,
      true,
      new Map([['ARROW:extension:name', 'geoarrow.point']])
    );

    expect(getGeoArrowFieldInfo(xymField)?.dimension).toBe('xym');
    expect(getGeoArrowFieldInfo(xyzmField)?.dimension).toBe('xyzm');
  });

  test('recognizes dense union and geometry collection fields', () => {
    const source = convertFeaturesToGeoArrowTable([
      {
        type: 'Feature',
        properties: {},
        geometry: {type: 'Point', coordinates: [1, 2]}
      },
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
    ]).data;
    const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
    const collection = convertGeoArrowGeometry(
      convertFeaturesToGeoArrowTable([
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'GeometryCollection',
            geometries: [{type: 'Point', coordinates: [1, 2]}]
          }
        }
      ]).data,
      'geoarrow.geometrycollection'
    );

    expect(getGeoArrowGeometryInfo(union.schema.fields[0])).toMatchObject({
      compatibleEncodings: ['geoarrow.geometry'],
      nesting: null,
      dimension: 2,
      coordinates: 'interleaved'
    });
    expect(getGeoArrowGeometryInfo(collection.schema.fields[0])).toMatchObject({
      compatibleEncodings: ['geoarrow.geometrycollection'],
      nesting: 1,
      dimension: 2,
      coordinates: 'interleaved'
    });
  });

  test('reads dense unions with legal non-canonical child names', () => {
    const source = convertFeaturesToGeoArrowTable([
      {
        type: 'Feature',
        properties: {},
        geometry: {type: 'Point', coordinates: [1, 2]}
      },
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
    ]).data;
    const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
    const vector = union.getChild('geometry')!;
    const data = vector.data[0];
    const renamedType = new arrow.DenseUnion(
      vector.type.typeIds,
      vector.type.children.map(
        (field, index) =>
          new arrow.Field(index === 0 ? 'custom point member' : 'custom line member', field.type)
      )
    );
    const renamedVector = arrow.makeVector(
      arrow.makeData({
        type: renamedType,
        offset: data.offset,
        length: data.length,
        typeIds: data.typeIds,
        valueOffsets: data.valueOffsets,
        children: data.children
      } as any)
    );

    expect(getGeoArrowNativeGeometry(renamedVector, 0, 'geoarrow.geometry')).toMatchObject({
      type: 'Point',
      coordinates: [1, 2]
    });
    expect(getGeoArrowNativeGeometry(renamedVector, 1, 'geoarrow.geometry')).toMatchObject({
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1]
      ]
    });
    expect(inspectGeoArrowVector(renamedVector, 'geoarrow.geometry').geometryTypes).toEqual([
      'Point',
      'LineString'
    ]);

    const wkt = convertGeoArrowVector(renamedVector, 'geoarrow.geometry', 'geoarrow.wkt');
    expect(wkt.toArray()).toEqual(['POINT (1 2)', 'LINESTRING (0 0, 1 1)']);

    const wkb = convertGeoArrowVector(renamedVector, 'geoarrow.geometry', 'geoarrow.wkb');
    const roundTripWkt = convertGeoArrowVector(wkb, 'geoarrow.wkb', 'geoarrow.wkt');
    expect(roundTripWkt.toArray()).toEqual(['POINT (1 2)', 'LINESTRING (0 0, 1 1)']);
  });

  test('does not guess common properties for mixed union dimensions', () => {
    const source = convertFeaturesToGeoArrowTable([
      {
        type: 'Feature',
        properties: {},
        geometry: {type: 'Point', coordinates: [1, 2]}
      },
      {
        type: 'Feature',
        properties: {},
        geometry: {type: 'Point', coordinates: [3, 4, 5]}
      }
    ]).data;
    const union = convertGeoArrowGeometry(source, 'geoarrow.geometry');
    const info = getGeoArrowGeometryInfo(union.schema.fields[0]);

    expect(info?.compatibleEncodings).toEqual(['geoarrow.geometry']);
    expect(info?.dimension).toBeNull();
    expect(info?.coordinates).toBe('interleaved');
  });
});
