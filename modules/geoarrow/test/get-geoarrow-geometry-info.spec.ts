import {describe, expect, test} from 'vitest';
import * as arrow from 'apache-arrow';
import {
  getGeoArrowGeometryInfo,
  isGeoArrowGeometry,
  isGeoArrowLineString,
  isGeoArrowMultiLineString,
  isGeoArrowMultiPoint,
  isGeoArrowMultiPolygon,
  isGeoArrowPoint,
  isGeoArrowPolygon
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
    expect(getGeoArrowGeometryInfo(new arrow.Field('invalid', invalidStruct))).toBeNull();
    expect(getGeoArrowGeometryInfo(new arrow.Field('scalar', new arrow.Int32()))).toBeNull();
  });
});
