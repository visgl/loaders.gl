---
title: Apache Arrow JavaScript
description: Work with typed, binary columnar data in JavaScript and loaders.gl.
hide_title: true
page_style: designed
---

import {CategoryDataConcept} from '@site/src/components/home/concepts';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript guide"
  title="A typed table shape for JavaScript."
  description="Apache Arrow JS gives applications a binary columnar representation for tables, vectors, record batches, schemas, and zero-copy-friendly data movement. loaders.gl uses it as a common boundary across formats and runtimes."
  tone="cyan"
  meta={['Apache Arrow JS v21+', 'Typed columns', 'Tables and record batches']}
  links={[
    {label: 'Arrow in loaders.gl', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Working with tables', to: '/docs/arrowjs/developer-guide/tables'},
    {label: 'API reference', to: '/docs/arrowjs/api-reference'}
  ]}
/>

<CategoryDataConcept initialCategoryId="table" initialRepresentationId="arrow" />

<DocOrientation
  eyebrow="Start with the data shape"
  title="Use columns when the next operation is column-shaped."
  description="Arrow keeps values typed and grouped by column while still supporting row access, batches, schemas, and nested data. It is a useful interchange boundary, not a requirement for every application."
  tone="cyan"
  items={[
    {label: 'Table', value: 'A chunked collection of named, typed columns'},
    {label: 'Vector', value: 'A logical column view over one or more data chunks'},
    {label: 'RecordBatch', value: 'A row-aligned group of columns for streaming'},
    {label: 'Schema', value: 'Field names, types, nullability, and metadata'}
  ]}
  />

<ReferenceBoundary
  title="Arrow JS concepts and APIs"
  description="The sections and linked guides below cover installation, table access, builders, data types, streaming readers and writers, and the loaders.gl Mesh Arrow convention."
  tone="cyan"
/>

Apache Arrow JS provides the JavaScript API for reading, writing, and inspecting Arrow's binary
columnar representation. Its core objects cover tables, vectors, schemas, record batches, and the
builders and readers that move data between JavaScript and Arrow buffers.

## Choose a path

| If you need to… | Start here |
| --- | --- |
| Install Arrow and create a first table | [Getting started](/docs/arrowjs/get-started) |
| Understand tables, vectors, and buffers | [Introduction](/docs/arrowjs/developer-guide/introduction) |
| Build or transform typed data | [Builders](/docs/arrowjs/developer-guide/builders) |
| Read or write Arrow IPC | [Reading and writing](/docs/arrowjs/developer-guide/reading-and-writing) |
| Use Arrow across loaders.gl formats | [Arrow in loaders.gl](/docs/developer-guide/apache-arrow) |

## What Arrow contributes

Arrow defines a shared physical layout for typed vectors and table-like containers, including flat,
variable-width, and nested data. Keeping values in columns makes selective access and vectorized
processing practical, while shared buffers make handoffs between libraries less expensive.

In loaders.gl, Arrow JS is the implementation behind the Arrow table boundary. A CSV, Parquet, or
GeoArrow loader can produce data that follows the same table and batch conventions, so downstream
code does not need to know which file format was decoded.

## Resources

These resources provide background on the format and practical examples:

- Observable: [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)
- Observable: [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@randomfractals/apache-arrow)
- Observable: [Manipulating Flat Arrays, Arrow-Style](https://observablehq.com/@lmeyerov/manipulating-flat-arrays-arrow-style)
- [Manipulating Flat Arrays](https://observablehq.com/@mbostock/manipulating-flat-arrays) General article on Columnar Data and Data Frames

Apache Arrow project links:

- [Apache Arrow Home](https://arrow.apache.org/)
- [Apache Arrow JS on github](https://github.com/apache/arrow/tree/master/js)
- [Apache Arrow JS on npm](https://www.npmjs.com/package/apache-arrow)

## Why this reference lives here

The official [Arrow JS documentation](https://arrow.apache.org/docs/js/) is the authority for the
library. This guide adds the context that is most relevant to loaders.gl: how Arrow objects map to
the loader category model, how batches move through workers, and where conversion belongs.

Use the API reference for individual classes and this guide for the route through them. If a detail
describes Arrow itself rather than loaders.gl integration, follow the Apache project links above.
