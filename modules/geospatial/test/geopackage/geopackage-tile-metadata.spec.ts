// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors
import {expect, test} from 'vitest';
import {GeoPackageDataSource} from '@loaders.gl/geospatial/geopackage/index';
import {GeoPackageDataSource as CanonicalGeoPackageDataSource} from '@loaders.gl/geospatial/geopackage/index';

test('GeoPackage compatibility entrypoint exposes the canonical tile reader', () => {
  expect(GeoPackageDataSource).toBe(CanonicalGeoPackageDataSource);
  expect(GeoPackageDataSource.prototype.getTile).toBeTypeOf('function');
});
