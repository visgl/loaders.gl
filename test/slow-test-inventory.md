# Slow-test migration inventory

This inventory records behavior moved out of the fast Chromium lane. Moving a test to the slow
lane must preserve its assertions; the fast replacement must retain representative public behavior.

| Slow suite | Assertions retained | Exercised entry points | Coverage retained in fast tests |
| --- | --- | --- | --- |
| `modules/excel/test/excel-loader.slow.spec.ts` | 42,049-row CSV/XLSB/XLSX equivalence, object and Arrow batches, export compatibility | `load`, `loadInBatches`, `ExcelLoader`, `CSVLoader` | Small deterministic CSV/XLSB/XLSX equivalence, Arrow conversion, options, and exports |
| `modules/gltf/test/lib/api/gltf-scenegraph-accessors.slow.spec.ts` | Full DamagedHelmet accessor counts and values | `load`, `GLTFLoader`, `GLTFScenegraph` accessor APIs | Compact Draco, meshopt, and KTX2 scenegraph cases |
| `modules/las/test/las-loader.node.slow.spec.ts` | Full backend, batching, error, point-format, and 808,042-point fixture corpus | `parse`, `parseInBatches`, `LASLoader`, backend decoder APIs | 1,024-point LAS/LAZ parity, streaming batches, Arrow output, and loader conformance |
| `modules/parquet/test/parquet-compatibility.slow.spec.ts` | Apache fixture matrix and hyparquet differential results | `load`, `ParquetLoader`, TypeScript/WASM backends | Focused loader, schema, codec, and backend tests in the owning package |
| `modules/shapefile/test/shapefile-loader.slow.spec.ts` | Full geometry/encoding/File/URL/reprojection/metadata matrix | `load`, `loadInBatches`, `ShapefileLoader`, `DBFLoader` options | Small geometry, DBF, selection, and streaming fixtures |
| `modules/tiles/test/tileset/tileset-3d-traversal.slow.spec.ts` | Asynchronous one/two-viewport traversal, remapping, callback, and load suppression | `load`, `Tiles3DLoader`, `Tileset3D.update`, `viewportTraversersMap` | Deterministic traversal, selection, loading, and transition tests in `tileset-3d.spec.ts` |
| `modules/wkt/test/wkt-loader.slow.spec.ts` | Deterministic 10,000-mutation fuzz corpus | `parseSync`, `WKTLoader` | The same seeded corpus at 500 mutations plus format examples and errors |
