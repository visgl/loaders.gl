---
title: loaders.gl roadmap
description: Follow the project’s direction across binary data, cloud-native sources, services, and format support.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Project direction"
  title="A roadmap organized around data movement."
  description="loaders.gl is evolving toward compact binary representations, cloud-native reads, explicit source contracts, and deeper standards support. This page records the direction and the work still under discussion."
  tone="cyan"
  meta={['Binary data', 'Cloud-native sources', 'Standards fidelity']}
  links={[
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Common scan architecture', to: '/docs/developer-guide/common-scan-architecture'},
    {label: 'What’s new', to: '/docs/whats-new'}
  ]}
/>

<DocOrientation
  eyebrow="The current direction"
  title="Move less data, preserve more meaning, and keep the seams explicit."
  description="The roadmap groups work by the boundary it improves: representation, source access, service interoperability, and application control. Statuses are directional rather than release promises."
  tone="cyan"
  items={[
    {label: 'Representation', value: 'Arrow and GeoArrow for compact typed data'},
    {label: 'Access', value: 'Ranges, scans, tiles, and cloud-native datasets'},
    {label: 'Services', value: 'Protocol-aware sources with useful normalized output'},
    {label: 'Control', value: 'Explicit shapes, cancellation, auth, and lifecycle'}
  ]}
/>

<ReferenceBoundary
  title="Roadmap details"
  description="The sections below record v5 direction, per-module work, and the service roadmap with current status and open trade-offs."
  tone="cyan"
/>

# Roadmap

loaders.gl is developed under open governance by multiple contributors working with their own priorities. This page aims to give information about upcoming releases and directions.

## v5.0

loaders.gl v4.4 will focus on cloud-native, binary data.
A number of modules will expose "ArrowLoaders" will return binary data in the Apache Arrow and Apache GeoArrow formats.

While no loader support has been removed, the flavor of the loaders.gl framework is changing.

**Apache Arrow as a core format**

- Many new loaders now return binary data in the Apache Arrow format.
- This aligns with parallel efforts in companion libraries like deck.gl (as well as the ecosystem at large) to work with zero-copy, compact binary data instead of bloated, deserialized javascript data structures.
- Binary columnar data brings in an order of magnitude better memory usage and improved load/processing performance on big datasets.
- The Apache Arrow JS library is now a central dependency of loaders.gl.

**Improved `DataSource` APIs**

- The `Source` and `DataSource` APIs have matured and are now easier to work with.
- Consult the upgrade guide for migration details.

### Per-module changes

- **`@loaders.gl/csv`**
  - `CSVLoader` - Supports Apache Arrow table output through `csv.shape: 'arrow-table'`.

- **`@loaders.gl/parquet`**
  - `ParquetLoader` can return Apache Arrow tables with `parquet.shape: 'arrow-table'` and leverages the high-performance `parquet-wasm` library.
  - The v4 Parquet loader is still available as `ParquetJSONLoader`

- **`@loaders.gl/schema-utils`**
  - New module for working with and converting Apache Arrow data.

- **`@loaders.gl/gis`**
  - Now provides support for working Apache GeoArrow data.


- **Cloud native** (raster/data): `GeoTIFFLoader`, `ZarrLoader`, kerchunk, NetCDF4, ...
- **Cloud native** (point clouds): `COPCService`, `POTreeV2Service`...
- Unbundled loaders (load non-worker loaders as separate bundle, similar to how workers are loaded today).
- More comprehensive support for `options.shape` to control the output format of loaders.

**Single output format per loader**

- The `shape` option that was introduced in loaders.gl v3 to allow loaders to return different data formats is now deprecated and will be removed in many places.
- Instead, applications can use utilities in the `@loaders.gl/schema-utils` and `@loaders.gl/gis` modules to convert for Apache Arrow and Apache GeoArrow to more traditional (but less efficient) JavaScript formats.

## Geospatial service roadmap

The service roadmap favors protocol depth and useful normalized outputs over a large universal
abstraction. Costs are relative engineering estimates; impact describes the user-facing result.

