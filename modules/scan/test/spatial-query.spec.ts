// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {convertFeaturesToGeoArrowTable, getGeoArrowNativeGeometry} from '@loaders.gl/geoarrow';
import type {Feature} from '@loaders.gl/schema';
import {
  executeSpatialJoin,
  executeSpatialQuery,
  explainSpatialQuery,
  prepareSpatialArrowTable
} from '@loaders.gl/scan';

test('prepareSpatialArrowTable converts only geometry columns requiring coordinates', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}});
  const plan = prepareSpatialArrowTable(source, {
    spatial: {geometryColumn: 'geometry', predicate: 'bbox-intersects', bbox: [0, 0, 2, 2]}
  });

  expect(plan.nativeGeometryColumns).toEqual([]);
  expect(
    plan.table.data.schema.fields.find(field => field.name === 'geometry')?.type.toString()
  ).toBe('Binary');
});

test('spatial count works without converting WKB geometry to native coordinates', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {id: 2}, geometry: null}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );

  const result = executeSpatialQuery(source, {
    aggregates: [{as: 'geometry_count', function: 'count', geometryColumn: 'geometry'}]
  });

  expect(result.table.data.getChild('geometry_count')?.get(0)).toBe(1);
});

test('prepareSpatialArrowTable preserves non-spatial tables', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}});
  const plan = prepareSpatialArrowTable(source, {});

  expect(plan.table).toBe(source);
  expect(plan.nativeGeometryColumns).toEqual([]);
});

test('explainSpatialQuery reports conversion, pruning, residual, and projection stages', () => {
  const source = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}}],
    {geoarrow: {encoding: 'wkb'}}
  );
  const explanation = explainSpatialQuery(source, {
    spatial: {geometryColumn: 'geometry', predicate: 'intersects', bbox: [0, 0, 2, 3]},
    columns: ['id'],
    limit: 10
  });

  expect(explanation.nativeGeometryColumns).toEqual(['geometry']);
  expect(explanation.stages.map(stage => stage.kind)).toEqual([
    'source',
    'native-conversion',
    'bounds-pruning',
    'residual',
    'projection'
  ]);
});

test('executeSpatialQuery filters native GeoArrow bounds without GeoJSON conversion', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [8, 9]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}});
  const result = executeSpatialQuery(source, {
    spatial: {geometryColumn: 'geometry', predicate: 'bbox-intersects', bbox: [0, 0, 2, 3]},
    columns: ['id', 'geometry']
  });

  expect(result.matchedRows).toBe(1);
  expect(result.table.data.numRows).toBe(1);
  expect(result.table.data.getChild('id')?.get(0)).toBe(1);
  expect(result.exact).toBe(false);
});

test('executeSpatialJoin keeps WKB for bbox-only joins', () => {
  const left = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}}],
    {geoarrow: {encoding: 'wkb'}}
  );
  const right = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [1, 2]}}],
    {geoarrow: {encoding: 'wkb'}}
  );

  const result = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'bbox-intersects'
  });

  expect(result.matchedPairs).toBe(1);
  expect(result.exact).toBe(false);
  expect(
    result.table.data.schema.fields.find(field => field.name === 'left_geometry')?.type.toString()
  ).toBe('Binary');
});

test('executeSpatialQuery intersects antimeridian-crossing bboxes conservatively', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [175, 0]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [-175, 0]}},
    {type: 'Feature', properties: {id: 3}, geometry: {type: 'Point', coordinates: [0, 0]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}});
  const result = executeSpatialQuery(source, {
    spatial: {geometryColumn: 'geometry', predicate: 'bbox-intersects', bbox: [170, -5, -170, 5]},
    columns: ['id']
  });

  expect(result.matchedRows).toBe(2);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([1, 2]);
});

