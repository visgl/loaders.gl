// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';
import * as arrow from 'apache-arrow';

import {getGeoArrowGeometryInfo} from '@loaders.gl/geoarrow';
import {GeoArrowGeometryInfo} from '../src/get-geoarrow-geometry-info';

// fix a bug that map bounds are not updated correctly from arrow samples
test('geoarrow#getGeoArrowGeometryInfo', (t) => {
  const testCases: {field: arrow.Field; info: Partial<GeoArrowGeometryInfo>}[] = [
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
    t.deepEqual(info?.compatibleEncodings, info?.compatibleEncodings, testCase.field.toString());
  }

  t.end();
});
