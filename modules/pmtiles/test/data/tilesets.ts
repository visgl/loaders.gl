// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

export const PMTILESETS = [
  'test_fixture_1.pmtiles',
  'test_fixture_2.pmtiles'
  // v3 folder?
].map((tileset) => `@loaders.gl/pmtiles/test/data/pmtiles-v2/${tileset}`);

export const PMTILESETS_INVALID = ['empty.pmtiles', 'invalid.pmtiles', 'invalid_v4.pmtiles'].map(
  (tileset) => `@loaders.gl/pmtiles/test/data/${tileset}`
);

export const PMTILESETS_V3 = [
  'protomaps(vector)ODbL_firenze.pmtiles',
  'stamen_toner(raster)CC-BY+ODbL_z3.pmtiles',
  'usgs-mt-whitney-8-15-webp-512.pmtiles'
].map((tileset) => `@loaders.gl/pmtiles/test/data/pmtiles-v3/${tileset}`);

export const PMTILESETS_VECTOR = ['protomaps(vector)ODbL_firenze.pmtiles'].map(
  (tileset) => `@loaders.gl/pmtiles/test/data/pmtiles-v3/${tileset}`
);
