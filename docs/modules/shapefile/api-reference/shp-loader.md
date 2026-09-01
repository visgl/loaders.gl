---
title: SHPLoader
description: Decode the geometry component of a Shapefile dataset.
hide_title: true
page_style: designed
---

import {ShapefileDocsTabs} from '@site/src/components/docs/shapefile-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Shapefile module · geometry loader"
  title="SHPLoader"
  description="Decode the `.shp` geometry component of a Shapefile dataset into WKB or Arrow geometry columns. Use ShapefileLoader when attributes and sidecars are needed too."
  tone="orange"
  meta={['From v2.3', 'SHP geometry', 'WKB / GeoArrow']}
  links={[
    {label: 'Shapefile format', to: '/docs/modules/shapefile/formats/shapefile'},
    {label: 'ShapefileLoader', to: '/docs/modules/shapefile/api-reference/shapefile-loader'},
    {label: 'Shapefile module', to: '/docs/modules/shapefile'}
  ]}
/>

<ShapefileDocsTabs active="shp" />

<DocOrientation
  eyebrow="What it reads"
  title="Decode geometry when the attributes are handled elsewhere."
  description="SHPLoader focuses on the binary geometry file and can emit compact WKB or an Arrow geometry column, making it useful as a lower-level building block."
  tone="orange"
  items={[
    {label: 'Input', value: 'A `.shp` geometry file'},
    {label: 'Default', value: 'An array of WKB geometries'},
    {label: 'Arrow', value: 'WKB or typed GeoArrow geometry'},
    {label: 'Dimensions', value: 'X, Y, Z, and M where present'}
  ]}
/>

<ReferenceBoundary
  title="SHPLoader reference"
  description="The sections below document the lower-level loader, installation, usage, output, and geometry options."
  tone="orange"
/>

A "sub loader" for the `.shp` (geometries) file component of a shapefile.

Note: Most applications will want to use the `ShapefileLoader` instead of this loader.

## Usage

```typescript
import {SHPLoader} from '@loaders.gl/shapefile';
import {load} from '@loaders.gl/core';

const data = await load(url, SHPLoader);
const table = await load(url, SHPLoader, {shp: {shape: 'arrow-table'}});
```

## Options

| Option                 | Type    | Default          | Description                                                                                                                                                                                                                                                                |
| ---------------------- | ------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shp.shape              | String  | `'wkb'`          | Output shape: `'wkb'` for an array of WKB geometries, or `'arrow-table'` for an Arrow geometry column.                                                                                                                                                                     |
| shp.geoarrowEncoding   | String  | `'geoarrow.wkb'` | Legacy Arrow geometry encoding when `shp.shape` is `'arrow-table'`: `'geoarrow.wkb'` or `'geoarrow'`. `'geoarrow'` maps to the adaptive `optimized` preference and infers a geometry-specific GeoArrow encoding from the SHP header.                                                                                              |
| geoarrow.encodingPreference | String | `'geoarrow.wkb'` | Arrow geometry preference: `'geoarrow.wkb'` for compact compatibility, `'geoarrow.geometry'` for a stable dense union, or `'optimized'` for concrete native encoding when possible.                                                                 |
| shp.\_maxDimensions    | Integer | `4`              | Shapefiles can hold up to 4 dimensions (XYZM). By default all dimensions are parsed; when set to `2` only the X and Y dimensions are parsed. Note that for some Shapefiles, the third dimension is M, not Z. `header.type` in the output designates the stored dimensions. |

## Output

The `SHPLoader`'s default output looks like the following. `geometries` holds an
array of WKB byte arrays, with `null` entries for Null Shape records. `header`
contains the Shapefile's header values, including a bounding box of the data and
the file's geometry type. Consult the [Shapefile specification][shapefile_spec]
for the meaning of the numeric types.

[shapefile_spec]: https://www.esri.com/library/whitepapers/pdfs/shapefile.pdf#page=8

```
{
  geometries: [Uint8Array(29)],
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
  progress: { bytesUsed: 0, bytesTotal: 136, rows: 1 },
  currentIndex: 2
}
```
