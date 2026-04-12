// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';

import type {GeoArrowMetadata} from '@loaders.gl/geoarrow';
import {getGeometryColumnsFromSchema} from '@loaders.gl/geoarrow';

// fix a bug that map bounds are not updated correctly from arrow samples
test('geoarrow#getGeometryColumnsFromSchema', () => {
  const testCases: {schema: string; columns: Record<string, GeoArrowMetadata>}[] = [
    {
      schema: '',
      columns: {}
    }
  ];

  for (const testCase of testCases) {
    const columns = getGeometryColumnsFromSchema(testCase.schema as any);
    expect(columns).toBeTruthy();
  }
});
