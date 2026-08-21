# Overture Parquet browser query

This example discovers the latest Overture Maps places release through STAC and queries its remote
GeoParquet assets entirely in the browser. `ParquetDatasetSource` selects files and coordinates
range-backed `ParquetSource` reads; Arrow batches render directly through `GeoArrowLayer`.

```bash
yarn
yarn start
```

The Overture STAC catalog and AWS Parquet assets must continue to allow browser CORS requests. The
example reports transport and pruning telemetry so that accidental whole-file downloads are visible.
Overture currently uses ZSTD compression. loaders.gl prefers native `DecompressionStream` support
and otherwise uses its lightweight JavaScript ZSTD fallback inside the Parquet source worker.
