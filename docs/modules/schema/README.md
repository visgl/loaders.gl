---
title: Schema and table data
description: Shared table, schema, and batch shapes for loaders and writers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {TableShapeGraphic} from '@site/src/components/docs/table-shape-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {CategoryDataConcept} from '@site/src/components/home/concepts';

<DocPageHeader
  eyebrow="Schema module"
  title="Give loaders a common shape to return."
  description="`@loaders.gl/schema` defines the lightweight table, schema, and batch contracts used across loaders.gl. It follows the parts of Apache Arrow that applications need for portable category data."
  tone="cyan"
  meta={['Tables and schemas', 'Batch contracts', 'Arrow-aligned']}
  links={[
    {label: 'Schema APIs', to: '/docs/modules/schema/table-guide'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'},
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'}
  ]}
/>

<TableShapeGraphic />

<CategoryDataConcept initialCategoryId="table" initialRepresentationId="arrow" />

<DocOrientation
  eyebrow="The data-shape boundary"
  title="Decode many formats. Keep the application path stable."
  description="Schema types describe how a loader’s result is organized, without forcing every format to use the same physical representation. Applications can choose row, columnar, wrapped, or Arrow-backed shapes where supported."
  tone="cyan"
  items={[
    {label: 'Table', value: 'Rows, columns, schema, and optional metadata'},
    {label: 'Schema', value: 'Field names, types, and nested structure'},
    {label: 'Batch', value: 'A bounded unit of records or category data'},
    {label: 'Interop', value: 'Arrow-compatible shapes across loaders and writers'}
  ]}
/>

<ReferenceBoundary
  title="Tables, batches, and shape selection"
  description="The sections below cover table APIs, runtime shape detection, loader shape options, and the category data contracts used by applications."
  tone="cyan"
/>

## What the module provides

The schema module is the small contract shared by loaders, sources, converters, and writers. It
describes the data shape without taking ownership of the format-specific decoder.

- [`Schema`](/docs/modules/schema/api-reference/schema) describes named fields, types, nullability,
  and metadata.
- [`Table`](/docs/modules/schema/api-reference/table) describes a complete result in a row,
  columnar, GeoJSON, or Arrow representation.
- [`Batch`](/docs/modules/schema/api-reference/table-batch) describes one bounded result from an
  incremental loader or source.

The types are deliberately serializable and Arrow-aligned. Applications can use the lightweight
schema types at package boundaries, then convert to full Apache Arrow objects when they need Arrow
execution or IPC.

## Choose a table shape

| Shape | Use it when | Data location |
| --- | --- | --- |
| `array-row-table` | Rows are easiest to pass through application code | `data` is an array of value arrays |
| `object-row-table` | Fields should be addressed by name | `data` is an array of objects |
| `geojson-table` | The result needs GeoJSON feature compatibility | `features` contains the rows |
| `columnar-table` | Typed columns are useful but Arrow is not required | `data` is a map of array-like columns |
| `arrow-table` | The next step is columnar processing, scanning, or IPC | `data` contains an Apache Arrow table |

Every wrapped result uses `shape` as its discriminant, so application code can select the correct
branch without guessing from the payload:

```typescript
function getRowCount(table: Table): number {
  switch (table.shape) {
    case 'geojson-table':
      return table.features.length;
    case 'arrow-table':
      return table.data.numRows;
    default:
      return table.data.length;
  }
}
```

## Shapes in loaders

When a loader supports multiple representations, the option belongs to that loader's namespace.
The exact choices vary by format, but the result keeps the same explicit `shape` boundary:

```typescript
const table = await load(url, MVTLoader, {
  mvt: {shape: 'geojson-table'}
});

if (table.shape === 'geojson-table') {
  renderFeatures(table.features);
}
```

For batch-oriented APIs, the same category names describe each batch. That makes it possible to
start with `load()` for a complete result and move to `loadInBatches()` or a source without
redesigning the consumer.

## Table APIs

The table API is modelled after a focused subset of the Apache Arrow API:

| loaders.gl type | Arrow counterpart | Role |
| --- | --- | --- |
| [`Table`](/docs/modules/schema/api-reference/table) | `Table` | Complete table result |
| [`Schema`](/docs/modules/schema/api-reference/schema) | `Schema` | Field and metadata description |
| [`Batch`](/docs/modules/schema/api-reference/table-batch) | `RecordBatch` | Bounded incremental result |

Use the [table guide](/docs/modules/schema/table-guide) for the longer explanation of row and
columnar representations, or continue to the [Apache Arrow interoperability page](/docs/modules/schema/api-reference/apache-arrow)
when the physical memory layout matters.
