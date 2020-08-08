// loaders.gl, MIT license
// Forked from https://github.com/uber-web/type-analyzer under MIT license
// Copyright (c) 2017 Uber Technologies, Inc.

import test from 'tape-promise/tape';
import {computeColumnMetadata} from '@loaders.gl/type-analyzer';

import {LINE_STRING_GEO} from './data/fixtures/example-data';
import Example from './data/fixtures/example.json';
import LargeData from './data/fixtures//sample-time-series-data-1.json';
import coordData from './data/fixtures/coord-data.json';

test('computeColumnMetadata: Geo check', (t) => {
  const arr: unknown[] = LINE_STRING_GEO;
  const arrMeta = computeColumnMetadata(arr);
  const expectedForArr = [
    {
      key: 'wkt',
      label: 'wkt',
      type: 'GEOMETRY_FROM_STRING',
      category: 'GEOMETRY',
      format: '',
      geoType: 'LINESTRING'
    },
    {
      key: 'feature',
      label: 'feature',
      type: 'PAIR_GEOMETRY_FROM_STRING',
      category: 'GEOMETRY',
      format: '',
      geoType: 'POINT'
    },
    {
      key: 'geojson',
      label: 'geojson',
      type: 'PAIR_GEOMETRY_FROM_STRING',
      category: 'GEOMETRY',
      format: '',
      geoType: 'POINT'
    },
    {
      key: 'treatment_group_key',
      label: 'treatment_group_key',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    },
    {
      key: 'marketplace',
      label: 'marketplace',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    }
  ];

  t.deepEqual(arrMeta, expectedForArr, 'should get geometry from string correct');

  const geoJsonArr = [
    {col1: {type: 'Point', coordinates: [102.0, 0.5]}},
    {
      col1: {
        type: 'LineString',
        coordinates: [
          [102.0, 0.0],
          [103.0, 1.0],
          [104.0, 0.0],
          [105.0, 1.0]
        ]
      }
    },
    {
      col1: {
        type: 'Polygon',
        coordinates: [
          [
            [100.0, 0.0],
            [101.0, 0.0],
            [101.0, 1.0],
            [100.0, 1.0],
            [100.0, 0.0]
          ]
        ]
      }
    }
  ];

  const expectedGeoMeta = [
    {
      key: 'col1',
      label: 'col1',
      type: 'GEOMETRY',
      category: 'GEOMETRY',
      format: '',
      geoType: 'POINT'
    }
  ];

  const geoMeta = computeColumnMetadata(geoJsonArr);
  t.deepEqual(expectedGeoMeta, geoMeta, 'should get geometry from geojson correct');
  t.end();
});

test('computeColumnMetadata: geo from string validator', (t) => {
  let arr: unknown[] = [];
  const mapArr = function mapArr(d) {
    return {col: d};
  };

  [
    'POINT (-74.0771771596 40.8093839419)',
    'LINESTRING (-81.5676390228 28.3827075019, -81.551517 28.377852)',
    'POLYGON ((30 10, 40 40, 20 40, 10 20, 30 10))',
    'MULTIPOINT ((10 40), (40 30), (20 20), (30 10))',
    'MULTILINESTRING ((10 10, 20 20, 10 40),(40 40, 30 30, 40 20, 30 10))',
    'MULTIPOLYGON (((30 20, 45 40, 10 40, 30 20)), ((15 5, 40 10, 10 20, 5 10, 15 5)))'
  ].forEach(function mapAcrossAllTypes(exampleData) {
    arr = [exampleData, exampleData, exampleData].map(mapArr);
    t.equal(
      computeColumnMetadata(arr)[0].type,
      'GEOMETRY_FROM_STRING',
      'Interprets WKT formatted geo as geo'
    );
    const expectedType = exampleData.split(' ')[0];
    t.equal(
      computeColumnMetadata(arr)[0].geoType,
      expectedType,
      `correctly indentifies ${expectedType} as WKT ${expectedType}s`
    );
  });

  arr = ['-45.03, 168.66', '[-45.03,168.66]', '[-45.0304885022762, 168.660729378619]'].map(mapArr);
  t.equal(
    computeColumnMetadata(arr)[0].type,
    'PAIR_GEOMETRY_FROM_STRING',
    'correctly finds geometry from string for pair wise points'
  );
  t.equal(
    computeColumnMetadata(arr)[0].geoType,
    'POINT',
    'correctly correctly indetifies those strings as pairs'
  );

  t.end();
});

