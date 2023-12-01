# Overview

![arrow-logo](./images/apache-arrow-small.png)
&emsp;
![apache-logo](../../images/logos/apache-logo.png)

The `@loaders.gl/arrow` module provides support for the [Apache Arrow](/docs/modules/arrow/formats/arrow) and [GeoArrow](/docs/modules/arrow/formats/geoarrow) formats. 

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/arrow
```

## Loaders and Writers

| Loader                                                               |
| -------------------------------------------------------------------- |
| [`ArrowLoader`](/docs/modules/arrow/api-reference/arrow-loader)       |
| [`ArrowWorkerLoader`](/docs/modules/arrow/api-reference/arrow-loader) |
| [`GeoArrowLoader`](/docs/modules/arrow/api-reference/geoarrow-loader)       |

| Writer                                                         |
| -------------------------------------------------------------- |
| [`ArrowWriter`](/docs/modules/arrow/api-reference/arrow-writer) |

## Additional APIs

Arrow provides a rich JavaScript API for working with Arrow formatted data. Please refer to the `ArrowJS` API documentation.

## Attributions

`@loaders.gl/arrow` was developed with the benefit of extensive technical advice from Paul Taylor @ Graphistry.
