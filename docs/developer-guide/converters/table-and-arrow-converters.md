---
title: Table and Arrow converters
description: Move between loaders.gl table wrappers, raw Arrow tables, and GeoArrow-compatible data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Data conversion"
  title="Keep the table shape explicit as data moves."
  description="The table and Arrow converters bridge loaders.gl wrappers and raw Apache Arrow tables. They let an application choose a convenient shape at each boundary without confusing a wrapper with the underlying table data."
  tone="cyan"
  meta={['TableConverter', 'ArrowConverter', 'GeoArrow']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="Shape is part of the contract"
  title="Convert at the boundary, not by accident."
  description="A raw Arrow table, a loaders.gl Arrow wrapper, a columnar table, and an array of row objects can all describe the same records. The converters make the transition deliberate."
  tone="cyan"
  items={[
    {label: 'Raw Arrow', value: "shape: 'arrow' for Apache Arrow JS tables"},
    {label: 'Arrow wrapper', value: "shape: 'arrow-table' for loaders.gl APIs"},
    {label: 'Other shapes', value: 'Rows, columnar tables, and GeoJSON-like tables'},
    {label: 'Use it for', value: 'Normalization before rendering, scanning, or writing'}
  ]}
/>

These converters move between loaders.gl table wrappers and Apache Arrow tables.

<ReferenceBoundary
  title="Converter details"
  description="The sections below document the two converter families and their supported shape mappings."
  tone="cyan"
/>

## TableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/schema-utils` |
| `id` | `'table'` |
| `from` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| `to` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'` |
| Detection | Reads `input.shape` on loaders.gl table wrappers |
| Typical use | Normalize one loaders.gl wrapper into another |

`TableConverter` is the wrapper-to-wrapper bridge. It does not deal with raw Apache Arrow `Table` instances.

## ArrowConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/arrow` |
| `id` | `'arrow'` |
| `from` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| `to` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow-table'`, `'geojson-table'` |
| Detection | Treats raw Apache Arrow `Table` instances as `'arrow'` |
| Typical use | Bridge raw Arrow tables into loaders.gl wrappers, or write wrappers back to Arrow |

## Shape Mapping

| Shape | Meaning |
| --- | --- |
| `'arrow'` | Raw Apache Arrow `Table` |
| `'arrow-table'` | loaders.gl wrapper around Arrow table data |
| `'object-row-table'` | Array of row objects |
| `'array-row-table'` | Array of row arrays |
| `'columnar-table'` | Column-oriented loaders.gl wrapper |
| `'geojson-table'` | loaders.gl table wrapper specialized for GeoJSON-like rows |

## Common Pattern

```ts
import {convert, TableConverter} from '@loaders.gl/schema-utils';
import {ArrowConverter} from '@loaders.gl/arrow';

const objectRows = convert(arrowTable, 'object-row-table', [ArrowConverter, TableConverter]);
const rawArrow = convert(objectRows, 'arrow', [TableConverter, ArrowConverter]);
```

## When To Stop At Arrow

If your downstream consumer already speaks Arrow, stop at `'arrow'`.

If your downstream code wants loaders.gl table helpers or a normalized wrapper shape, continue through `TableConverter`.
