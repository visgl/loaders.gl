---
title: JSONWriter
description: Encode loaders.gl row, columnar, and Arrow tables as JSON text.
hide_title: true
page_style: designed
---

import {JsonDocsTabs} from '@site/src/components/docs/json-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="JSON module · writer API"
  title="JSONWriter"
  description="Encode loaders.gl tables as JSON text, including readable GeoJSON conversion for GeoArrow WKB columns when the output needs to cross into a JSON-oriented system."
  tone="yellow"
  meta={['From v4.0', 'Rows and tables', 'GeoArrow-aware']}
  links={[
    {label: 'JSON format', to: '/docs/modules/json/formats/json'},
    {label: 'GeoJSONWriter', to: '/docs/modules/json/api-reference/geojson-writer'},
    {label: 'JSON module', to: '/docs/modules/json'}
  ]}
/>

<JsonDocsTabs active="jsonwriter" />

<DocOrientation
  eyebrow="What it writes"
  title="Leave a binary table as ordinary JSON when you need to."
  description="JSONWriter accepts row, columnar, and Arrow-backed tables and serializes them as JSON rows. GeoArrow WKB columns can be decoded to readable GeoJSON geometry by default."
  tone="yellow"
  items={[
    {label: 'Input', value: 'Row, columnar, or Arrow tables'},
    {label: 'Output', value: 'JSON text or an ArrayBuffer'},
    {label: 'Geometry', value: 'WKB to GeoJSON by default'},
    {label: 'Control', value: 'Shape, wrapper, and GeoArrow options'}
  ]}
/>

<ReferenceBoundary
  title="JSONWriter reference"
  description="The sections below document usage, table conversion, GeoArrow handling, and writer options."
  tone="yellow"
/>

`JSONWriter` writes loaders.gl tables as JSON text.

## Usage

```typescript
import {encode} from '@loaders.gl/core';
import type {Table} from '@loaders.gl/schema';
import {JSONWriter} from '@loaders.gl/json';

declare const table: Table;

const data = await encode(table, JSONWriter); // ArrayBuffer
const text = JSONWriter.encodeTextSync(table, {json: options}); // string
```

`JSONWriter` accepts loaders.gl row, columnar, and Arrow tables. Arrow table inputs are serialized as JSON row objects by default.

```typescript
const json = await encode(arrowTable, JSONWriter, {
  json: {shape: 'arrow-table'}
});
```

If an Arrow table has a `geoarrow.wkb` geometry column, `JSONWriter` decodes that column to GeoJSON geometry objects before serializing. This keeps JSON output readable while preserving the writer's normal array-of-rows shape.

```typescript
const json = await encode(geoArrowTable, JSONWriter);
// [{"name":"A","geometry":{"type":"Point","coordinates":[1,2]}}]
```

Set `json.geoarrow: 'none'` to serialize the raw WKB values instead.

## Data Format

Encoded batches are array buffers or strings.

## JSONWriter Options

| Option          | Type                                            | Default              | Description                                                                                                                                      |
| --------------- | ----------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `json.shape`    | `'object-row-table' \| 'array-row-table' \| 'arrow-table'` | `'object-row-table'` | Requested JSON row shape. `'arrow-table'` is accepted for Arrow table inputs and serializes rows as objects.                                      |
| `json.geoarrow` | `'auto' \| 'none'`                              | `'auto'`             | Controls GeoArrow WKB decoding. `'auto'` decodes `geoarrow.wkb` columns to GeoJSON geometry objects. `'none'` serializes the raw values.          |
| `json.wrapper`  | `(table: RowObject[] \| RowArray[]) => unknown` |                      | Wraps the encoded table rows in a custom JSON value.                                                                                             |
