# MLTWriter

From v5.0. `MLTWriter` encodes an Apache Arrow `Table` or loaders.gl `ArrowTable` into one MapLibre Tile v1 layer. It runs in browsers and Node.js, reads attribute columns directly, and uses portable VarInt streams and componentwise delta vertices. It does not require a native encoder.

```
import {encode} from '@loaders.gl/core';

import {MLTWriter} from '@loaders.gl/tiles/mlt';



const bytes = await encode(tileLocalArrowTable, MLTWriter, {

  mlt: {layerName: 'features', extent: 4096, idColumn: 'id'}

});
```

For geographic source tables, use [GeoArrow to PMTiles](https://loaders.gl/next/docs/modules/tiles/pmtiles/api-reference/geoarrow-pmtiles.md) with `tileType: 'mlt'`. That path reuses `ArrowTableVectorTileSource` for indexing, clipping and simplification. The writer itself does not project or tile geographic input.

## Options[​](#options "Direct link to Options")

| Option                | Default              | Description                                                           |
| --------------------- | -------------------- | --------------------------------------------------------------------- |
| `mlt.layerName`       | `'features'`         | Nonempty output layer name                                            |
| `mlt.geometryColumn`  | GeoArrow metadata    | One WKB geometry column                                               |
| `mlt.propertyColumns` | Non-geometry columns | Selected scalar attributes                                            |
| `mlt.idColumn`        | None                 | Optional nonnegative safe integer IDs; null IDs remain absent         |
| `mlt.extent`          | `4096`               | Integer extent from 1 through 65536                                   |
| `mlt.coordinates`     | `'local'`            | Normalized local coordinates, or `'tile'` for extent-unit coordinates |
| `mlt.maxFeatures`     | `100000`             | Maximum input rows, checked before encoding                           |

## Support[​](#support "Direct link to Support")

| Feature                                   | Write                     | Notes                                                                                |
| ----------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------ |
| Point, line, polygon and multi geometries | ✅                        | Finite XY; polygon and hole ownership retained in topology streams                   |
| Null or collapsed geometries              | Omitted                   | An empty tile returns zero bytes                                                     |
| UTF-8, boolean, numeric attributes        | ✅                        | Nullable and dictionary-encoded Arrow columns supported                              |
| Integer precision                         | Safe integers             | Numeric attributes use Float64; unsafe integers and nonfinite values fail            |
| Feature IDs                               | Safe nonnegative integers | Uses Id or LongId as needed, nullable when selected IDs contain null; never invented |
| Nested, temporal and binary attributes    | ✕                         | Explicitly project supported columns or preprocess                                   |
| Geographic/projected CRS metadata         | ✕                         | Use the existing tiler before this writer                                            |
| FSST, FastPFOR, tessellation              | ✕                         | Plain portable encoding profile; no size-optimal compression claim                   |

Polygon rings are encoded without their closing coordinate, as required by MLT v1. Quantization removes consecutive duplicates and collapsed paths. Negative and out-of-extent clipping-buffer coordinates are supported. The MapLibre JavaScript decoder's convenience geometry accessor flattens multipolygon rings; the encoded topology retains their polygon ownership.

The table and encoded bytes are materialized in memory. The row limit does not bound vertices or peak heap. Use the PMTiles authoring helper for archive budgets and cancellation checkpoints.
