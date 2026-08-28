# @loaders.gl/orc

<p class="badges">
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
