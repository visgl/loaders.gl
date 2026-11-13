# Query capabilities and gradual scan migration

## Goals

Make query capabilities discoverable without confusing format possibilities with source guarantees.
Support exact CAST and offset/limit pushdown while retaining portable Arrow execution whenever a
source cannot preserve semantics. Introduce query terminology incrementally without breaking
existing scan imports or duplicating runtime registries.

## Names and ownership

| API | Owner | Meaning |
| --- | --- | --- |
| `TableQueryCapabilities` | Lightweight core contracts | Full table execution contract: projection, predicate, cast, offset, limit, residual execution, streaming, and cancellation. |
| `queryCapabilities` | Source query metadata | Effective capabilities for this source instance and configuration. Table capabilities remain under `.table`; raster and spatial capabilities retain their separate fields. |
| `queryPushdownCapabilityHints` | `Format` descriptor | Optional static pushdown-only hints. Missing fields mean unknown; hints never authorize execution. |
| `planQueryPushdown()` | Optional source method | Per-query negotiation of exact semantics, returning a lazy physical plan or `null`. |

Contracts stay in `core/loader-utils`. Format metadata imports types only and remains independent
of Arrow execution and the optional query runtime. The core root exports neither query nor scan.

`projection`, `predicate`, `cast`, `offset`, and `limit` use the same names across declarations.
Format hints are optional booleans. Effective operator support retains `unsupported`, `residual`,
`pushdown`, and `pushdown+residual`. Missing new source capability fields mean no authorization to
push down that operation, preserving existing source implementations.

`pushdown+residual` means the source's read contract finishes exact evaluation itself, potentially
after pruning. It must not return false positives for the parent to silently accept. A source that
only prunes and needs its parent to evaluate the predicate cannot advertise exact predicate
pushdown under this contract.

## Query planning and CAST

1. Resolve the source and obtain effective metadata. Prefer `queryCapabilities`, falling back to
   the legacy `capabilities` field for existing adapters.
2. Validate the portable query and compile its expected output schema before source execution.
   Retain source columns needed by residual predicates and computed projections.
3. Use source capabilities as a ceiling for negotiation. A CAST capability alone does not imply
   support for every conversion, null policy, overflow behavior, or expression.
4. Offer eligible queries to `planQueryPushdown(query, {signal})`. FROM has already been resolved.
   Planning must not read result rows. Return `null` for unsupported semantics.
5. An accepted plan provides an exact output schema and a lazy `read({signal})` iterator. The first
   implementation uses **all-or-nothing acceptance**: the source owns projection, predicates,
   casts, offset, and limit together. This avoids pretending that arbitrary operators commute.
6. Validate accepted schemas against the portable output schema, including each returned batch.
   Preserve cancellation, consumer-return cleanup, completion callbacks, and typed empty results.
   Do not execute a plan for `limit: 0`.
7. When negotiation is absent or declines, retain the existing portable Arrow CAST execution and
   simple capability-based physical reads. Never remove residual work based on format hints.

Input decode schemas (for example `csv.schema`) remain separate from query CAST semantics. A decode
schema must not silently become an output CAST pushdown. No existing format is granted blanket CAST
pushdown merely because it can decode typed columns. Native adapters can opt in only after matching
portable conversion semantics and supplying the exact-query planning hook.

Partial projection negotiation lets adapters identify computed SELECT items with exact results and
no row-dependent errors. Core builds the native SELECT list and the remaining Arrow projection.
The adapter still has to accept the rewritten query, including the original filter and row window,
before core can use its output. Splitting predicates or other operators remains follow-up work.

## Offset and limit

The logical order is filtering, offset, and limit, with output expressions handled according to the
portable executor's semantics. Both offset and limit are non-negative safe integers.

- Delegate offset only when no residual filter remains and the source advertises offset pushdown.
  Remove the parent offset in that case so rows are skipped exactly once.
- When offset is delegated, the source limit is the requested result limit.
- Otherwise a limit-capable source may receive `offset + limit`, with the parent applying offset.
  Withhold the optimization if the sum is not a safe integer.
- Withhold both row-window pushdowns when a residual predicate, expression filter, or CAST filter
  could change which rows survive.
- Preserve zero-limit schema delivery without starting a data iterator and close iterators promptly
  on early termination or cancellation.
- CSV, NDJSON, and Arrow stream sources already use the common row-window executor; explicitly
  declare their source-side offset support. This avoids transferring skipped rows, but does not
  imply random access or avoiding decoding preceding rows.
- Keep offsets and limits in query/source execution. Do not restore `core.limit` or `core._limitMB`.

Federated sources keep global offsets/limits at their owning query boundary unless a planner can
prove a child window is safe. Never send the same global offset independently to every child.

## Gradual migration

1. Add `@loaders.gl/core/query` and matching focused subpaths as export aliases of the existing
   implementation. ESM and CommonJS aliases must share module identity and registries.
2. Add `TableQuerySource`, `TableQueryReadOptions`, `QueryMetadata`, `QueryMetadataOptions`,
   `QueryCapabilities`, `CreateQueryMetadataOptions`, and `createQueryMetadata`.
3. Metadata factories expose `queryCapabilities` and the legacy `capabilities` as the same immutable
   object. The new factory accepts `queryCapabilities`. Existing factories and manually constructed
   legacy metadata remain accepted.
4. Use query names in new documentation and APIs. Retain existing scan imports, classes, methods,
   and metadata fields during adoption. Do not mass-rename physical scan implementation files.
5. Keep scan terminology for physical tasks, range reads, row groups, tile traversal, and telemetry
   about scans. Query describes the public request and planning contract.
6. After downstream adoption, evaluate deprecations separately. Removal requires explicit migration
   guidance and a release decision; aliases do not establish an automatic removal deadline.

## Implementation and validation

The initial implementation contains declarations and metadata aliases, query package aliases,
capability-gated exact-query negotiation, native offset delegation, format hints for CSV and
Parquet, and source offset declarations for CSV, NDJSON, and Arrow.

Validate these behaviors with small deterministic Chromium fixtures:

- Accepted CAST projections and CAST predicates agree with portable results and schemas.
- Declined or unsupported casts retain residual execution and prevent unsafe row windows.
- Offset with and without native support, offset without limit, zero limits, and unsafe sums.
- Exact-query schema mismatch, per-batch schema drift, and rows exceeding an accepted limit.
- Cancellation during planning/execution and consumer return close physical iterators and emit
  exactly one completion callback.
- Query/scan import identity, canonical/legacy metadata compatibility, and lightweight format
  metadata imports.

Run the repository build, worker build, Node and Chromium suites, test audit, formatting, and CI
coverage gates. Do not lower coverage thresholds or disguise untested paths with exclusions.
