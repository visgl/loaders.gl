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

The Apache Arrow Arrow JS library provides a JavaScript API is designed to help applications work with binary columnar data in the Apache Arrow format. Arrow JS offers a core set of classes that supports use cases such as batched loading and writing, column and row access, schemas etc.

## Getting Started

To install and start coding with Apache Arrow JS bindings, see the [Getting Started](/docs/arrowjs/get-started).

## About Apache Arrow

Apache Arrow is a performance-optimized binary columnar memory layout specification for encoding vectors and table-like containers of flat and nested data. The Arrow spec is design to eliminate memory copies and aligns columnar data in memory to minimize cache misses and take advantage of the latest SIMD (Single input multiple data) and GPU operations on modern processors.

Apache Arrow is emerging as the standard for large in-memory columnar data (Spark, Pandas, Drill, Graphistry, ...). By standardizing on a common binary interchange format, big data systems can reduce the costs and friction associated with cross-system communication.

## Resources

There are some excellent resources available that can help you quickly get a feel for what capabilities the Arrow JS API offers:

- Observable: [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)
- Observable: [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@randomfractals/apache-arrow)
- Observable: [Manipulating Flat Arrays, Arrow-Style](https://observablehq.com/@lmeyerov/manipulating-flat-arrays-arrow-style)
- [Manipulating Flat Arrays](https://observablehq.com/@mbostock/manipulating-flat-arrays) General article on Columnar Data and Data Frames

Apache Arrow project links:

- [Apache Arrow Home](https://arrow.apache.org/)
- [Apache Arrow JS on github](https://github.com/apache/arrow/tree/master/js)
- [Apache Arrow JS on npm](https://www.npmjs.com/package/apache-arrow)

## Why does loaders.gl provide an Arrow JS API Reference?

While the Apache Arrow JS library itself is excellent, the [reference documentation for the JavaScript bindings](https://arrow.apache.org/docs/js/) is unfortunately rather thin. It can therefore be challenging to get up to speed on the Arrow JS API.

Since loaders.gl is relying more and more on Apache Arrow formatted tables, it seemed important to ensure users can find good documentation.

> The original idea was that this documentation would at some point be contributed back to the Apache Arrow project/repository.
