---
title: Table and Arrow converters
description: Convert between row tables, columnar tables, and native Apache Arrow tables.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Data conversion"
  title="Keep the table shape explicit as data moves."
  description="The table and Arrow converters bridge native Apache Arrow tables and loaders.gl row, columnar, and GeoJSON tables."
  tone="cyan"
  meta={['TableConverter', 'ArrowConverter', 'GeoArrow']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/tables/arrow/formats/arrow'},
    {label: 'Loader categories', to: '/docs/developer-guide/loader-categories'}
  ]}
/>

<DocOrientation
  eyebrow="Shape is part of the contract"
  title="Convert at the boundary, not by accident."
  description="A native Arrow table, a columnar table, and an array of row objects can all describe the same records. The converters make the transition deliberate."
  tone="cyan"
  items={[
    {label: 'Raw Arrow', value: "shape: 'arrow' for Apache Arrow JS tables"},
    {label: 'Arrow output', value: "shape: 'arrow' returns a native table"},
    {label: 'Other shapes', value: 'Rows, columnar tables, and GeoJSON-like tables'},
    {label: 'Use it for', value: 'Normalization before rendering, scanning, or writing'}
  ]}
/>

These converters move between loaders.gl row, columnar, and GeoJSON table shapes and native Apache Arrow tables.

<ReferenceBoundary
  title="Converter details"
  description="The sections below document the two converter families and their supported shape mappings."
  tone="cyan"
/>

## TableConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/core/schema-utils` |
| `id` | `'table'` |
| `from` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow'` |
| `to` | `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'arrow'` |
| Detection | Recognizes native tables and reads `input.shape` on loaders.gl table wrappers |
| Typical use | Convert between native Arrow and loaders.gl row or column tables |

`TableConverter` can convert native Arrow directly to row or column tables and back.

## ArrowConverter

| Field | Value |
| --- | --- |
| Package | `@loaders.gl/tables/arrow` |
| `id` | `'arrow'` |
| `from` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'` |
| `to` | `'arrow'`, `'object-row-table'`, `'array-row-table'`, `'columnar-table'`, `'geojson-table'` |
| Detection | Treats raw Apache Arrow `Table` instances as `'arrow'` |
| Typical use | Convert between native Arrow and row, columnar, or GeoJSON tables |

## Shape Mapping

| Shape | Meaning |
| --- | --- |
| `'arrow'` | Raw Apache Arrow `Table` |
| `'object-row-table'` | Array of row objects |
| `'array-row-table'` | Array of row arrays |
| `'columnar-table'` | Column-oriented loaders.gl wrapper |
| `'geojson-table'` | loaders.gl table wrapper specialized for GeoJSON-like rows |

## Common Pattern

```ts
import {convert, TableConverter} from '@loaders.gl/core/schema-utils';
const objectRows = convert(arrowTable, 'object-row-table', TableConverter);
const rawArrow = convert(objectRows, 'arrow', TableConverter);
```

## When To Stop At Arrow

If your downstream consumer already speaks Arrow, stop at `'arrow'`.

If your downstream code wants loaders.gl table helpers or a normalized wrapper shape, continue through `TableConverter`.
