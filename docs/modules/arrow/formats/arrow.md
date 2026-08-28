import {ArrowDocsTabs} from '@site/src/components/docs/arrow-docs-tabs';

# Apache Arrow

<ArrowDocsTabs active="overview" />

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

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

## Scan support

The scan badge means this format has a working entry point in the [common scan
architecture](/docs/developer-guide/common-scan-architecture). Arrow is both a transport format and
the result representation used by the tabular scan adapters.

| Capability | In-memory Arrow table | Arrow IPC source |
| --- | --- | --- |
| Entry point | `query()` or `read()` | `read()` |
| Schema discovery | Available immediately | Available from IPC metadata |
| Predicate | Portable predicate execution | Rejected as unsupported |
| Projection | Supported | Pushdown |
| Limit | Supported | Global limit across batches |
| Streaming and cancellation | Materialized result | Streaming Arrow batches; cancellable |
| Additional relational operators | Expressions, ordering, aggregates, unions, and joins | Not part of the IPC source contract |

Predicate columns may be omitted from the final projection. The predicate is evaluated before
projection, and the global limit counts only rows that survive filtering.

## Related Formats

[GeoArrow](/docs/modules/arrow/formats/geoarrow) is not a separate file format. It defines geospatial conventions for Arrow extension metadata and geometry column layout.