test('computeColumnMetadata: integration test', (t) => {
  const known = [
    {
      key: 'city_id',
      label: 'city_id',
      type: 'INT',
      category: 'MEASURE',
      format: ''
    },
    {
      key: 'ST_AsText',
      label: 'ST_AsText',
      type: 'GEOMETRY_FROM_STRING',
      category: 'GEOMETRY',
      format: '',
      geoType: 'MULTIPOLYGON'
    },
    {
      key: 'slug',
      label: 'slug',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    },
    {key: 'lat', label: 'lat', type: 'FLOAT', category: 'MEASURE', format: ''},
    {key: 'lng', label: 'lng', type: 'FLOAT', category: 'MEASURE', format: ''},
    {
      key: 'country_name',
      label: 'country_name',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    },
    {
      key: 'launch_date',
      label: 'launch_date',
      type: 'DATE',
      category: 'TIME',
      format: 'YYYY-M-D'
    },
    {
      key: 'region',
      label: 'region',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    }
  ];

  const analyzed = computeColumnMetadata(Example);
  t.deepEqual(
    analyzed,
    known,
    'Example data generates from dim cities should generate good columns'
  );
  t.end();
});

test('computeColumnMetadata: nulls', (t) => {
  const nullExample = [
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: 1.2, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null},
    {a: '2016-11-04 12:43:36.711458', b: null, c: null, d: null}
  ];

  const known = [
    {
      category: 'TIME',
      format: 'YYYY-M-D HH:mm:ss.SSSS',
      key: 'a',
      label: 'a',
      type: 'DATETIME'
    },
    {category: 'MEASURE', format: '', key: 'b', label: 'b', type: 'FLOAT'}
  ];
  const rules = [
    {regex: /c/, dataType: 'DATETIME'},
    {regex: /d/, dataType: 'GEOMETRY_FROM_STRING'}
  ];
  const analyzed = computeColumnMetadata(nullExample, rules);
  t.deepEqual(analyzed, known, 'computeColumnMetadata handles null data well');

  const newCoordData: unknown[] = [];
  for (let i = 0; i < 100; i++) {
    newCoordData.push({coordinates: ''});
  }
  t.deepEqual(
    computeColumnMetadata(newCoordData),
    [
      {
        category: 'DIMENSION',
        format: '',
        key: 'coordinates',
        label: 'coordinates',
        type: 'STRING'
      }
    ],
    'Handles conditional nulls well'
  );
  t.end();
});

test('computeColumnMetadata: long test', (t) => {
  const analyzed = computeColumnMetadata(LargeData);

  const knownAnalysis = [
    {
      key: 'ts',
      label: 'ts',
      type: 'DATETIME',
      category: 'TIME',
      format: 'YYYY-M-D H:m:s'
    },
    {
      key: 'city',
      label: 'city',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    },
    {
      key: 'country',
      label: 'country',
      type: 'STRING',
      category: 'DIMENSION',
      format: ''
    },
    {
      key: 'metrics1',
      label: 'metrics1',
      type: 'INT',
      category: 'MEASURE',
      format: ''
    },
    {
      key: 'metrics2',
      label: 'metrics2',
      type: 'FLOAT',
      category: 'MEASURE',
      format: ''
    },
    {
      key: 'metrics3',
      label: 'metrics3',
      type: 'FLOAT',
      category: 'MEASURE',
      format: ''
    },
    {
      key: 'metrics4',
      label: 'metrics4',
      type: 'PERCENT',
      category: 'MEASURE',
      format: ''
    }
  ];
  t.deepEqual(analyzed, knownAnalysis, 'computeColumnMetadata handles null data well');
  t.end();
});

test('computeColumnMetadata: coords', (t) => {
  const analyzed = computeColumnMetadata(coordData);
  const expected = [
    {
      category: 'GEOMETRY',
      format: '',
      geoType: 'POINT',
      key: 'coordinates',
      label: 'coordinates',
      type: 'PAIR_GEOMETRY_FROM_STRING'
    }
  ];
  t.deepEqual(expected, analyzed, 'Handle data formatted as pairs of coordinates correctly');
  t.end();
});
