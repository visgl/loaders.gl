# Roadmap

loaders.gl is developed under open governance by multiple contributors working with their own priorities. This page aims to give information about upcoming releases and directions.

## v5.0

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
  - `CSVLoader` - Supports Apache Arrow table output through `csv.shape: 'arrow-table'`.

- **`@loaders.gl/parquet`**
  - `ParquetLoader` can return Apache Arrow tables with `parquet.shape: 'arrow-table'` and leverages the high-performance `parquet-wasm` library.
  - The v4 Parquet loader is still available as `ParquetJSONLoader`

- **`@loaders.gl/schema-utils`**
  - New module for working with and converting Apache Arrow data.

- **`@loaders.gl/gis`**
  - Now provides support for working Apache GeoArrow data.


- **Cloud native** (raster/data): `GeoTIFFLoader`, `ZarrLoader`, kerchunk, NetCDF4, ...
- **Cloud native** (point clouds): `COPCService`, `POTreeV2Service`...
- Unbundled loaders (load non-worker loaders as separate bundle, similar to how workers are loaded today).
- More comprehensive support for `options.shape` to control the output format of loaders.

**Single output format per loader**

- The `shape` option that was introduced in loaders.gl v3 to allow loaders to return different data formats is now deprecated and will be removed in many places.
- Instead, applications can use utilities in the `@loaders.gl/schema-utils` and `@loaders.gl/gis` modules to convert for Apache Arrow and Apache GeoArrow to more traditional (but less efficient) JavaScript formats.

## Geospatial service roadmap

The service roadmap favors protocol depth and useful normalized outputs over a large universal
abstraction. Costs are relative engineering estimates; impact describes the user-facing result.

| Tranche | Scope | Status | Cost | Impact |
| --- | --- | --- | --- | --- |
| 1 | Dedicated `@loaders.gl/services` module and ArcGIS source ownership | Complete | M | Clear package boundary for ArcGIS, Cesium ION, and future providers |
| 2 | ArcGIS FeatureServer vector source and normalized Arrow/GeoJSON output | Complete | M | Production vector-service ingestion |
| 3 | ArcGIS ImageServer imagery and analytical LERC output | Complete | M | Analysis-ready raster services |
| 4 | ArcGIS MapServer and VectorTileServer tile sources | Complete | M | Cached, dynamic, and vector tile access |
| 5 | WFS request normalization and GeoJSON/GML response handling | Complete | M | Reliable OGC feature-service access |
| 6 | High-volume SAX GML parsing and streaming WFS batches | Complete | L | Large WFS responses without whole-document buffering |
| 7 | WMTS matrix sets and ArcGIS tile-grid negotiation | Planned | L | Correct tile requests across heterogeneous grids |
| 8 | CRS normalization, axis order, reprojection-aware requests, and edge cases | Planned | XL | Correct behavior across projections, antimeridian, and polar regions |
| 9 | Shared service lifecycle for retries, cancellation, caching, auth, and telemetry | Planned | XL | Consistent operational behavior without protocol-specific duplication |
| 10 | Deep GML/WFS conformance, paging, filtering, schema-aware properties, and fixtures | Complete | XL | Production-scale standards interoperability |
| 11 | Capability-driven source configuration and endpoint negotiation | Planned | L | Better defaults when applications provide incomplete service information |
| 12 | Analytical raster preservation: NoData, bands, statistics, and rendering rules | Complete | L | Faithful scientific imagery workflows |
| 13 | ArcGIS capability graph and requirement-based service selection | Assumed complete | M | Discover, compare, and select service endpoints explicitly |

The next high-leverage work is tranches 7–11. Tranche 9 remains deliberately deferred until the
protocol-specific sources demonstrate a concrete shared lifecycle need; it should not become a
second opaque framework layered over `DataSource`.
