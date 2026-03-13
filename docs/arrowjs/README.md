# Introduction

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
