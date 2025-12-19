# Roadmap

loaders.gl is developed under open governance by multiple contributors working with their own priorities. This page aims to give information about upcoming releases and directions.

## v4.4 (in development)

loaders.gl v4.4 will focus on cloud-native, binary data.
A number of modules will expose "ArrowLoaders" will return binary data in the Apache Arrow and Apache GeoArrow formats.

While no loader support has been removed, the flavor of the loaders.gl framework is changing.

**Apache Arrow as a core format**

- Many new loaders now return binary data in the Apache Arrow format.
- This aligns with parallel efforts in companion libraries like deck.gl (as well as the ecosystem at large) to work with zero-copy, compact binary data instead of bloated, deserialized javascript data structures.
- Binary columnar data brings in an order of magnitude better memory usage and improved load/processing performance on big datasets.
- The Apache Arrow JS library is now a central dependency of loaders.gl.

**Improved `DataSource` APIs**

- The `Source` and `DataSource` APIs have matured and are now easier to work with.
- Consult the upgrade guide for migration details.

### Per-module changes

- **`@loaders.gl/csv`**

  - `CSVArrowLoader` - New CSV loader that returns Apache Arrow tables.

- **`@loaders.gl/parquet`**

  - `ParquetArrowLoader` now returns Apache Arrow tables and leverages the high-performance `parquet-wasm` library.
  - The v4 Parquet loader is still available as `ParquetJSONLoader`

- **`@loaders.gl/schema-utils`**

  - New module for working with and converting Apache Arrow data.

- **`@loaders.gl/gis`**
  - Now provides support for working Apache GeoArrow data.

### Upgrading to v4.4

- The `Source` and `DataSource` APIs have matured leading to some minor breaking changes.
- TBA...

---

## v5.0

- **Cloud native** (raster/data): `GeoTIFFLoader`, `ZarrLoader`, kerchunk, NetCDF4, ...
- **Cloud native** (point clouds): `COPCService`, `POTreeV2Service`...
- Unbundled loaders (load non-worker loaders as separate bundle, similar to how workers are loaded today).
- More comprehensive support for `options.shape` to control the output format of loaders.
- `ffmpeg` WASM integration for `@loaders.gl/video`

**Single output format per loader**

- The `shape` option that was introduced in loaders.gl v3 to allow loaders to return different data formats is now deprecated and will be removed in many places.
- Instead, applications can use utilities in the `@loaders.gl/schema-utils` and `@loaders.gl/gis` modules to convert for Apache Arrow and Apache GeoArrow to more traditional (but less efficient) JavaScript formats.
