---
title: Schema and table data
description: Shared table, schema, and batch shapes for loaders and writers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

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

## Schemas

## Batches

## Table APIs

The table API is modelled after a subset of the Apache Arrow API:

| Class                                                     | Arrow Counterpart | Description |
| --------------------------------------------------------- | ----------------- | ----------- |
| [`Table`](/docs/modules/schema/api-reference/table)       | `Table`           | Table       |
| [`Schema`](/docs/modules/schema/api-reference/schema)     | `Schema`          | Schema      |
| [`Batch`](/docs/modules/schema/api-reference/table-batch) | `RecordBatch`     | Batch       |

## Determining shape of loaded data

loaders.gl favors formats that wrap the data with a `shape` field so that the type of the returned data can be determined at run-time:

```typescript
export type NewDataType = {
  shape: 'new-data-type';
  data: TypeOfData;
  schema?: Schema;
};
```

However a number of traditional return formats do not include such a wrapper.

## Controlling the shape of loaded data

Loaders are encouraged to provide a `shape` option to allow applications to control the return format. Since different loaders offer different selection of shapes, the option is set per loader.

```typescript
const tile = await load(url, MVTLoader, {mvt: {shape: 'geojson-table', ...}});
assert(tile.shape === 'geojson-table');
processTile(tile.data);
```

### Table Category

| Shape              | Category         | Types / Description |
| ------------------ | ---------------- | ------------------- |
| `table`            | `Table`          |
| `array-row-table`  | `ArrayRowTable`  |
| `object-row-table` | `ObjectRowTable` |
| `columnar-table`   | `ColumnarTable`  |

- Tables can be
- row-oriented, i.e. organized as an array of rows
- columnar, containing one array per column

Rows can contain either

- an array of values, where the column name is found in the schema.
- object with key-value pairs, where the key is the column name

```typescripton
{
  "shape": ,
  "data":
}
```

## GIS Category

| Shape              | Category         | Types / Description                                              |
| ------------------ | ---------------- | ---------------------------------------------------------------- |
| `geojson`          | `GeoJSON`        | GeoJSON is a `features` array wrapped at the top level           |
| `array-row-table`  | `ArrayRowTable`  |
| `object-row-table` | `ObjectRowTable` |
| `geojson-table`    | `GeojsonTable`   | GeoJSON table essentially contains the `features` array from the |
