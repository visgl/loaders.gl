---
title: '@loaders.gl/arrow'
description: Arrow and GeoArrow loaders, writers, and utilities for typed columnar data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Module overview"
  title="@loaders.gl/arrow"
  description="Use Apache Arrow as the common table shape between format loaders, workers, transforms, and writers."
  tone="cyan"
  meta={['Apache Arrow', 'GeoArrow', 'Tables and transport']}
  links={[
    {label: 'Arrow format', to: '/docs/modules/arrow/formats/arrow'},
    {label: 'ArrowLoader', to: '/docs/modules/arrow/api-reference/arrow-loader'},
    {label: 'ArrowWriter', to: '/docs/modules/arrow/api-reference/arrow-writer'}
  ]}
/>

![arrow-logo](./images/apache-arrow-small.png)
&emsp;
![apache-logo](../../images/logos/apache-logo.png)

<DocOrientation
  eyebrow="The Arrow module"
  title="One binary table shape between every stage."
  description="Use Arrow when a loader, worker, transform, scanner, or writer needs to exchange typed columns without falling back to format-specific row objects."
  tone="cyan"
  items={[
    {label: 'Ingest', value: 'Load Arrow IPC and convert compatible formats into tables'},
    {label: 'Compute', value: 'Keep typed columns, schemas, and batches explicit'},
    {label: 'Transport', value: 'Move buffers across workers with focused helpers'},
    {label: 'Geospatial', value: 'Carry GeoArrow geometry columns and metadata'}
  ]}
/>

The `@loaders.gl/arrow` module provides support for the [Apache Arrow](/docs/modules/arrow/formats/arrow) and [GeoArrow](/docs/modules/arrow/formats/geoarrow) formats.

<ReferenceBoundary
  title="Loaders, writers, and table utilities"
  description="The reference below covers installation, Arrow and GeoArrow entry points, transport helpers, indexed views, schema utilities, and the underlying Arrow JS API."
  tone="cyan"
/>

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/arrow
```

See [Using with Apache Arrow](/docs/developer-guide/apache-arrow) for practical guidance on how to integrate with the Apache Arrow JS library.

## Loaders and Writers

| Loader / Writer | Description |
| --------------- | ----------- |
| [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader) | Loads Apache Arrow IPC files and streams as loaders.gl tables. |
| [`ArrowWorkerLoader`](/docs/modules/arrow/api-reference/arrow-loader) | Deprecated alias for `ArrowLoader`. |
| [`GeoArrowLoader`](/docs/modules/arrow/api-reference/geoarrow-loader) | Loads Arrow data and interprets GeoArrow geometry columns. |
| [`ArrowWriter`](/docs/modules/arrow/api-reference/arrow-writer) | Writes arrays as Apache Arrow IPC data. |

## Additional APIs

`@loaders.gl/arrow` also provides utilities for working with Apache Arrow JS tables after loading
or when integrating Arrow-backed data sources. Arrow worker transport helpers are available from
the focused `@loaders.gl/arrow/transport` subpath as well as the root export.

| Utility                                                                          | Description                                                            |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`IndexedArrowTable`](/docs/modules/arrow/api-reference/indexed-arrow-table)     | Readonly indexed table and vector views that avoid copying column data |
| [`MappedArrowTable`](/docs/modules/arrow/api-reference/mapped-arrow-table)       | String-keyed row lookup view layered on top of an indexed Arrow table  |
| [`splitArrowBuffers`](/docs/modules/arrow/api-reference/split-arrow-buffers)     | Rebuild Arrow objects so sliced buffers can be transferred safely       |
| [`Arrow Table Transport`](/docs/modules/arrow/api-reference/arrow-table-transport) | Dehydrate/hydrate or serialize/deserialize Arrow tables across workers |
| [`triangulateWKBGeometryColumn`](/docs/modules/arrow/api-reference/triangulate-wkb-geometry-column) | Tessellate a GeoArrow WKB geometry column into index and vertex columns |
| [`Arrow Schema Utilities`](/docs/modules/arrow/api-reference/arrow-schema-utils) | Runtime schema validation and column-renaming helpers                  |
| [`Arrow Variable-Width Conversion`](/docs/modules/arrow/api-reference/arrow-variable-width) | Convert Utf8/Binary vectors and tables between standard and view layouts |
| [`UTF-8 Utilities`](/docs/modules/arrow/api-reference/utf8-utils)                | Compare and parse Arrow UTF-8 byte ranges without decoding strings     |

For the underlying Apache Arrow JS classes, start with the
[`ArrowJS API Reference`](/docs/arrowjs/api-reference).

## Attributions

`@loaders.gl/arrow` was developed with the benefit of extensive technical advice from Paul Taylor @ Graphistry.
