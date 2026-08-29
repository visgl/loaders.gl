import * as arrow from 'apache-arrow';
import {describe, expect, test} from 'vitest';
import {
  convertFeaturesToGeoArrowTable,
  convertGeoArrowGeometry,
  inspectGeoArrowLayout
} from '@loaders.gl/geoarrow';

function extensionMetadata(encoding: string): Map<string, string> {
  return new Map([['ARROW:extension:name', encoding]]);
}

describe('GeoArrow physical layout oracle', () => {
  test('classifies native layouts and reports nested storage facts', () => {
    const coordinate = new arrow.FixedSizeList(
      2,
      new arrow.Field('item', new arrow.Float64(), true)
    );
    const field = new arrow.Field(
      'geometry',
      new arrow.LargeList(
        new arrow.Field(
          'lines',
          new arrow.LargeList(new arrow.Field('points', coordinate, true)),
          true
        )
      ),
      true,
      extensionMetadata('geoarrow.multilinestring')
    );

    const result = inspectGeoArrowLayout(field);

    expect(result.valid).toBe(true);
    expect(result.layout).toMatchObject({
      encoding: 'geoarrow.multilinestring',
      kind: 'multilinestring',
      storage: 'large-list',
      dimension: 'xy',
      coordinates: 'interleaved',
      coordinatePrecision: 'float64',
      offsetTypes: ['int64', 'int64']
    });
    expect(result.layout.storageKinds).toEqual([
      'large-list',
      'large-list',
      'fixed-size-list',
      'scalar'
    ]);
    expect(result.layout.childNullability.map(child => child.nullable)).toEqual([true, true, true]);
  });

  test('recognizes view storage without reading serialized values', () => {
    const wktField = new arrow.Field(
      'geometry',
      new arrow.Utf8View(),
      true,
      extensionMetadata('geoarrow.wkt')
    );
    const wkbField = new arrow.Field(
      'binary_geometry',
      new arrow.BinaryView(),
      true,
      extensionMetadata('geoarrow.wkb')
    );

    expect(inspectGeoArrowLayout(wktField)).toMatchObject({
      valid: true,
      layout: {kind: 'wkt', storage: 'utf8-view', offsetTypes: []}
    });
    expect(inspectGeoArrowLayout(wkbField)).toMatchObject({
      valid: true,
      layout: {kind: 'wkb', storage: 'binary-view', offsetTypes: []}
    });
  });

  test('reports stable diagnostics for malformed metadata and physical types', () => {
    const malformedField = new arrow.Field(
      'geometry',
      new arrow.Struct([
        new arrow.Field('longitude', new arrow.Float64(), true),
        new arrow.Field('latitude', new arrow.Int32(), true)
      ]),
      true,
      extensionMetadata('geoarrow.point')
    );

    const result = inspectGeoArrowLayout(malformedField);
    expect(result.valid).toBe(false);
    expect(result.issues.map(issue => issue.code)).toEqual([
      'wrong-child-name',
      'wrong-coordinate-precision'
    ]);
    expect(result.issues.map(issue => issue.path)).toEqual(['geometry', 'geometry.child[1]']);

    const wrongEncoding = inspectGeoArrowLayout(
      new arrow.Field('geometry', new arrow.Utf8(), true, extensionMetadata('geoarrow.wkb'))
    );
    expect(wrongEncoding.issues).toEqual([
      {
        code: 'wrong-physical-type',
        path: 'geometry',
        message: 'Encoding geoarrow.wkb is incompatible with the Arrow physical layout.'
      }
    ]);
  });

  test('describes dense-union children without requiring canonical child names', () => {
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
    const field = union.schema.fields[0];
    const unionType = field.type as arrow.DenseUnion;
    const renamedType = new arrow.DenseUnion(
      unionType.typeIds,
      unionType.children.map(
        (child, index) =>
          new arrow.Field(
            index === 0 ? 'custom point member' : 'custom line member',
            child.type,
            child.nullable
          )
      )
    );
    const renamedField = new arrow.Field(
      field.name,
      renamedType,
      field.nullable,
      extensionMetadata('geoarrow.geometry')
    );

    const result = inspectGeoArrowLayout(renamedField);

    expect(result.valid).toBe(true);
    expect(result.layout.kind).toBe('geometry-union');
    expect(result.layout.unionTypeIds).toEqual([1, 2]);
    expect(result.layout.unionChildren.map(child => child.geometryType)).toEqual([
      'Point',
      'LineString'
    ]);
    expect(result.layout.unionChildren.map(child => child.dimension)).toEqual(['xy', 'xy']);
  });

  test('rejects duplicate dense-union type IDs at schema inspection time', () => {
    const coordinate = new arrow.FixedSizeList(
      2,
      new arrow.Field('item', new arrow.Float64(), true)
    );
    const union = new arrow.DenseUnion(
      [1, 1],
      [
        new arrow.Field('Point', coordinate, true),
        new arrow.Field(
          'LineString',
          new arrow.List(new arrow.Field('value', coordinate, true)),
          true
        )
      ]
    );
    const result = inspectGeoArrowLayout(
      new arrow.Field('geometry', union, true, extensionMetadata('geoarrow.geometry'))
    );

    expect(result.valid).toBe(false);
    expect(result.issues.some(issue => issue.code === 'invalid-union')).toBe(true);
  });
});
