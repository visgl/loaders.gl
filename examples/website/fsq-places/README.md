# FSQ Places browser query

This example queries the Apache-2.0 FSQ Open Source Places dataset entirely in the browser. It uses
the spatially partitioned GeoParquet snapshot published by Fused on Source Cooperative. Standard
aggregate Parquet metadata discovers 81 files and their extents; `ParquetDatasetSource` then prunes
files and row groups, requests only selected column ranges, and renders Arrow batches directly.

```bash
yarn
yarn start
```

The public Source Cooperative objects must continue to support browser CORS and byte ranges. The
mirror is the FSQ 2024-11-19 snapshot and is not the current authenticated Foursquare delivery.
