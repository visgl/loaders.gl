// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {KMLWriter, KMZWriter} from '@loaders.gl/geospatial/kml';
import {
  KMLWriter as BundledKMLWriter,
  KMZWriter as BundledKMZWriter
} from '@loaders.gl/geospatial/kml/bundled';
import {TWKBWriter, WKBWriter} from '@loaders.gl/geospatial/wkb';
import {
  TWKBWriter as BundledTWKBWriter,
  WKBWriter as BundledWKBWriter
} from '@loaders.gl/geospatial/wkb/bundled';
import {WKTCRSWriter, WKTWriter} from '@loaders.gl/geospatial/wkt';
import {
  WKTCRSWriter as BundledWKTCRSWriter,
  WKTWriter as BundledWKTWriter
} from '@loaders.gl/geospatial/wkt/bundled';

test.each([
  ['KMLWriter', KMLWriter, BundledKMLWriter],
  ['KMZWriter', KMZWriter, BundledKMZWriter],
  ['TWKBWriter', TWKBWriter, BundledTWKBWriter],
  ['WKBWriter', WKBWriter, BundledWKBWriter],
  ['WKTCRSWriter', WKTCRSWriter, BundledWKTCRSWriter],
  ['WKTWriter', WKTWriter, BundledWKTWriter]
] as const)('%s loads its bundled encoder on demand', async (_, writer, bundledWriter) => {
  expect(writer).not.toHaveProperty('encode');
  expect(bundledWriter.encode).toBeTypeOf('function');
  expect(await writer.preload()).toBe(bundledWriter);
});
