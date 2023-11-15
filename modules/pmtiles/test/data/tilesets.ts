// loaders.gl, MIT license
// Copyright (c) vis.gl contributors

export const PMTILESETS = [
  'test_fixture_1.pmtiles',
  'test_fixture_2.pmtiles'
  // v3 folder?
].map((tileset) => `@loaders.gl/pmtiles/test/data/pmtiles-v2/${tileset}`);

export const PMTILESETS_INVALID = ['empty.pmtiles', 'invalid.pmtiles', 'invalid_v4.pmtiles'].map(
  (tileset) => `@loaders.gl/pmtiles/test/data/${tileset}`
);
