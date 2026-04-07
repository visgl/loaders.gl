# Overview

![arrow-logo](./images/apache-arrow-small.png)
&emsp;
![apache-logo](../../images/logos/apache-logo.png)

The `@loaders.gl/arrow` module provides support for the [Apache Arrow](/docs/modules/arrow/formats/arrow) and [GeoArrow](/docs/modules/arrow/formats/geoarrow) formats.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/arrow
```

See [Using with Apache Arrow](/docs/developer-guide/apache-arrow) for practical guidance on how to integrate with the Apache Arrow JS library.

## Loaders and Writers

| Loader                                                                |
| --------------------------------------------------------------------- |
| [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader)       |
| [`ArrowWorkerLoader`](/docs/modules/arrow/api-reference/arrow-loader) |
| [`GeoArrowLoader`](/docs/modules/arrow/api-reference/geoarrow-loader) |

| Writer                                                          |
| --------------------------------------------------------------- |
| [`ArrowWriter`](/docs/modules/arrow/api-reference/arrow-writer) |

## Additional APIs

`@loaders.gl/arrow` also provides utilities for working with Apache Arrow JS tables after loading
or when integrating Arrow-backed data sources.

| Utility                                                                          | Description                                                            |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| [`IndexedArrowTable`](/docs/modules/arrow/api-reference/indexed-arrow-table)     | Readonly indexed table and vector views that avoid copying column data |
| [`MappedArrowTable`](/docs/modules/arrow/api-reference/mapped-arrow-table)       | String-keyed row lookup view layered on top of an indexed Arrow table  |
| [`Arrow Schema Utilities`](/docs/modules/arrow/api-reference/arrow-schema-utils) | Runtime schema validation and column-renaming helpers                  |

For the underlying Apache Arrow JS classes, start with the
[`ArrowJS API Reference`](/docs/arrowjs/api-reference).

## Attributions

`@loaders.gl/arrow` was developed with the benefit of extensive technical advice from Paul Taylor @ Graphistry.
