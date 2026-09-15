---
title: GeoParquetLoader
description: Read GeoParquet into geospatial tables or Arrow with preserved metadata.
hide_title: true
page_style: designed
---

import {ParquetDocsTabs} from '@site/src/components/docs/parquet-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocLiveExample} from '@site/src/components/docs/doc-live-example';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {ClientExample} from '@site/src/components';

<DocPageHeader
  eyebrow="Parquet module · geospatial loader"
  title="GeoParquetLoader"
  description="Read GeoParquet files into Arrow tables by default while preserving the metadata that describes geometry columns, coordinate systems, and encodings."
  tone="mint"
  logos={[{alt: 'Apache Parquet', src: '/images/format-logos/parquet-logo.png'}]}
  meta={['From v5.0', 'GeoParquet', 'Arrow output']}
  links={[
    {label: 'GeoParquet format', to: '/docs/modules/parquet/formats/geoparquet'},
    {label: 'ParquetLoader', to: '/docs/modules/parquet/api-reference/parquet-loader'},
    {label: 'Parquet module', to: '/docs/modules/parquet'}
  ]}
/>

<DocLiveExample label="GeoParquetLoader map example" height="420px">
  <ClientExample kind="geospatial" format="GeoParquet" parquetLoaderName="geoparquet" />
</DocLiveExample>

<ParquetDocsTabs active="geoparquetloader" />

<DocOrientation
  eyebrow="What it preserves"
  title="Keep the table and the spatial meaning together."
  description="GeoParquetLoader exposes the data in a familiar table shape while carrying GeoParquet and GeoArrow metadata through the read boundary."
  tone="mint"
  items={[
    {label: 'Default', value: 'Arrow table with geospatial metadata'},
    {label: 'Rows', value: "Object-row table with parquet.shape: 'object-row-table'"},
    {label: 'Geometry', value: 'Supported encodings mapped to GeoArrow fields'},
    {label: 'Metadata', value: 'GeoParquet schema metadata preserved'}
  ]}
/>

<ReferenceBoundary
  title="GeoParquetLoader reference"
  description="The sections below document usage, output shapes, metadata handling, and Parquet options."
  tone="mint"
/>

`GeoParquetLoader` loads GeoParquet files into loaders.gl `ArrowTable` objects by default. Set `parquet.shape: 'object-row-table'` when row-oriented output is required.

## Usage

```typescript
import {load} from '@loaders.gl/core';
import {GeoParquetLoader} from '@loaders.gl/parquet';

const arrowTable = await load(url, GeoParquetLoader);
const rowTable = await load(url, GeoParquetLoader, {
  parquet: {shape: 'object-row-table'}
});
```

## Shapes

| Shape              | Output                                          |
| ------------------ | ----------------------------------------------- |
| `object-row-table` | loaders.gl object-row table                    |
| `arrow-table`      | loaders.gl `ArrowTable` with geospatial metadata |

## Geospatial Metadata

When loading Arrow output, `GeoParquetLoader` preserves GeoParquet schema metadata and annotates compatible geometry fields with GeoArrow field metadata. Geometry column buffers are passed through unchanged.

For GeoJSON output, geometry columns are converted to GeoJSON geometries where supported.

## Options

`GeoParquetLoader` supports the same options as [`ParquetLoader`](/docs/modules/parquet/api-reference/parquet-loader).
