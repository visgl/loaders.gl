import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# Apache Arrow

<ArrowDocsTabs active="overview" />

Apache Arrow is a language-independent binary columnar memory format for table-like data. It enables efficient sharing between systems and languages with minimal copying.

- _[`@loaders.gl/arrow`](/docs/modules/arrow)_ - loaders.gl implementation
- _[Apache Arrow](https://arrow.apache.org/)_ - Apache Arrow project
- _[Arrow JS](https://arrow.apache.org/docs/js)_ - official Apache Arrow JS documentation
- _[Arrow JS](/docs/arrowjs)_ - loaders.gl Arrow JS API reference

## About Apache Arrow

The Apache Arrow project specifies a binary columnar memory format for flat and nested data. It supports zero-copy shared memory, streaming messages, interprocess communication, and efficient integration with data libraries.

Arrow stores values by column rather than by row. This layout improves cache locality and enables vectorized operations, SIMD processing, and efficient transfer to runtimes that understand Arrow memory.

## Arrow JS

`@loaders.gl/arrow` uses Apache Arrow JS for IPC parsing, writing, and table access. The loaders.gl wrapper adds loader metadata, worker integration, table shape conversion, and utilities for common Arrow table workflows.

## Related Formats

[GeoArrow](/docs/modules/arrow/formats/geoarrow) is not a separate file format. It defines geospatial conventions for Arrow extension metadata and geometry column layout.
