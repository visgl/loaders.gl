---
title: ShapefileLoader
description: Load Shapefile geometry, attributes, indexes, and CRS metadata into geospatial tables.
hide_title: true
page_style: designed
---

import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Shapefile module · loader API"
  title="ShapefileLoader"
  description="Load a Shapefile dataset as one geospatial table, coordinating its geometry, attributes, index, projection, and optional text-encoding sidecars."
  tone="orange"
  meta={['From v2.3', 'SHP + sidecars', 'GeoJSON / Arrow tables']}
  links={[
    {label: 'Shapefile format', to: '/docs/modules/shapefile/formats/shapefile'},
    {label: 'SHP sub-loader', to: '/docs/modules/shapefile/api-reference/shp-loader'},
    {label: 'Shapefile module', to: '/docs/modules/shapefile'}
  ]}
/>

<ShapefileDocsTabs active="loader" />

<DocOrientation
  eyebrow="What it assembles"
  title="Treat the sidecars as one dataset."
  description="ShapefileLoader joins geometry and attributes, then carries projection and encoding information through the result so applications do not have to coordinate the files themselves."
  tone="orange"
  items={[
    {label: 'Geometry', value: 'SHP records and multipart shapes'},
    {label: 'Attributes', value: 'DBF fields and text encoding'},
    {label: 'Metadata', value: 'SHX index and PRJ coordinate system'},
    {label: 'Output', value: 'Legacy, GeoJSON, or Arrow table shapes'}
  ]}
/>

<ReferenceBoundary
  title="ShapefileLoader reference"
  description="The sections below document usage, output shapes, options, and the structure of the assembled result."
  tone="orange"
/>

The `ShapefileLoader` parses Shapefile datasets into loaders.gl geometry tables.

## Usage

```typescript
import {ShapefileLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const table = await load(url, ShapefileLoader);
const legacy = await load(url, ShapefileLoader, {shapefile: {shape: 'v3'}});
```

## Shapes

`ShapefileLoader` returns an Apache Arrow table with GeoArrow-compatible geometry by default. Set `shapefile.shape: 'v3'` or `shapefile.shape: 'geojson-table'` for legacy representations.

| Shape           | Output                                                      |
| --------------- | ----------------------------------------------------------- |
| `v3`            | legacy Shapefile output object                              |
| `geojson-table` | loaders.gl GeoJSON table                                    |
| `arrow-table`   | loaders.gl `ArrowTable` with WKB or typed GeoArrow geometry |

## Options

| Option                     | Type    | Default          | Description                                                                                                                                                                                                                                                                |
| -------------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shapefile.shape            | String  | `'arrow-table'`  | Output shape: `'arrow-table'`, `'v3'`, or `'geojson-table'`.                                                                                                                                                                                                              |
| shapefile.geoarrowEncoding | String  | `'geoarrow.wkb'` | Arrow geometry encoding when `shapefile.shape` is `'arrow-table'`: `'geoarrow.wkb'` or `'geoarrow'`. `'geoarrow'` infers a geometry-specific GeoArrow encoding from the SHP header.                                                                                        |
| shp.\_maxDimensions        | Integer | `4`              | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |

## Output

The default `ShapefileLoader` output is an `ArrowTable` whose property columns
come from DBF and whose `geometry` column uses WKB or typed GeoArrow encoding.
The table schema carries geospatial metadata and preserves the projection used
for reprojection. When `shapefile.shape: 'v3'` is selected, the legacy output
below is returned instead. Consult the [Shapefile specification][shapefile_spec]
for the meaning of the numeric types.

[shapefile_spec]: https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8

```
{
  encoding: 'ISO-8859-1',
  prj: null,
  shx: {
    offsets: Int32Array(8) [
      50, 0, 0, 0,
       0, 0, 0, 0
    ],
    lengths: Int32Array(8) [
      14, 0, 0, 0,
       0, 0, 0, 0
    ]
  },
  header: {
    magic: 9994,
    length: 136,
    version: 1000,
    type: 11,
    bbox: {
      minX: 1,
      minY: 2,
      minZ: 3,
      minM: 0,
      maxX: 1,
      maxY: 2,
      maxZ: 3,
      maxM: 0
    }
  },
  data: [ { type: 'Feature', geometry: [Object], properties: [Object] } ]
}
```
