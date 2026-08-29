---
title: Apache ORC format
description: A typed columnar file format organized into stripes, streams, and footer metadata.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {OrcCloudLiveExample} from '@site/src/components/docs/orc-cloud-live-example';

<DocPageHeader
  eyebrow="Columnar file format"
  title="Read typed columns from a striped file."
  description="Apache ORC stores a schema, encoded column streams, and statistics in a compact file layout. Its footer makes the structure discoverable before the data is materialized."
  tone="violet"
  meta={['Apache ORC', 'Columnar stripes', 'Arrow output']}
  links={[
    {label: 'ORC module', to: '/docs/modules/orc'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<DocOrientation
  eyebrow="The ORC layout"
  title="Footer first. Stripes and streams after."
  description="The current loaders.gl source uses ORC metadata for discovery and returns correct Arrow data. The physical layout also explains where future selective reads can be added."
  tone="violet"
  items={[
    {label: 'Footer', value: 'Schema, encodings, streams, and statistics'},
    {label: 'Stripes', value: 'Independent groups of rows and column data'},
    {label: 'Streams', value: 'Encoded values, indexes, and dictionaries'},
    {label: 'Output', value: 'Arrow tables with portable scan semantics'}
  ]}
/>

<OrcCloudLiveExample />

<p className="badges">
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

- _[`@loaders.gl/orc`](/docs/modules/orc)_
- _[Apache ORC](https://orc.apache.org/)_

Apache ORC is a typed, column-oriented storage format. Files organize rows into stripes and keep a
schema, encodings, stream locations, and statistics in their footer and stripe metadata.

<ReferenceBoundary
  title="ORC layout and scan support"
  description="The sections below explain the physical format and make the current materialized-scan boundary explicit."
  tone="violet"
/>

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
