// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import test from 'tape-promise/tape';

import {load} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {getGeoArrowGeometryTypeInfo, getGeometryColumnsFromSchema} from '@loaders.gl/gis';

import {
  GEOARROW_POINT_FILE,
  GEOARROW_MULTIPOINT_FILE,
  GEOARROW_LINE_FILE,
  GEOARROW_MULTILINE_FILE,
  GEOARROW_POLYGON_FILE,
  GEOARROW_MULTIPOLYGON_FILE,
  GEOARROW_MULTIPOLYGON_HOLE_FILE,
  GEOARROW_LINE_WKB_FILE,
  GEOARROW_LINE_WKT_FILE
} from '@loaders.gl/arrow/test/data/geoarrow/test-cases';

const testCases = [
  {url: GEOARROW_POINT_FILE},
  {url: GEOARROW_MULTIPOINT_FILE},
  {url: GEOARROW_LINE_FILE},
  {url: GEOARROW_MULTILINE_FILE},
  {url: GEOARROW_POLYGON_FILE},
  {url: GEOARROW_MULTIPOLYGON_FILE},
  {url: GEOARROW_MULTIPOLYGON_HOLE_FILE},
  {url: GEOARROW_LINE_WKB_FILE},
  {url: GEOARROW_LINE_WKT_FILE}
];

test('schema-utils#getGeoArrowGeometryInfo', async (t) => {
  for (const testCase of testCases) {
    const arrowTable = await load(testCase.url, ArrowLoader, {
      worker: false,
      arrow: {
        shape: 'arrow-table'
      }
    });

    const geometryColumns = getGeometryColumnsFromSchema(arrowTable.schema!);
    for (const [columnName, metadata] of Object.entries(geometryColumns)) {
      const geometryField = arrowTable.data.schema.fields.find(
        (field) => field.name === columnName
      );
      const info = getGeoArrowGeometryTypeInfo(geometryField!);
      t.ok(
        info?.compatibleEncodings.includes(metadata.encoding!),
        `Encoding is compatible for ${testCase.url}'s "${columnName}"   column`
      );
    }
  }
  t.end();
});
