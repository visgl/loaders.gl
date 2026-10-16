# PMTiles authoring fixtures

- `pmtiles-authoring.geojson`: one point with a scalar name, for same-origin worker URL reads.
- `pmtiles-authoring.tif`: 4×2 uint8 EPSG:4326 raster, stored in two 2×2 uncompressed tiles.
  Values are `[1, 2, 3, 4, 5, 6, 7, 8]`; pixel scale is `[90, 85.0511287798066, 0]`
  and the upper-left tiepoint is `[-180, 85.0511287798066, 0]`.
  Generated with `createTiffFixture` from `modules/geotiff/test/lib/tiff/tiff-fixture.ts`,
  matching `createRasterFixture` in `test/pmtiles-range-export.browser.spec.ts`.
  The header is small and pixel blocks begin at byte 4096. No large raster fixture is needed.
