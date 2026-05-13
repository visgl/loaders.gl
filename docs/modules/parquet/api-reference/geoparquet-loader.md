import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';

# GeoParquetLoader

<ParquetDocsTabs active="geoparquetloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />
  &nbsp;
  <img src="https://img.shields.io/badge/Status-Experimental-orange.svg?style=flat-square" alt="Status: Experimental" />
</p>

`GeoParquetLoader` loads GeoParquet files into loaders.gl geospatial tables by default, or Arrow tables when `parquet.shape: 'arrow-table'` is selected.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GeoParquetLoader} from '@loaders.gl/parquet';

const table = await load(url, GeoParquetLoader, {parquet: options});
const arrowTable = await load(url, GeoParquetLoader, {
  parquet: {shape: 'arrow-table'}
});
```

## Shapes

| Shape              | Output                                          |
| ------------------ | ----------------------------------------------- |
| `object-row-table` | loaders.gl GeoJSON table                        |
| `arrow-table`      | loaders.gl `ArrowTable` with geospatial metadata |

## Geospatial Metadata

When loading Arrow output, `GeoParquetLoader` preserves GeoParquet schema metadata and annotates compatible geometry fields with GeoArrow field metadata. Geometry column buffers are passed through unchanged.

For GeoJSON output, geometry columns are converted to GeoJSON geometries where supported.

## Options

`GeoParquetLoader` supports the same options as [`ParquetLoader`](/docs/modules/parquet/api-reference/parquet-loader).