| Tranche | Scope | Status | Cost | Impact |
| --- | --- | --- | --- | --- |
| 1 | Dedicated `@loaders.gl/arcgis` source module and `@loaders.gl/services` provider helpers | Complete | M | Separate ArcGIS source ownership from provider credentials |
| 2 | ArcGIS FeatureServer vector source and normalized Arrow/GeoJSON output | Complete | M | Production vector-service ingestion |
| 3 | ArcGIS ImageServer imagery and analytical LERC output | Complete | M | Analysis-ready raster services |
| 4 | ArcGIS MapServer and VectorTileServer tile sources | Complete | M | Cached, dynamic, and vector tile access |
| 5 | WFS request normalization and GeoJSON/GML response handling | Complete | M | Reliable OGC feature-service access |
| 6 | High-volume SAX GML parsing and streaming WFS batches | Complete | L | Large WFS responses without whole-document buffering |
| 7 | WMTS matrix sets and ArcGIS tile-grid negotiation | Partial | L | Capability-driven grid selection and tile requests are implemented; arbitrary-grid rendering remains |
| 8 | CRS normalization, axis order, reprojection-aware requests, and edge cases | Partial | XL | Common aliases and wire-axis rules are implemented; coordinate transformation and global edge cases remain |
| 9 | Shared service lifecycle for retries, cancellation, caching, auth, and telemetry | Supported subset | XL | Optional `ServiceRuntime` supplies request policy and source reuse; persistent HTTP caching is application controlled |
| 10 | Deep GML/WFS conformance, paging, filtering, schema-aware properties, and fixtures | Partial | XL | Streaming GML, bounded paging, and type hints are implemented; schema discovery and portable filter translation remain |
| 11 | Capability-driven source configuration and endpoint negotiation | Partial | L | WMTS layer/style/format/grid/dimension defaults and query bindings are implemented; broader schema and endpoint negotiation remain |
| 12 | Analytical raster preservation: NoData, bands, statistics, and rendering rules | Complete | L | Faithful scientific imagery workflows |
| 13 | ArcGIS capability graph and requirement-based service selection | Supported subset | M | Discover related endpoints and rank supplied capabilities; full automatic enrichment and negotiation are not implied |

Implemented subsets are described on the format pages; these statuses do not claim every optional
standards conformance class. The remaining work below replaces the earlier blanket recommendation
to implement tranches 7–11. Keep the optional runtime small and protocol APIs explicit.

### Delivered GIS capabilities

The recent GIS work establishes a source and analysis baseline independent of rendered picking:

| Capability | Implementation and boundary |
| --- | --- |
| Capability-driven WMTS configuration | Layer, linked matrix set, CRS compatibility, style, format, native matrix IDs, axis-normalized origin, and known-unit resolutions; see [WMTS support](/docs/modules/wms/formats/wmts) |
| Local spatial queries beyond picking | ID lookup, bounds candidates, exact point/rectangle intersection, and nearest-geometry snapping over loaded GeoArrow rows; planar XY, immutable buffers, no geodesic/topology engine |
| Managed extent loading | Coverage subtraction, shared requests, independent caller cancellation, explicit invalidation, bounded retention, and stable-ID deduplication; only verified complete responses establish reusable coverage |
| Common relational scan/query integration | `VectorFeatureTableScanSource` adapts Arrow-capable vector sources; predicates, projection, ordering, aggregates, and limits execute locally over one materialized request |
| WFS and OGC API Features pagination | Opt-in bounded collection plus progressive page APIs; next-link safety and cancellation; unknown/truncated totals remain uncertified |
| WMTS coverage limits and dimensions | Per-layer matrix limits, matrix dimensions, skipped unavailable tiles, authoritative request fields, advertised defaults, and lexical dimension values |
| WMTS feature information | REST/KVP query discovery, explicit tile/pixel queries, per-level pixel bounds, native JSON or text, HTTP/OWS errors, and cancellation; no implicit screen-coordinate conversion or unified feature schema |

