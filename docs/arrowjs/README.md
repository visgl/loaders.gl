# Introduction

## Why does loaders.gl provide an Arrow JS API Reference?

> Perhaps this documentation could at some point be contributed back to the Apache Arrow project, but so far this has not happened.

loaders.gl is designed to output parsed tables and meshes in binary columnar format (whenever the parsed data structure allows). Binary columnar tables are a compact and efficient representation that is easy to work with analytically in JavaScript and to seamlessly upload to GPUs (via e.g. WebGL or WebGPU) for ultra-performance rendering and computation.

While loaders.gl can load data into binary columnar tables, it only provides limited support for working with binary tables. The intention is that the application should be able to use complementary libraries like Apache Arrow JS.

While the Apache Arrow JS library itself is excellent, the [reference documentation for the Apache Arrow JavaScript bindings](https://arrow.apache.org/docs/js/) is unfortunately rather thin. It can therefore be challenging to get up to speed on the Arrow JS API, which is why this documentation is provided in loaders.gl.

## About Apache Arrow JS

The Apache Arrow JavaScript API is designed to help applications tap into the full power of working with binary columnar data in the Apache Arrow format. Arrow JS has a rich set of classes that supports use cases such as batched loading and writing, as well performing data frame operations on Arrow encoded data, including applying filters, iterating over tables, etc.

## Getting Started

To install and start coding with Apache Arrow JS bindings, see the [Getting Started](/docs/arrowjs/get-started).

## About Apache Arrow

Apache Arrow is a performance-optimized binary columnar memory layout specification for encoding vectors and table-like containers of flat and nested data. The Arrow spec is design to eliminate memory copies and aligns columnar data in memory to minimize cache misses and take advantage of the latest SIMD (Single input multiple data) and GPU operations on modern processors.

Apache Arrow is emerging as the standard for large in-memory columnar data (Spark, Pandas, Drill, Graphistry, ...). By standardizing on a common binary interchange format, big data systems can reduce the costs and friction associated with cross-system communication.

## Resources

There are some excellent resources available that can help you quickly get a feel for what capabilities the Arrow JS API offers:

* Observable: [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)
* Observable: [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@randomfractals/apache-arrow)
* Observable: [Manipulating Flat Arrays, Arrow-Style](https://observablehq.com/@lmeyerov/manipulating-flat-arrays-arrow-style)
* [Manipulating Flat Arrays](https://observablehq.com/@mbostock/manipulating-flat-arrays) General article on Columnar Data and Data Frames

Apache Arrow project links:

* [Apache Arrow Home](https://arrow.apache.org/)
* [Apache Arrow JS on github](https://github.com/apache/arrow/tree/master/js)
* [Apache Arrow JS on npm](https://www.npmjs.com/package/apache-arrow)
