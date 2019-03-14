# Introduction

This page provides an overview of the Apache Arrow JS API to help you get started.


## About Apache Arrow

Apache Arrow is a columnar memory layout specification for encoding vectors and table-like containers of flat and nested data. The Arrow spec aligns columnar data in memory to minimize cache misses and take advantage of the latest SIMD (Single input multiple data) and GPU operations on modern processors.

Apache Arrow is the emerging standard for large in-memory columnar data (Spark, Pandas, Drill, Graphistry, ...). By standardizing on a common binary interchange format, big data systems can reduce the costs and friction associated with cross-system communication.


## Getting Started

To install and start coding with Apache Arrow JS bindings, see the [Getting Started](docs-arrow/developers-guide/getting-started.md).


## Feature Completeness

Ideally each Apache Arrow language binding would offer the same set of features, at least to the extent that the language/platform in question allows. In practice however, not all features have been implemented in all language bindings.

In comparison with the C++ Arrow API bindings, there are some missing features in the JavaScript bindings:

- Tensors are not yet supported.
- No explicit support for Apache Arrow Flight


## API Design Notes

Understanding some of the design decisions made when defining the JavaScript binding API may help facilitate a better appreciateion of why the API is designed the way it is:

- To facilitate the evolution of the bindings, the JavaScript Arrow API is designed to be close match to the C++ Arrow API, although some differences have been made where it makes sense. Some design patterns, like the way `RecordBatchReader.from()` returns different `RecordBatchReader` subclasses depending on what source is being read.
- To help ensure correctness, the JavaScript arrow binding implementation makes rigorous use of type definitions (through Typescript syntax). In some cases, special methods are provided to ensure that type information "flows" correctly from function/constructor arguments to returned objects. The methods `Table.new()` (as an alternative to `new Table()`) is an example of this, that you may want to leverage if your application is written in Typescript.


## Resources

There are some excellent resources available that can help you quickly get a feel for what the type of capabilities the Arrow JS API offers:

* Observable: [Introduction to Apache Arrow](https://observablehq.com/@theneuralbit/introduction-to-apache-arrow)
* Observable: [Using Apache Arrow JS with Large Datasets](https://observablehq.com/@theneuralbit/using-apache-arrow-js-with-large-datasets)
* Observable: [Manipulating Flat Arrays, Arrow-Style](https://observablehq.com/@lmeyerov/manipulating-flat-arrays-arrow-style)
* [Manipulating Flat Arrays](https://observablehq.com/@mbostock/manipulating-flat-arrays) General article on Columnar Data and Data Frames