test('executeSpatialQuery evaluates exact point predicates after native bounds pruning', () => {
  const features: Feature[] = [
    {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
    {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [4, 4]}}
  ];
  const source = convertFeaturesToGeoArrowTable(features, {geoarrow: {encoding: 'wkb'}});
  const queryGeometry = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [0, 0],
        [2, 0],
        [2, 3],
        [0, 3],
        [0, 0]
      ]
    ]
  };
  const result = executeSpatialQuery(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'within',
      geometry: queryGeometry
    },
    columns: ['id']
  });
  expect(result.matchedRows).toBe(1);
  expect(result.exact).toBe(true);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([1]);
});

test('executeSpatialQuery evaluates intersects from concrete and dense-union native coordinates', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 1]}},
      {
        type: 'Feature',
        properties: {id: 2},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [2, 2]
          ]
        }
      },
      {type: 'Feature', properties: {id: 3}, geometry: {type: 'Point', coordinates: [8, 8]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'intersects',
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 2],
          [2, 0]
        ]
      }
    },
    columns: ['id']
  });

  const prepared = prepareSpatialArrowTable(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'intersects',
      geometry: {
        type: 'LineString',
        coordinates: [
          [0, 2],
          [2, 0]
        ]
      }
    }
  });
  const nativeVector = prepared.table.data.getChild('geometry')!;
  expect(getGeoArrowNativeGeometry(nativeVector, 0, 'geoarrow.geometry')).toMatchObject({
    type: 'Point'
  });
  expect(getGeoArrowNativeGeometry(nativeVector, 1, 'geoarrow.geometry')).toMatchObject({
    type: 'LineString',
    coordinates: [
      [0, 0],
      [2, 2]
    ]
  });

  expect(result.matchedRows).toBe(2);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([1, 2]);
  expect(result.exact).toBe(true);
});

test('executeSpatialQuery preserves disjoint rows proven by bounds', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [8, 9]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'disjoint',
      bbox: [0, 0, 2, 3]
    },
    columns: ['id']
  });

  expect(result.matchedRows).toBe(1);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([2]);
});

test('executeSpatialQuery computes native geometry aggregates', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {id: 1},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [3, 4]
          ]
        }
      },
      {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [10, 10]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    aggregates: [
      {as: 'rows', function: 'count'},
      {as: 'totalLength', function: 'length', geometryColumn: 'geometry'},
      {
        as: 'distanceFromOrigin',
        function: 'distance',
        geometryColumn: 'geometry',
        geometry: {type: 'Point', coordinates: [0, 0]}
      }
    ]
  });

  expect(result.matchedRows).toBe(2);
  expect(result.table.data.getChild('rows')?.get(0)).toBe(2);
  expect(result.table.data.getChild('totalLength')?.get(0)).toBe(5);
  expect(result.table.data.getChild('distanceFromOrigin')?.get(0)).toBe(10 * Math.sqrt(2));
});

test('executeSpatialQuery measures polygon aggregates from native rings', () => {
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
              [4, 0],
              [4, 3],
              [0, 3],
              [0, 0]
            ]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    aggregates: [
      {as: 'area', function: 'area', geometryColumn: 'geometry'},
      {as: 'perimeter', function: 'length', geometryColumn: 'geometry'}
    ]
  });

  expect(result.table.data.getChild('area')?.get(0)).toBe(12);
  expect(result.table.data.getChild('perimeter')?.get(0)).toBe(14);
});

test('executeSpatialQuery applies row filtering to geometry counts', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {id: 2}, geometry: null}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    spatial: {geometryColumn: 'geometry', predicate: 'bbox-intersects', bbox: [0, 0, 2, 3]},
    aggregates: [{as: 'geometryCount', function: 'count', geometryColumn: 'geometry'}]
  });

  expect(result.matchedRows).toBe(1);
  expect(result.table.data.getChild('geometryCount')?.get(0)).toBe(1);
});

test('executeSpatialQuery evaluates dwithin outside the original envelope', () => {
  const source = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [3, 4]}},
      {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [10, 0]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'dwithin',
      geometry: {type: 'Point', coordinates: [0, 0]},
      distance: 5
    },
    columns: ['id']
  });

  expect(result.matchedRows).toBe(1);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([1]);
  expect(result.exact).toBe(true);
});

