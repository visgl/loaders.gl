---
title: Extracting data from Arrow
description: Move values from Arrow vectors and tables into JavaScript only at the boundary where you need them.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · conversion"
  title="Leave data columnar until the application needs rows."
  description="Arrow tables and vectors are efficient because values stay typed and grouped. Extract rows, columns, arrays, or JSON deliberately, then keep the conversion at the edge of the pipeline."
  tone="yellow"
  meta={['Rows and columns', 'Typed arrays', 'Low-copy access']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Table API', to: '/docs/arrowjs/api-reference/table'},
    {label: 'Row API', to: '/docs/arrowjs/api-reference/row'}
  ]}
/>

<DocOrientation
  eyebrow="Select the smallest conversion"
  title="Convert only the shape the next operation needs."
  description="A column access can stay typed and compact, while a row object is convenient for UI or application logic. Whole-table JSON is useful for interchange but creates the most materialization."
  tone="yellow"
  items={[
    {label: 'Column', value: 'Keep a typed vector for columnar work'},
    {label: 'Chunk', value: 'Read one underlying batch with minimal copying'},
    {label: 'Row', value: 'Create a temporary object for application logic'},
    {label: 'JSON', value: 'Materialize a portable representation at the edge'}
  ]}
/>

<ReferenceBoundary
  title="Conversion details"
  description="The examples below cover row and column access, chunk-aware reads, typed arrays, JSON conversion, and the costs of materialization."
  tone="yellow"
/>

# Extracting Data

While keeping data in Arrow format enables efficient operations, there are many cases where you need native JavaScript values.

## Converting Data

Many Arrow classes support:

- `toArray()` — typically returns a typed array or array.
- `toJSON()` — JSON-style values.
- `toString()` — printable representation.

## Extracting Data by Row

Get a temporary object representing a row in a table.

```typescript
const row = table.get(0);
```

Rows do not retain a schema reference. Access by index or use row object helpers such as `toJSON()`.

## Extracting Data by Column

Get a column vector by name.

```typescript
const column = table.getChild('data');
```

```typescript
const array = table.getChild('columnName')?.toArray();
```

## Extracting data by Column and Batch

A low-copy approach is to iterate through chunks and read per-chunk typed arrays when tables are chunked.
