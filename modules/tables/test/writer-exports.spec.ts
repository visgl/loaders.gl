// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {ArrowWriter} from '@loaders.gl/tables/arrow';
import {ArrowWriter as BundledArrowWriter} from '@loaders.gl/tables/arrow/bundled';
import {GeoArrowWriter} from '@loaders.gl/tables/geoarrow';
import {GeoArrowWriter as BundledGeoArrowWriter} from '@loaders.gl/tables/geoarrow/bundled';
import {AvroWriter} from '@loaders.gl/tables/avro';
import {AvroWriter as BundledAvroWriter} from '@loaders.gl/tables/avro/bundled';
import {GeoJSONWriter, JSONWriter} from '@loaders.gl/tables/json';
import {
  GeoJSONWriter as BundledGeoJSONWriter,
  JSONWriter as BundledJSONWriter
} from '@loaders.gl/tables/json/bundled';
import {ORCWriter} from '@loaders.gl/tables/orc';
import {ORCWriter as BundledORCWriter} from '@loaders.gl/tables/orc/bundled';

test.each([
  ['ArrowWriter', ArrowWriter, BundledArrowWriter],
  ['GeoArrowWriter', GeoArrowWriter, BundledGeoArrowWriter],
  ['AvroWriter', AvroWriter, BundledAvroWriter],
  ['GeoJSONWriter', GeoJSONWriter, BundledGeoJSONWriter],
  ['JSONWriter', JSONWriter, BundledJSONWriter],
  ['ORCWriter', ORCWriter, BundledORCWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