test('executeSpatialQuery treats intersecting polygons and crossing lines as zero distance', () => {
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
              [4, 0],
              [4, 4],
              [0, 4],
              [0, 0]
            ]
          ]
        }
      },
      {
        type: 'Feature',
        properties: {id: 2},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 2],
            [4, 2]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const result = executeSpatialQuery(source, {
    spatial: {
      geometryColumn: 'geometry',
      predicate: 'dwithin',
      geometry: {type: 'Point', coordinates: [2, 2]},
      distance: 0
    },
    columns: ['id']
  });

  expect(result.matchedRows).toBe(2);
  expect(Array.from(result.table.data.getChild('id')?.toArray() || [])).toEqual([1, 2]);
});

test('executeSpatialJoin treats crossing line segments as zero distance', () => {
  const left = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {id: 1},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [4, 4]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const right = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {id: 2},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 4],
            [4, 0]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );

  const result = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'dwithin',
    distance: 0
  });

  expect(result.matchedPairs).toBe(1);
});

test('executeSpatialJoin indexes envelopes and evaluates exact residual predicates', () => {
  const left = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {id: 2}, geometry: {type: 'Point', coordinates: [8, 9]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const right = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 10}, geometry: {type: 'Point', coordinates: [1, 2]}},
      {type: 'Feature', properties: {id: 20}, geometry: {type: 'Point', coordinates: [4, 4]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );

  const result = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'intersects'
  });

  expect(result.candidatePairs).toBe(1);
  expect(result.matchedPairs).toBe(1);
  expect(result.exact).toBe(true);
  expect(result.table.data.getChild('left_id')?.get(0)).toBe(1);
  expect(result.table.data.getChild('right_id')?.get(0)).toBe(10);
});

test('executeSpatialJoin evaluates native concrete and union residuals', () => {
  const left = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [0, 2]}},
      {
        type: 'Feature',
        properties: {id: 2},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [2, 2]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );
  const right = convertFeaturesToGeoArrowTable(
    [
      {
        type: 'Feature',
        properties: {id: 10},
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 2],
            [2, 0]
          ]
        }
      }
    ],
    {geoarrow: {encoding: 'wkb'}}
  );

  const result = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'intersects'
  });

  expect(result.matchedPairs).toBe(2);
  expect(result.exact).toBe(true);
  expect(Array.from(result.table.data.getChild('left_id')?.toArray() || [])).toEqual([1, 2]);
  expect(Array.from(result.table.data.getChild('right_id')?.toArray() || [])).toEqual([10, 10]);
});

test('executeSpatialJoin supports disjoint complements and distance thresholds', () => {
  const left = convertFeaturesToGeoArrowTable(
    [{type: 'Feature', properties: {id: 1}, geometry: {type: 'Point', coordinates: [0, 0]}}],
    {geoarrow: {encoding: 'wkb'}}
  );
  const right = convertFeaturesToGeoArrowTable(
    [
      {type: 'Feature', properties: {id: 10}, geometry: {type: 'Point', coordinates: [3, 4]}},
      {type: 'Feature', properties: {id: 20}, geometry: {type: 'Point', coordinates: [10, 0]}}
    ],
    {geoarrow: {encoding: 'wkb'}}
  );

  const disjoint = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'disjoint'
  });
  expect(disjoint.candidatePairs).toBe(2);
  expect(disjoint.matchedPairs).toBe(2);

  const nearby = executeSpatialJoin(
    left,
    right,
    {
      leftGeometryColumn: 'geometry',
      rightGeometryColumn: 'geometry',
      predicate: 'intersects',
      distance: 5
    },
    {limit: 1}
  );
  expect(nearby.matchedPairs).toBe(1);
  expect(nearby.table.data.getChild('right_id')?.get(0)).toBe(10);

  const within = executeSpatialJoin(left, right, {
    leftGeometryColumn: 'geometry',
    rightGeometryColumn: 'geometry',
    predicate: 'dwithin',
    distance: 5
  });
  expect(within.matchedPairs).toBe(1);
  expect(within.table.data.getChild('right_id')?.get(0)).toBe(10);
});
