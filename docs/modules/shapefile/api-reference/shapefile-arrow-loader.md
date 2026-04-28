import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';

# ShapefileArrowLoader

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
</p>

<ShapefileDocsTabs active="loader" />

`ShapefileArrowLoader` loads an Esri Shapefile into an Arrow table with DBF property columns and a WKB `geometry` column.

## Usage

```typescript
import {ShapefileArrowLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const table = await load(url, ShapefileArrowLoader);
```

## Options

| Option              | Type    | Default | Description |
| ------------------- | ------- | ------- | ----------- |
| `shp._maxDimensions` | Integer | `4` | Parse up to four dimensions (XYZM) from SHP geometry records. |
| `dbf.encoding` | String | `'latin1'` | Override DBF text encoding when no `.cpg` file is available. |
| `gis.reproject` | Boolean | `false` | Reproject coordinates using the `.prj` sidecar before WKB encoding. |
| `gis._targetCrs` | String | `'WGS84'` | Target CRS used when `gis.reproject` is enabled. |

## Output

The loader returns an `ArrowTable` with:

- DBF columns preserved as Arrow columns
- a `geometry` binary column containing WKB geometries
- Geo metadata in the table schema identifying `geometry` as the primary geometry column
- geometry types recorded in schema metadata for downstream WKB table readers

This Arrow table can be converted back to GeoJSON using GIS table helpers such as `convertWKBTableToGeoJSON`.
