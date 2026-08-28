import {describe, expect, test} from 'vitest';
import {convertTileToGeoJSON} from '../../../src/lib/vector-tiler/tile-to-geojson';

describe('convertTileToGeoJSON', () => {
  test('converts point, line, and polygon variants to local GeoJSON', () => {
    const table = convertTileToGeoJSON(
      createTile([
        {simplifiedType: 1, geometry: [[1, 2]], id: 1, tags: {kind: 'point'}},
        {
          simplifiedType: 1,
          geometry: [
            [1, 2],
            [3, 4]
          ],
          id: 2
        },
        {
          simplifiedType: 2,
          geometry: [
            [
              [0, 0],
              [2, 2]
            ]
          ],
          id: 3
        },
        {simplifiedType: 2, geometry: [[[0, 0]], [[2, 2]]], id: 4},
        {
          simplifiedType: 3,
          geometry: [
            [
              [0, 0],
              [4, 0],
              [0, 0]
            ]
          ],
          id: 5
        },
        {
          simplifiedType: 3,
          geometry: [
            [
              [0, 0],
              [4, 0],
              [0, 0]
            ],
            [
              [1, 1],
              [2, 1],
              [1, 1]
            ]
          ],
          id: 6
        }
      ]),
      {coordinates: 'local', tileIndex: {x: 0, y: 0, z: 0}, extent: 4}
    );

    expect(table?.features.map(feature => feature.geometry.type)).toEqual([
      'Point',
      'MultiPoint',
      'LineString',
      'MultiLineString',
      'Polygon',
      'MultiPolygon'
    ]);
    expect(table?.features[0]).toMatchObject({id: 1, properties: {kind: 'point'}});
  });

  test('projects world coordinates and skips empty features', () => {
    const table = convertTileToGeoJSON(
      createTile([
        null,
        {simplifiedType: 1, geometry: null},
        {simplifiedType: 1, geometry: [[0, 0]], id: 7}
      ]),
      {coordinates: 'wgs84', tileIndex: {x: 0, y: 0, z: 0}, extent: 4096}
    );

    expect(table?.features).toHaveLength(1);
    expect(table?.features[0].geometry.coordinates[0]).toBe(-180);
    expect(table?.features[0].geometry.coordinates[1]).toBeCloseTo(85.0511287798066);
    expect(
      convertTileToGeoJSON(createTile([]), {
        coordinates: 'EPSG:4326',
        tileIndex: {x: 0, y: 0, z: 0},
        extent: 1
      })
    ).toBeNull();
  });

  test('rejects unsupported simplified geometry types', () => {
    expect(() =>
      convertTileToGeoJSON(createTile([{simplifiedType: 9, geometry: [[0, 0]]}]), {
        coordinates: 'local',
        tileIndex: {x: 0, y: 0, z: 0},
        extent: 1
      })
    ).toThrow('9is not a valid simplified type');
  });
});

/** Creates the minimal processed tile shape consumed by the converter. */
function createTile(protoFeatures: any[]) {
  return {protoFeatures} as any;
}
