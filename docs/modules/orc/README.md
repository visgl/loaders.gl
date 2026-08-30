---
title: Apache ORC
description: Read and write ORC files with a portable table scan surface.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {CrossFormatScanEngineGraphic} from '@site/src/components/docs/cross-format-scan-engine-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {OrcCloudLiveExample} from '@site/src/components/docs/orc-cloud-live-example';
import apacheLogo from '../../images/logos/apache-logo.png';

<DocPageHeader
  eyebrow="ORC module"
  title="@loaders.gl/orc"
  description="`@loaders.gl/orc` reads and writes Apache ORC files. Its source API exposes metadata and a portable scan contract while keeping the current materialized execution model explicit."
  tone="yellow"
  logos={[{alt: 'Apache Software Foundation', src: apacheLogo}]}
  meta={['Apache ORC', 'Read and write', 'Arrow tables']}
  links={[
    {label: 'ORC format', to: '/docs/modules/orc/formats/orc'},
    {label: 'ORC scan', to: '/docs/modules/orc#scan-support'},
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'}
  ]}
/>

<OrcCloudLiveExample />

<CrossFormatScanEngineGraphic />

<DocOrientation
  eyebrow="The ORC path"
  title="Discover the footer. Decode the file. Apply the query."
  description="ORC source metadata supports portable query planning, while the current implementation materializes the file before residual filtering and projection. That boundary is documented rather than implied as pushdown."
  tone="yellow"
  items={[
    {label: 'Input', value: 'ORC file URL, Blob, or loaded data'},
    {label: 'Discover', value: 'Footer metadata, schema, and row count'},
    {label: 'Query', value: 'Projection, predicate, and limit'},
    {label: 'Output', value: 'Arrow batches or materialized Arrow table'}
  ]}
/>

<ReferenceBoundary
  title="ORC scan and writer details"
  description="The reference below covers installation, current scan behavior, query methods, supported capabilities, and the distinction from physical stripe pushdown."
  tone="yellow"
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
  <a href="/docs/developer-guide/common-scan-architecture">
    <img src="https://img.shields.io/badge/Scan-Supported-2f855a.svg?style=flat-square" alt="Scan supported" />
  </a>
</p>

The `@loaders.gl/orc` module reads and writes Apache ORC files. `ORCSourceLoader` adds a portable
table scan over a URL or `Blob` and returns Arrow data.

## Installation

```bash
npm install @loaders.gl/core @loaders.gl/orc apache-arrow
```

## Scan support

The current source is a correct materialized scan. It reads ORC footer metadata for discovery, then
decodes the complete file before applying the portable query. It does not claim stripe or row-index
pushdown.

| Capability | Support | Execution |
| --- | --- | --- |
| Entry point | `read()` or `query()` | Arrow batch or materialized Arrow table |
| Schema and row-count discovery | Supported | ORC footer metadata |
| Predicate | Supported | Residual after decoding |
| Projection | Supported | Residual |
| Global limit | Supported | Residual after filtering |
| Streaming and cooperative cancellation | Not advertised | Complete-file execution |
| Stripe, row-index, or range pruning | Not implemented | No pushdown claim is made |

```ts
import {createDataSource} from '@loaders.gl/core';
import {ORCSourceLoader} from '@loaders.gl/orc';
import {parseSQLPredicate} from '@loaders.gl/scan';

const source = createDataSource('events.orc', [ORCSourceLoader]);
const metadata = await source.getQueryMetadata();

for await (const batch of source.read({
  predicate: parseSQLPredicate("status = 'active'"),
  columns: ['id', 'status'],
  limit: 100
})) {
  console.log(batch.data);
}
```

Use Parquet when physical column and row-group pruning is a hard requirement. ORC remains useful
when format compatibility matters and materializing the selected file is acceptable.