See the [spatial-query guide](/docs/developer-guide/spatial-queries), [WFS feature table](/docs/modules/wms/formats/wfs),
and [OGC API Features feature table](/docs/modules/wms/services/ogc-api#ogc-api-features) for the actual
APIs and limitations. WMTS feature information is implemented in [PR #4087](https://github.com/visgl/loaders.gl/pull/4087);
implementation status is distinct from availability in a published release.

### Remaining SOTA work tranches

“SOTA” describes the engineering target, not a measured claim of superiority or a promise of full
OpenLayers parity. Protocol parsing belongs in loaders.gl; renderer tile selection and visual
reprojection belong in deck.gl. Rich table processing belongs in `@loaders.gl/geoarrow`, while
`@loaders.gl/gis` remains the minimal geometry helper layer for loaders.

The order below prioritizes the remaining source/rendering gap, then scalable query execution.
Each tranche needs its own bounded API, hermetic boundary tests, and documented unsupported cases.

| Priority | Tranche and current gap | Owner | Completion evidence |
| --- | --- | --- | --- |
| 1 | Arbitrary tile grids and raster reprojection: first-level normalized origin/tile size and standard XYZ rendering currently limit heterogeneous matrices | loaders.gl metadata; deck.gl rendering | Retain per-level origins, tile sizes, matrix bounds, and supported unit resolutions; render a non-XYZ geographic/projected grid correctly; explicitly test antimeridian and polar coverage |
| 2 | Portable service predicate pushdown: relational filters currently run locally; WFS accepts caller-authored FES, OGC API does not translate CQL2 | `@loaders.gl/wms` and `@loaders.gl/scan` | Translate an advertised supported subset, report pushdown versus residual execution in `explain()`, preserve results with safe local fallback, and verify reduced requests/bytes |
| 3 | Schema and queryables discovery: WFS `getSchema()` and OGC API Features schema currently lack automatic service schema negotiation | `@loaders.gl/wms` | Negotiate `DescribeFeatureType`/queryables, preserve typed/null/geometry/CRS metadata, reconcile heterogeneous pages, and expose unsupported schema constructs explicitly |
| 4 | Progressive bounded-memory scans: pages and GML batches exist, but the common vector scan adapter materializes a whole bound result | `@loaders.gl/wms` and `@loaders.gl/scan` | Stream GeoJSON/GML into Arrow batches with backpressure, cancellation, and a measured memory bound; plan blocking sorts/aggregates separately; never certify incomplete extent coverage |
| 5 | Spatial-index scale and updates: the immutable minimum-X index can visit every row in the worst case | `@loaders.gl/geoarrow` | Benchmark representative points/lines/polygons, pruning, memory, and build costs; add a packed tree or another measured improvement plus explicit rebuild/update semantics without losing deterministic results |
| 6 | Global spatial semantics and robust topology: local queries are planar XY with ordinary floating-point predicates | `@loaders.gl/geoarrow` and projection utilities | Define CRS/unit-aware distance, antimeridian handling, tolerance and precision policy; add independently validated edge cases before claiming geodesic or arbitrary geometry-predicate support |
| 7 | Feature-info interoperability and coordinate helpers: WMTS callers supply tile/I/J and responses retain service-native schemas | loaders.gl service adapters; deck.gl interaction | Derive tile/pixel indices from source-grid coordinates, connect screen interactions through renderer transforms, and offer optional typed JSON/GML normalization while preserving the raw-response path |
| 8 | Temporal/elevation dimension semantics: advertised values and defaults are preserved but not interpreted or validated | `@loaders.gl/wms` | Support explicitly defined interval/value validation and nearest-time selection with documented calendar, timezone, current-value, and boundary policies; avoid silent substitutions |
| 9 | Operational and standards hardening: runtime policy exists; persistent caching and blanket optional conformance do not | Service adapters and application fetch layer | Validate cache freshness, retry/cancellation/auth boundaries and complete multi-provider reports; add targeted optional conformance classes with fixtures and published limitations |

WFS-T transactions, locks, mutable feature-store events, WMTS SOAP, and every optional OGC API
conformance class remain unimplemented extensions rather than prerequisites for read-only
source/analysis quality. Add them only with a concrete consumer requirement. A universal feature
store or a second opaque lifecycle framework is not the goal of these tranches.
