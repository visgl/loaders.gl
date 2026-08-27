// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import legacyTest from 'test/utils/vitest-tape';
import {expect, test} from 'vitest';

import type {GeoArrowMetadata} from '@loaders.gl/geoarrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/geoarrow';

// fix a bug that map bounds are not updated correctly from arrow samples
legacyTest('geoarrow#getGeometryColumnsFromSchema', t => {
  const testCases: {schema: string; columns: Record<string, GeoArrowMetadata>}[] = [
    {
      schema: '',
      columns: {}
    }
  ];

  for (const testCase of testCases) {
    const columns = getGeometryColumnsFromSchema(testCase.schema as any);
    t.ok(columns);
  }

  t.end();
});

legacyTest(
  'geoarrow#getGeometryColumnsFromSchema preserves encoding when extension metadata is empty',
  t => {
    const columns = getGeometryColumnsFromSchema({
      fields: [
        {
          name: 'geometry',
          type: 'binary',
          metadata: {
            'ARROW:extension:name': 'geoarrow.wkb',
            'ARROW:extension:metadata': '{}'
          }
        }
      ]
    } as any);

    t.deepEqual(columns, {geometry: {encoding: 'geoarrow.wkb'}});
    t.end();
  }
);

test('geoarrow#getGeometryColumnsFromSchema preserves a mislabeled string CRS as opaque', () => {
  const wkt = 'GEOGCRS["WGS 84",ID["EPSG",4326]]';
  const schema = {
    fields: [
      {
        name: 'geometry',
        type: 'binary',
        metadata: {
          'ARROW:extension:name': 'geoarrow.wkb',
          'ARROW:extension:metadata': JSON.stringify({crs: wkt, crs_type: 'projjson'})
        }
      }
    ]
  } as any;

  expect(getGeometryColumnsFromSchema(schema)).toEqual({
    geometry: {encoding: 'geoarrow.wkb', crs: wkt}
  });
  expect(JSON.parse(schema.fields[0].metadata['ARROW:extension:metadata']).crs_type).toBe(
    'projjson'
  );
});
