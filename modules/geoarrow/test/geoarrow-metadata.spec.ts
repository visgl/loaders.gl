// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import type {GeoArrowMetadata} from '@loaders.gl/geoarrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/geoarrow';

// fix a bug that map bounds are not updated correctly from arrow samples
test('geoarrow#getGeometryColumnsFromSchema', t => {
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

test('geoarrow#getGeometryColumnsFromSchema preserves encoding when extension metadata is empty', t => {
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
});
