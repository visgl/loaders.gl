# Apache ORC

<p class="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/orc`](/docs/modules/orc)_
- _[Apache ORC](https://orc.apache.org/)_

Apache ORC is a typed, column-oriented storage format. Files organize rows into stripes and keep a
schema, encodings, stream locations, and statistics in their footer and stripe metadata.

## Format characteristics

| Characteristic | ORC |
| --- | --- |
| Layout | Column-oriented stripes containing encoded streams |
| Schema | Stored in the file footer |
| Compression | Per-stream codecs described by the postscript |
| Selective-reading opportunities | Stripes, row indexes, Bloom filters, and column streams |
| loaders.gl result | Arrow table data |

## Scan support

`ORCSource` currently provides a materialized common scan. Footer metadata drives discovery, while
the data path decodes the complete file and applies predicates, projection, and limit residually.

| Scan feature | Support |
| --- | --- |
| Entry point | `read()` or `query()` |
| Schema discovery | Supported |
| Predicate, projection, and global limit | Supported, residual |
| Arrow output | Supported |
| Streaming and cooperative cancellation | Not advertised |
| Stripe, row-index, Bloom-filter, or range pushdown | Not implemented |

The green badge means the query executes correctly. It does not claim the physical pruning features
that the ORC format can theoretically support.
