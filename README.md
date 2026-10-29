# loaders.gl

Framework-independent loaders and writers for visualization, 3D, geospatial, tabular, and scientific data.

Formats, encodings, and protocols by module (see each README for runtime and implementation limits):

| Module | Formats, encodings, and protocols |
| --- | --- |
| [`@loaders.gl/arcgis`](modules/arcgis/README.md) | ArcGIS, FeatureServer, MapServer, ImageServer, VectorTileServer, SceneServer, PBF, JSON, GeoJSON. |
| [`@loaders.gl/archives`](modules/archives/README.md) | ZIP, TAR. |
| [`@loaders.gl/compression`](modules/compression/README.md) | DEFLATE, zlib, GZIP, Brotli, Snappy, LZ4, LZO, BZip2, XZ, LZMA, Zstandard, Zstd. |
| [`@loaders.gl/config`](modules/config/README.md) | YAML, TOML. |
| [`@loaders.gl/core`](modules/core/README.md) | Arrow, GeoArrow, GeoJSON, WKT, WKB. |
| [`@loaders.gl/crypto`](modules/crypto/README.md) | CRC32, CRC32C, MD5, SHA-256. |
| [`@loaders.gl/draco`](modules/draco/README.md) | Draco. |
| [`@loaders.gl/geospatial`](modules/geospatial/README.md) | KML, KMZ, GPX, TCX, Shapefile, SHP, SHX, DBF, CPG, PRJ, FlatGeobuf, GeoPackage, WKT, WKT CRS, WKB, TWKB. |
| [`@loaders.gl/graphs`](modules/graphs/README.md) | DOT, GraphML, GEXF. |
| [`@loaders.gl/images`](modules/images/README.md) | PNG, JPEG, JPG, GIF, WebP, BMP, ICO, SVG, AVIF. Availability depends on the runtime and installed codecs. |
| [`@loaders.gl/ogc`](modules/ogc/README.md) | WMS, WFS, WMTS, WCS, CSW, GML, OGC API, STAC, STAC API, XML, JSON, GeoJSON. |
| [`@loaders.gl/pointclouds`](modules/pointclouds/README.md) | LAS, LAZ, PCD, PLY. |
| [`@loaders.gl/raster`](modules/raster/README.md) | GeoTIFF, TIFF, COG, OME-TIFF, LERC, LERC1, LERC2, quantized mesh, Mapbox Terrain-RGB, Terrarium, PNG, JPEG, GIF, WebP, BMP. |
| [`@loaders.gl/scene`](modules/scene/README.md) | glTF, GLB, OBJ, MTL, OpenUSD, USD, USDA, USDZ. OpenUSD support covers ASCII USDA and uncompressed USDZ archives with an ASCII root layer. |
| [`@loaders.gl/scientific`](modules/scientific/README.md) | NetCDF, NetCDF-4, Zarr, GeoZarr, OME-Zarr, SpatialData, GRIB2, HDF5, VTK, VTI, VTR, VTS, VTU, VTP. GRIB2, HDF5, NetCDF-4, and VTK readers have the implementation limits documented below. |
| [`@loaders.gl/splats`](modules/splats/README.md) | SPLAT, KSPLAT, SPZ, RAD. |
| [`@loaders.gl/sql`](modules/sql/README.md) | SQL, Arrow. |
| [`@loaders.gl/tables`](modules/tables/README.md) | Arrow, Feather, GeoArrow, Avro, AVSC, BSON, CSV, TSV, DSV, Excel, XLS, XLSB, XLSM, XLSX, JSON, GeoJSON, NDJSON, JSONL, NDGeoJSON, GeoJSONL, LDGeoJSON, Lance, ORC, Parquet, GeoParquet, Delta Lake. |
| [`@loaders.gl/textures`](modules/textures/README.md) | KTX, KTX2, DDS, PVR, Basis Universal, Basis, Crunch, CRN, Radiance HDR, HDR, NPY. |
| [`@loaders.gl/tiles`](modules/tiles/README.md) | MLT, MapLibre Tile, MVT, Mapbox Vector Tile, TileJSON, Mapbox Style, PMTiles. |
| [`@loaders.gl/tiles-3d`](modules/tiles-3d/README.md) | 3D Tiles, B3DM, I3DM, PNTS, CMPT, subtree, 3TZ, I3S, SLPK, LEPCC, ArcGIS Web Scene, COPC, LAS, LAZ, Potree. |
| [`@loaders.gl/traces`](modules/traces/README.md) | Chrome Trace, Perfetto Trace, OpenTelemetry, OTLP, OTLP JSON, OTLP Protobuf, Jaeger, Zipkin, JSON, JSON Lines, NDJSON. |
| [`@loaders.gl/video`](modules/video/README.md) | MP4, GIF. Availability depends on the runtime and installed codecs. |
| [`@loaders.gl/xml`](modules/xml/README.md) | XML, HTML. |

<p align="center">
  <img src="https://badge.fury.io/js/%40loaders.gl%2Fcore.svg" />
  <img src="https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
  <img src="https://img.shields.io/npm/dm/@loaders.gl/core.svg" />
  <br />
</p>

[loaders.gl](https://loaders.gl) is a collection of framework-independent loaders for geospatial, 3D, and large-data visualization, part of [vis.gl](https://vis.gl).

## Documentation

loaders.gl is extensively documented on the [loaders.gl](https://loaders.gl) website.

## References and credits

See [References and credits](https://loaders.gl/docs/references-and-credits) for the
people, upstream implementations, specifications and datasets behind loaders.gl.
Each published package includes a source and license notice inventory.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Build and test workflows

- Run `yarn install` to install workspace dependencies.
- Run `yarn build` to build the modules, then `yarn build-workers` to generate worker bundles. Rebuild workers after each module build.
- Run `yarn test-node` for Node.js tests and `yarn test-headless` for Chromium tests, or `yarn test` for both.
- Run `yarn lint fix` to apply lint and formatting fixes.
- Run `yarn test-website` to install website dependencies and build the documentation site.

- Run `yarn build-apps` to run the tile-converter app build (currently the only app in this repository).
- Run `yarn test-apps` to exercise the tile-converter app test/build script when available.

See the [development environment guide](docs/developer-guide/dev-env.md) for runtime requirements and browser setup.

## License

loaders.gl uses the MIT license.

Some individual loaders are forked from other open source code bases that are licensed under different but compatible permissive licenses such as Apache 2 or BSD.

Data, imagery and service content have their own terms, separate from the code license.

You can check the "Attributions" section for each loader module before you install it if the details matter to you.
