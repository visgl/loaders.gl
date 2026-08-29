---
title: '@loaders.gl/scan'
description: A portable query runtime for bounded, selective reads across local and cloud data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Module overview"
  title="@loaders.gl/scan"
  description="Describe the rows, columns, bounds, and limits you need once, then let each source plan the most useful reads it can perform."
  tone="violet"
  meta={['Arrow results', 'Range-aware sources', 'Portable query contract']}
  links={[
    {label: 'Scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'Get started', to: '/docs/developer-guide/get-started'}
  ]}
/>

<p className="badges">
  <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From v5.0" />
</p>

<DocOrientation
  eyebrow="The scan module"
  title="Describe the work. Let the source plan the reads."
  description="The scan runtime keeps query intent separate from the storage format, so an application can ask for columns, predicates, bounds, and limits while each source reports what it can execute."
  tone="violet"
  items={[
    {label: 'Intent', value: 'Columns, predicates, bounds, limits, and ordering'},
    {label: 'Planning', value: 'Source metadata distinguishes pushdown from residual work'},
    {label: 'Execution', value: 'Arrow tables, addressed tiles, or bounded feature requests'},
    {label: 'Federation', value: 'Ordered append with schema reconciliation and provenance'}
  ]}
/>

`@loaders.gl/scan` is the optional application-facing runtime for portable queries. It collects the
reference Arrow executor, query parsing, source-neutral query metadata, ordered append federation,
and adapters that expose an already-addressed vector result as a table.

Format packages do not depend on this runtime. They implement lightweight contracts from
`@loaders.gl/loader-utils`, so applications that only load or decode a format do not pay the scan
runtime bundle cost.

See the [common scan architecture](/docs/developer-guide/common-scan-architecture) for the complete
support matrix and execution semantics.

<ReferenceBoundary
  title="Scan APIs and execution semantics"
  description="The reference below covers installation, table execution, source metadata, federation, vector views, cancellation, and backend registration."
  tone="violet"
/>

## Installation

```bash
npm install @loaders.gl/scan apache-arrow
```

## Query an Arrow table

Arrow is the built-in reference backend. `createScanEngine()` is asynchronous so an application can
register another backend lazily without changing its calling code.

```ts
import {createScanEngine, parseSQLPredicate} from '@loaders.gl/scan';

const engine = await createScanEngine();
const result = engine.query(table, {
  predicate: parseSQLPredicate("status = 'active'"),
  columns: ['id', 'status'],
  limit: 100
});
```

The query is immutable and follows `filter -> project -> limit` semantics. Predicate columns do not
need to appear in the result projection, and a limit counts only rows that survive filtering.

## Discover source controls

Scan-aware sources expose metadata before execution. This is the contract used by the shared
documentation query panel.

```ts
const metadata = await source.getQueryMetadata();

console.log(metadata.execution); // supported method, or a concrete unsupported reason
console.log(metadata.columns); // fields available to projection and predicates
console.log(metadata.capabilities); // pushdown, residual, or unsupported operators
```

Applications should use `metadata.execution`, not the existence of a method with a familiar name,
to decide whether Apply is enabled. Capability metadata distinguishes correct residual execution
from physical pushdown.

## Runtime surfaces

| API | Use it for | Result |
| --- | --- | --- |
| `createScanEngine()` | Query one in-memory Arrow table | Materialized Arrow table |
| `registerScanBackend()` | Register an application-owned lazy backend | No eager backend import |
| `FederatedTableScanSource` | Append managed table sources in stable order | Arrow batches with provenance |
| `VectorTileTableScanSource` | Query one already-addressed MVT or vector PMTiles tile | One Arrow feature batch |
| `VectorFeatureTableScanSource` | Query one already-bounded WFS or ArcGIS feature request | One Arrow feature batch |
| Query and metadata types | Build source-neutral controls | Serializable query state |

## Ordered append federation

`FederatedTableScanSource` resolves child sources through the existing `DataSourceManager`. It is an
ordered `UNION ALL`, not a distributed database.

| Behavior | Contract |
| --- | --- |
| Source order | Result rows preserve the caller's source list order |
| Source-local query | Runs before schema reconciliation |
| `strict` schema policy | Requires identical mapped fields and portable types |
| `union` schema policy | Uses first-seen column order and typed nulls for missing fields |
| Column mapping | Explicitly renames source fields into the federated namespace |
| Global query and limit | Run after reconciliation across the complete append |
| Early termination | Closes the active child and does not open later sources |
| Provenance | Every batch reports source id, source index, and child batch index |
| Cancellation | Covers deferred source resolution and child iteration |

Parallel scheduling, implicit type coercion, optimizer-selected source order, and managed
multi-source joins are intentionally outside this API.

## Vector table views

Tiles and feature services retain their specialized addressing APIs. An adapter can bind one tile
or one bounded service request, require Arrow output, and expose the resolved feature table to the
portable relational executor.

This boundary is deliberate:

- z/x/y, tile layers, service layers, bounds, and output CRS remain source parameters;
- predicates, projection, expressions, ordering, aggregates, and limits apply to the resolved rows;
- cross-tile planning and server-side filter translation are not implied by the adapter.

The format page uses a blue **Scan table view** badge for this narrower participation mode rather
than the green **Scan supported** badge used by sources with a native common scan entry point.

## Bundle-size boundary

- Import a format package alone for ordinary loader and source APIs.
- Import `@loaders.gl/scan` only when the application needs the reference executor, shared query
  parser, federation, or vector table-view adapters.
- Register optional backends with a loader function so their implementation can remain in a
  separate dynamic chunk.
- UI components remain in the website/application layer and are not runtime dependencies.
