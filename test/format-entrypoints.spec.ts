// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect, test} from 'vitest';
import {GeoJSONLoader} from '@loaders.gl/tables/geojson';
import {GeoArrowLoader} from '@loaders.gl/tables/geoarrow';
import {JSONLoader} from '@loaders.gl/documents/json';
import {GPXLoader} from '@loaders.gl/geospatial/gpx';
import {TCXLoader} from '@loaders.gl/geospatial/tcx';
import {NetCDFSource} from '@loaders.gl/scientific/netcdf-source';

test.each([
  GeoJSONLoader,
  GeoArrowLoader,
  JSONLoader,
  GPXLoader,
  TCXLoader
])('$id format entrypoint exposes metadata and preloads its parser', async loader => {
  expect(loader).not.toHaveProperty('parse');
  const parserLoader = await loader.preload();
  expect(parserLoader.id).toBe(loader.id);
  expect(parserLoader).toHaveProperty('parse');
});

test('NetCDF source entrypoint exports the source class', () => {
  expect(NetCDFSource.name).toBe('NetCDFSource');
});
