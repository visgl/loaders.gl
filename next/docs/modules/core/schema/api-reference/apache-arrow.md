# Apache Arrow

***

## title: Apache Arrow interoperability description: The typed, columnar interchange layer behind loaders.gl tables. hide\_title: true page\_style: designed[​](#title-apache-arrow-interoperabilitydescription-the-typed-columnar-interchange-layer-behind-loadersgl-tableshide_title-truepage_style-designed "Direct link to title: Apache Arrow interoperability&#xA;description: The typed, columnar interchange layer behind loaders.gl tables.&#xA;hide_title: true&#xA;page_style: designed")

<!-- -->

Schema module · interoperability

# Apache Arrow

loaders.gl uses Apache Arrow as a practical common language for typed, columnar data. Arrow-backed tables let loaders, scanners, workers, and applications share buffers without agreeing on the original file format.

[Arrow guide](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/apache-arrow.md)[Schema module](https://loaders.gl/next/docs/modules/core/schema.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/schema.md)[ArrowLoader](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tables/arrow/api-reference/arrow-loader.md)

The common table layer

## Keep data columnar as it crosses boundaries.

Arrow supplies the physical model; loaders.gl adds table contracts and format-specific adapters around it. The result is a stable handoff between decoding, scanning, workers, and visualization.

01

Types

Explicit primitive, nested, and binary types

02

Buffers

Typed memory with offsets and validity

03

Batches

Bounded record groups for streaming

04

Interop

Shared data across formats and runtimes

Detailed guide

## Arrow interoperability

This page is an entry point for the Arrow relationship; detailed APIs live in the schema and Arrow module references.

loaders.gl aims to provide strong support for and interoperability with Apache Arrow.
