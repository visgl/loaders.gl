# GeoArrow Supremacy Roadmap

This roadmap extends the first twenty GeoArrow tranches with the work needed to make
GeoArrow a durable columnar geometry contract rather than a collection of converters.
Each tranche has an independently reviewable artifact and an exit gate. The sequence is
deliberately aggressive, but no tranche should weaken the package boundaries or the
zero-copy and bounded-memory guarantees.

## Invariants

- `@loaders.gl/schema` owns serializable wire contracts only.
- `@loaders.gl/gis` remains the small loader-facing WKB/WKT utility layer.
- `@loaders.gl/geoarrow` owns native layouts, conversion, validation, metadata, bounds,
  iteration, and transfer.
- `@loaders.gl/scan` may depend on GeoArrow and owns spatial execution.
- `@loaders.gl/parquet` owns GeoParquet and does not depend on GeoArrow.
- WKB is an ingress, egress, persistence, and interchange format; native GeoArrow is the
  compute format; dense union is the stable mixed-type fallback.
- No feature is complete without Arrow JS, Arrow IPC, Parquet, worker, and browser coverage
  where that surface applies.

## Tranches 21-40

### 21. Generated conformance laboratory

Generate fixtures and Vitest cases from one matrix covering every GeoArrow encoding, all
seven geometry families, boxes, XY/XYZ/XYM/XYZM, interleaved/separated coordinates, 32/64-bit
offsets, nulls, empties, chunk boundaries, and legal child names. Keep generated fixtures
small and deterministic; put scale, fuzz, and external interoperability in slow lanes.

**Exit:** every matrix cell has a named test, a fixture hash, and a clear unsupported reason
when the Arrow JS runtime cannot express it.

### 22. Physical layout oracle

Build a single layout oracle that answers whether an Arrow field is a point, list geometry,
box, WKB/WKT, dense union, or geometry collection. Validate child nullability, offset type,
coordinate precision, child order, union IDs, and view/large storage without decoding values.

**Exit:** malformed labels and malformed physical layouts produce stable diagnostics rather
than accidental acceptance or late converter failures.

### 23. Dimension and CRS semantics

Represent XY, XYZ, XYM, and XYZM as distinct semantic contracts. Preserve axis meaning when
transposing layouts, converting WKB/EWKB/ISO WKB, serializing metadata, or moving through
Parquet. Add CRS authority codes, PROJJSON, WKT2, SRID, null CRS, and unknown metadata
round trips.

**Exit:** an XYM column cannot silently become XYZ, and every conversion either preserves or
explicitly rejects its CRS and dimension semantics.

### 24. Zero-copy and transfer ABI

Define the buffer ownership ABI for identity conversions, sliced vectors, record batches,
workers, Arrow IPC, and Arrow C Data Interface adapters. Add transfer-list helpers that move
only owned buffers, retain shared buffers, and never detach caller-owned memory unexpectedly.

**Exit:** identity conversion shares buffers; worker round trips have no feature-object bridge;
  buffer identity and detached-buffer behavior are asserted in browser and Node tests.

### 25. Complete WKB/WKT codec kernel

Implement direct WKB and WKT readers and writers for all seven geometry families, EWKB SRID,
ISO dimensions, mixed endianness, empty coordinates, nested collections, large payloads, and
view-backed storage. Writers must support native-to-WKB without first creating GeoJSON.

**Exit:** WKB/WKT conversion is a typed buffer/state-machine operation with no per-feature
GeoJSON allocation in the hot path.

### 26. Native structural conversion kernel

Add direct native-to-native conversion for concrete encodings, including layout transposition,
offset-width widening/narrowing, single-to-multi promotion, and dimension-preserving copies.
Use coordinate visitors only as a correctness fallback; use buffer kernels for common paths.

**Exit:** homogeneous native conversions do not materialize geometry objects, and identity,
layout-only, and offset-only paths have measured allocation profiles.

### 27. Dense-union canonicalization

Define stable union child ordering and type-ID allocation independent of input batch order.
Canonicalize equivalent union schemas, validate sparse unions explicitly, compact child arrays,
and preserve nulls and child offsets. Support union-to-concrete conversion only when the
requested target can represent every child.

**Exit:** concatenating record batches cannot change the union schema or reinterpret a type ID.

### 28. GeometryCollection completeness

Implement nested collection children, collections containing collections, mixed dimensions,
empty collections, and collection-to-union/native/WKB paths. Add recursion depth limits and
resource accounting for hostile nesting.

**Exit:** collection round trips preserve order, nulls, empties, dimensions, and metadata with
bounded recursion and actionable malformed-input errors.

### 29. Box and covering plane

Make `geoarrow.box` a first-class native layout with canonical XY/XYZ/XYM/XYZM child order,
antimeridian-aware interval semantics, direct WKB/native bounds kernels, and conversions to
GeoParquet covering columns. Keep boxes distinct from geometry columns in table APIs.

**Exit:** box fields are recognized without being mistaken for separated coordinates, and
  bbox computation never requires GeoJSON materialization.

### 30. Loader output conformance

Audit every geospatial loader and Arrow IPC path. Geometry columns use `geoarrow.wkb` by
default unless the source already carries native GeoArrow; existing GeoJSON and binary return
values remain compatible. Add explicit geometry-column metadata and batch-preserving output
for JSON/GeoJSON, CSV, Shapefile, KML, WKT/WKB, MVT, FlatGeoBuf, GeoPackage, services, and
Arrow IPC.

**Exit:** a loader conformance report proves the lightweight dependency boundary and the same
metadata behavior across all supported geospatial loaders.

### 31. GeoParquet 1.0 and 1.1 matrix

Implement WKB and native separated encodings, multiple geometry columns, primary-column rules,
coverings, row-group statistics, orientation, CRS states, edges, epochs, and all dimensions.
Read legacy metadata defensively while writing canonical metadata.

**Exit:** versioned read/write fixtures round-trip with independent GeoParquet implementations
and preserve unknown metadata.

### 32. GeoParquet 2.0 and view storage

Add `GEOMETRY` and `GEOGRAPHY` logical types, native statistics, antimeridian bounds, binary
and string view storage, large offsets, and version negotiation. Keep experimental raster
metadata out of the vector contract.

**Exit:** writers reject impossible combinations early and readers expose a capability report
instead of silently degrading semantics.

### 33. Metadata and schema evolution

Create a metadata merge policy for concatenation, projection, joins, rechunking, and derived
columns. Preserve extension metadata and unknown keys, detect conflicts in CRS/dimensions/
geometry types, and provide explicit strict, permissive, and repair modes.

**Exit:** schema evolution is deterministic and conflict diagnostics identify both source
fields and the selected policy.

### 34. Scan logical plan

Define the spatial IR for predicates, measurements, reprojection, derived geometry, aggregate,
ordering, and joins. Plans record source pushdown, GeoParquet pruning, header inspection,
native conversion, residual execution, and optional engine stages.

**Exit:** `explain()` shows why a batch was decoded and proves each geometry column is converted
at most once per plan.

### 35. Vectorized predicate kernels

Implement bbox intersects/contains, envelope relations, point-in-box, coordinate validity,
and exact predicates over native arrays. Handle antimeridian boxes and null/empty behavior as
part of the predicate contract, not as caller conventions.

**Exit:** predicates operate on typed buffers, use concrete arrays for homogeneous batches, and
fall back to dense-union dispatch for mixed batches.

### 36. Measurements and reprojection

Add vectorized area, length, distance, centroid, bounds, coordinate transforms, geodesic edge
policies, and derived geometry columns. Cache transform state per plan and make precision and
CRS assumptions visible in the result schema.

**Exit:** repeated operations reuse native intermediates and every measurement identifies its
planar or geodesic interpretation.

### 37. Spatial joins and aggregation

Implement indexed bbox joins, exact residual joins, group-by spatial aggregates, nearest
neighbor, partition-aware ordering, and streaming spill behavior. Preserve source row identity
and support multiple geometry columns.

**Exit:** joins expose candidate and residual counts, never duplicate rows unexpectedly, and
have deterministic results across batch sizes.

### 38. Pushdown and partition pruning

Integrate GeoParquet statistics, coverings, row-group/page indexes, WKB header inspection,
partition extents, and predicate simplification. Allow loaders and services to advertise
source-native spatial filters without coupling them to Scan internals.

**Exit:** explain plans show rejected row groups and pushdown selectivity; correctness tests
prove pruning is conservative.

### 39. Lazy topology engine

Add `@loaders.gl/scan/spatial-wasm` as an optional, lazily loaded GeoArrow Rust/WASM backend
for validity repair, buffering, simplification, convex hull, overlays, topological predicates,
and large joins. Exchange Arrow buffers through FFI and retain native intermediates across
chained operations.

**Exit:** importing Scan or GeoArrow never imports WASM; first use is explicit, cancellable,
worker-capable, and reports engine/version/precision metadata.

### 40. GPU, observability, and release gates

Add direct deck.gl extraction, triangulation handoff, GPU buffer descriptors, transfer-aware
worker scheduling, allocation counters, kernel traces, bundle reports, fuzz corpora, and
interoperability CI. Track WKB, concrete native, union, box, Scan, and WASM paths separately.

**Exit:** release gates enforce zero-copy identity, no coordinate inspection for identity,
bounded peak memory, two-times bridge improvement on representative data, no more than ten
percent regression, and root-import exclusion of Scan/WASM/topology/rendering code.

## Operating model

Every tranche lands with focused fast tests, a slow or external test when scale or
interoperability matters, a benchmark delta, and documentation for any public behavior. A
tranche may be split internally, but its exit gate must remain intact. The roadmap is complete
only when the conformance ledger, package dependency graph, public API inventory, benchmarks,
and interoperability matrix all agree.

## Tranches 41-60: SOTA overkill

### 41. Arrow C Data Interface bridge

Expose import and export adapters for Arrow C Data and C Stream Interface capsules. Keep native
buffers borrowed where ownership permits, attach release callbacks exactly once, and expose
schema and buffer addresses in diagnostics.

**Exit:** Rust, Python, and JavaScript round trips preserve type IDs, offsets, null bitmaps,
dimensions, and ownership without a serialization copy.

### 42. Streaming geometry state machine

Build incremental WKB/WKT and GeoArrow batch decoders that can pause at any byte or record-batch
boundary. Add bounded staging buffers, backpressure, cancellation, and stable union schemas for
unknown streams.

**Exit:** arbitrarily chunked input produces the same table as contiguous input with a bounded
working set and no batch-local type renegotiation.

### 43. SIMD and kernel dispatch

Add runtime dispatch for scalar JavaScript, SIMD.js-compatible loops, WASM SIMD, and GPU-ready
buffer kernels. Select kernels from physical layout and dimensions, not from format names alone.

**Exit:** dispatch is observable, deterministic, feature-detected, and never changes numerical
semantics or null/empty behavior.

### 44. Memory ownership and arena allocation

Introduce pooled offset, coordinate, union, and validity-buffer allocators with lifecycle scopes
for conversions and Scan plans. Add spill thresholds and allocation sampling without retaining
source buffers accidentally.

**Exit:** peak memory is attributable by operator, pooled and unpooled results are byte-for-byte
equivalent, and cancellation releases all temporary buffers.

### 45. Differential implementation oracle

Run every fast conformance case against the JavaScript kernels, GeoArrow Rust, GDAL/OGR, and a
reference WKB implementation where available. Normalize only explicitly equivalent metadata.

**Exit:** every discrepancy is minimized to a fixture and classified as implementation,
specification, or interoperability behavior before release.

### 46. Property and mutation fuzzing

Generate valid and malformed nested geometries, offsets, validity masks, union IDs, dimensions,
CRS metadata, and sliced buffers. Mutate one invariant at a time and feed all decoders and
validators under resource limits.

**Exit:** fuzzing is deterministic from a seed, finds no unbounded recursion or allocation,
and every rejected input has a stable diagnostic category.

### 47. Query compiler and cost model

Compile Scan expressions into a typed operator graph with cost estimates for header inspection,
native conversion, predicate selectivity, cache reuse, and topology-engine calls. Permit
adaptive reordering only when null and error semantics remain stable.

**Exit:** explain output includes costs, chosen kernels, cache hits, and conservative alternatives
for every spatial plan.

### 48. Spatial indexes and persistent coverings

Add packed R-tree, Hilbert-sort, interval, and covering-index builders over GeoArrow bounds.
Persist index metadata beside GeoParquet row groups and support incremental append and rebuild.

**Exit:** indexed and unindexed plans return identical rows; candidate, residual, and false-positive
counts are exposed for every index operator.

### 49. Distributed and remote execution

Define serializable spatial plans for worker pools, Web Workers, Node workers, Arrow Flight, and
remote object stores. Push only metadata and predicate state until pruning proves a batch needed.

**Exit:** remote execution preserves plan semantics, cancellation, provenance, and bounded
transfer, with no accidental dependency on browser or Node globals.

### 50. Geodesic and edge-policy engine

Implement explicit planar, spherical, Vincenty, Thomas, Andoyer, and Karney policies for bounds,
length, area, distance, antimeridian handling, and densification. Store the selected policy in
result metadata.

**Exit:** a query cannot silently mix edge models, and numerical tolerances plus CRS assumptions
are part of the public result contract.

### 51. Three-dimensional and measure-aware analytics

Add Z and M-aware bounds, interpolation, profiles, nearest-point calculations, and derived
columns without treating measures as elevations. Preserve XYM and XYZM through native, union,
WKB, WKT, and Parquet paths.

**Exit:** operations declare whether Z/M are consumed, preserved, ignored, or rejected, and no
axis is reinterpreted by an implicit dimension cast.

### 52. Validity and repair policy

Define strict, report-only, and repair modes for invalid rings, self-intersections, duplicate
vertices, bad offsets, NaN coordinates, invalid CRS, and inconsistent geometry metadata.

**Exit:** repair is never implicit; every changed row carries an actionable diagnostic and a
reproducible repair code.

### 53. Security and hostile-input hardening

Threat-model WKB/WKT parsers, union dispatch, decompression, metadata JSON, WASM engines, worker
messages, and remote Scan plans. Add limits for depth, coordinates, bytes, rows, time, and
concurrent work.

**Exit:** limits are configurable per operation, enforced before allocation where possible, and
security tests cover denial-of-service and prototype-pollution classes.

### 54. Browser and worker residency

Make native columns first-class transferable or shared-worker resources with explicit lifetime,
cross-origin isolation requirements, and cancellation-aware kernels. Keep root imports free of
worker bootstraps and topology code.

**Exit:** browser, worker, and main-thread runs agree on results and transfer accounting, including
sliced and SharedArrayBuffer-backed vectors.

### 55. GPU geometry ABI

Define zero-copy or one-copy descriptors for positions, offsets, validity, union dispatch, and
per-feature bounds consumable by deck.gl, WebGPU, WebGL, and compute shaders. Keep triangulation
and rendering policy outside the GeoArrow contract.

**Exit:** representative native columns upload without row-object materialization, and GPU
descriptors identify alignment, stride, dimension, and ownership.

### 56. Versioned schema registry

Publish machine-readable GeoArrow and GeoParquet capability manifests, extension versions,
compatibility rules, migration recipes, and deprecation schedules. Generate TypeScript types,
validators, docs, and test matrices from the registry.

**Exit:** a schema can be negotiated before data transfer, and unsupported combinations fail with
the exact versioned rule that blocked them.

### 57. Reproducible benchmark laboratory

Track cold and warm throughput, allocations, peak RSS, transfer bytes, bundle size, worker
startup, and query selectivity across WKB, concrete native, union, box, Scan, and topology paths.

**Exit:** benchmark artifacts pin runtime, CPU features, fixtures, compiler flags, and statistical
confidence; regressions gate CI rather than relying on informal local measurements.

### 58. Cross-language generated bindings

Generate stable bindings and conformance fixtures for Rust, Python, C++, Java, and Go from the
same schema registry. Test Arrow C Data ownership, metadata, extension names, and large-offset
behavior in each language.

**Exit:** supported bindings consume the same canonical fixtures and publish their exact feature
matrix and version compatibility.

### 59. Production telemetry and provenance

Emit privacy-safe operator metrics, source and row-group provenance, conversion decisions,
kernel choices, CRS/edge policies, cache behavior, and repair diagnostics. Allow deterministic
replay from a plan plus fixture manifest.

**Exit:** a production result can be explained and replayed without logging geometry payloads or
changing query results because telemetry is enabled.

### 60. GeoArrow certification release

Ship a signed conformance report, dependency graph, API inventory, benchmark dossier, fuzz corpus
summary, interoperability matrix, migration guide, and incident response policy. Require all
previous exit gates before promoting GeoArrow from alpha to a supported framework tentpole.

**Exit:** a release is certified across browser, Node, workers, Arrow IPC, GeoParquet, Scan,
deck.gl handoff, and optional topology execution, with every exception documented and owned.

## Tranches 61-80: Frontier Supremacy

These tranches begin after certification. They are deliberately ambitious: each one must retain
the compact WKB interchange path, the aligned native compute path, stable Arrow semantics, and
the dependency boundaries above. None is a reason to weaken the release gates.

### 61. Zero-copy remote geometry

Add range-addressable GeoParquet and Arrow IPC readers that expose memory-mapped or remote-backed
native buffers without staging complete row groups. Coordinate, offset, validity, and union
buffers must advertise residency and lifetime.

**Exit:** selective scans avoid copying untouched geometry bytes and still pass the full ownership
and cancellation matrix.

### 62. Columnar geometry cache

Build a content-addressed cache for WKB headers, native conversions, bounds, and row-group
statistics. Cache keys include source identity, byte ranges, schema fingerprint, CRS, dimension,
edge model, and kernel version.

**Exit:** repeated plans reuse validated buffers without allowing stale metadata or incompatible
kernel versions to leak across results.

### 63. Adaptive execution feedback

Record observed selectivity, geometry sizes, conversion cost, cache hits, and kernel throughput in
the planner. Use bounded feedback to choose WKB inspection, native conversion, pruning, and
topology execution while preserving deterministic plans when requested.

**Exit:** adaptive choices improve representative workloads without changing result order,
precision policy, or reproducibility mode.

### 64. Hardware feature dispatch

Specialize coordinate scans, bounds, transforms, predicates, and offsets for SIMD.js, WASM SIMD,
WebGPU, and native CPU capabilities. Provide scalar fallbacks and runtime capability manifests.

**Exit:** every specialized kernel has a bit-for-bit or declared-tolerance oracle against the
scalar implementation.

### 65. GPU-resident Scan

Compile a restricted spatial expression subset to WebGPU compute passes over native GeoArrow
buffers. Keep transfer scheduling, device loss, synchronization, and fallback execution explicit.

**Exit:** GPU execution produces the same ordered logical result as CPU execution and never
silently uploads WKB as a substitute for native buffers.

### 66. Persistent spatial indexes

Define versioned packed R-tree, Hilbert R-tree, interval, and grid index columns for GeoParquet.
Support incremental updates, deletions, antimeridian-aware keys, and index validation.

**Exit:** index-assisted pruning is provably conservative and reports index version, coverage,
and fallback reasons in the plan.

### 67. Learned layout selection

Evaluate interleaved versus separated coordinates, 32 versus 64-bit offsets, and concrete versus
union encodings using dataset statistics and operation profiles. Permit policy-controlled layout
selection while retaining explicit overrides.

**Exit:** automatic layout selection is explainable, bounded by memory limits, and never changes
semantic dimension or null behavior.

### 68. Streaming backpressure protocol

Make GeoArrow conversion and Scan execution first-class async iterators with bounded arenas,
cooperative cancellation, partial-batch errors, and downstream demand propagation.

**Exit:** a slow consumer bounds resident memory independently of source size and cancellation
releases every owned buffer.

### 69. Cross-origin worker fabric

Support dedicated, shared, and service-worker execution with transferable, SharedArrayBuffer, and
remote worker transports. Define capability negotiation for COOP/COEP and worker-hosted WASM.

**Exit:** one plan can migrate execution contexts without changing schema fingerprints or result
semantics.

### 70. Geometry kernel ABI stability

Freeze a low-level descriptor ABI for coordinates, offsets, validity, unions, bounds, CRS, and
edge models. Version the ABI independently from TypeScript package releases.

**Exit:** Rust, WASM, JavaScript, GPU, and native bindings can exchange descriptors without
private Arrow object assumptions.

### 71. Formal metadata semantics

Model extension metadata, CRS states, epochs, orientation, edge algorithms, coverings, and
unknown keys as a versioned algebra. Define merge, conflict, inheritance, and downgrade rules.

**Exit:** metadata transformations are associative where promised, conflict diagnostics are
actionable, and no writer discards unknown keys silently.

### 72. Differential ecosystem harness

Run canonical cases against GeoArrow Rust, Apache Arrow implementations, GDAL/OGR, DuckDB,
GeoPandas, GeoParquet reference readers, and deck.gl adapters where available.

**Exit:** every discrepancy is classified as an implementation defect, specification ambiguity,
or documented interoperability exception with a pinned reproducer.

### 73. Geometry fuzzing at scale

Generate nested unions, malformed offsets, pathological rings, NaN payloads, extreme ordinates,
large dimensions, truncated buffers, metadata collisions, and adversarial recursion depths.

**Exit:** fuzzing runs continuously in a quarantined lane, finds no unbounded allocation or crash,
and minimizes every failure to a portable fixture.

### 74. Reproducible numerical policy

Define precision, NaN, signed-zero, tolerance, accumulation order, geodesic approximation, and
parallel reduction policies for every measurement and predicate.

**Exit:** CPU, GPU, worker, and WASM results meet the declared policy under repeated and reordered
execution.

### 75. Temporal and dynamic reference systems

Carry coordinate epochs, dynamic CRS transformations, vertical datums, compound CRS metadata,
and time-dependent coordinates without collapsing them into ordinary Z or M axes.

**Exit:** epoch-aware transformations round-trip metadata and reject missing or contradictory
temporal reference information.

### 76. Topology service isolation

Run expensive topology kernels in an isolated process or worker with quotas, deterministic
serialization, crash recovery, and explicit repair provenance. Keep the core package free of
topology dependencies.

**Exit:** a failed or hostile topology request cannot corrupt the host process or invalidate
resident native buffers.

### 77. Multi-tenant resource governance

Add quotas and admission control for bytes, rows, vertices, worker time, GPU memory, cache space,
and topology complexity. Expose fair scheduling and tenant-scoped telemetry.

**Exit:** resource exhaustion yields structured diagnostics and cannot starve unrelated plans.

### 78. Privacy-preserving geometry operations

Define redaction, quantization, secure bounds, and provenance policies for sensitive coordinates.
Ensure telemetry, caches, crash reports, and benchmark artifacts never require raw geometry.

**Exit:** privacy modes are explicit, testable, and do not accidentally weaken CRS, validity, or
ownership guarantees.

### 79. Long-term compatibility program

Maintain golden fixtures, schema migrations, ABI adapters, deprecation tooling, browser support
matrices, and downstream canary projects across multiple major release lines.

**Exit:** supported readers can consume every promised prior release, and every incompatibility
has an automated migration or a clearly versioned failure.

### 80. GeoArrow operating system

Make GeoArrow the framework-level substrate for ingestion, storage, Scan, rendering, analytics,
bindings, and observability. Publish an annual conformance, performance, security, and ecosystem
review with a new forward roadmap.

**Exit:** GeoArrow is not merely a converter: it is the stable columnar contract that lets every
loaders.gl subsystem and external engine exchange geometry at full fidelity and predictable cost.

## Tranches 81-100: Interoperability Supremacy

The operating-system tranche is the beginning of ecosystem-scale work, not the end. These
tranches make the contract independently verifiable, portable across runtimes, and capable of
serving very large or adversarial workloads without sacrificing compact interchange or native
compute performance.

### 81. Universal fixture authority

Publish content-addressed Arrow IPC and GeoParquet fixtures for every encoding, dimension,
layout, offset width, null pattern, empty form, union schema, CRS state, and metadata conflict.
Include expected hashes for buffers, schemas, metadata, bounds, and round trips.

**Exit:** every language binding and engine test references the same immutable fixture IDs rather
than maintaining silently divergent samples.

### 82. Contract compiler

Generate Arrow schemas, TypeScript declarations, validators, conversion dispatch tables, docs,
and benchmark cases from a versioned GeoArrow contract manifest. Reject drift between generated
artifacts and hand-written adapters in CI.

**Exit:** adding an encoding or semantic state requires one manifest change and produces a visible
reviewable matrix delta across all affected packages.

### 83. Flight and stream-native transport

Add Arrow Flight and Flight SQL adapters that negotiate GeoArrow extension metadata, preserve
record-batch boundaries, and apply projection, bounds, and dimension pushdown before transport.

**Exit:** remote streaming preserves schema fingerprints, cancellation, backpressure, and native
buffers without a GeoJSON compatibility hop.

### 84. Object-store transaction protocol

Define atomic GeoParquet dataset commits, manifest evolution, snapshot isolation, schema
compatibility checks, and concurrent writer conflict resolution for spatial tables.

**Exit:** readers never observe mixed geometry schemas or partially committed covering indexes.

### 85. Geospatial lakehouse statistics

Standardize partition, row-group, page, bloom, Hilbert, covering, and geometry-size statistics
with conservative null, wraparound, CRS, and antimeridian semantics.

**Exit:** Scan can explain every rejected fragment and prove that pruning cannot remove a valid
match under the declared coordinate reference system.

### 86. Column-level encryption and redaction

Support encrypted geometry, bounds, CRS, and provenance columns with key-scoped pushdown and
redaction. Keep metadata useful without exposing protected ordinates or exact extents.

**Exit:** unauthorized consumers receive structured capability failures, never plausible but
incorrect geometry or statistics.

### 87. Deterministic distributed execution

Partition native conversion, predicates, measurements, joins, and reductions across workers,
threads, and machines with stable row identities, reduction order policies, retries, and
duplicate suppression.

**Exit:** changing partition count or retry schedule does not change ordered results or declared
numeric tolerances.

### 88. Fault-tolerant native memory

Add arenas, checkpointable buffer ownership, spill-to-object-store, checksum validation, and
recovery for long-running conversions and scans. Track every allocation to its plan and batch.

**Exit:** worker loss or partial I/O releases or reconstructs all owned buffers without leaking
or corrupting surviving batches.

### 89. Exact geodesic execution

Provide ellipsoidal distance, area, length, buffering, and antimeridian-aware predicates with
explicit datum, epoch, edge, and numerical policies. Keep planar kernels as a separately named
fast path.

**Exit:** results identify their geodesic model and agree with pinned reference tolerances across
CPU, WASM, GPU, and distributed execution.

### 90. 4D and time-aware geometry

Define first-class handling for coordinate epochs, trajectories, temporal intervals, moving
points, and dynamic geometry while preserving the distinction between Z, M, and time.

**Exit:** temporal interpolation and filtering cannot reinterpret M or Z, and unsupported dynamic
semantics fail before physical conversion.

### 91. Topology certification suite

Build differential topology cases for validity, repair, overlay, buffering, simplification,
precision reduction, and robustness at poles, dateline crossings, and degenerate rings.

**Exit:** every topology result has a reproducible input fingerprint, engine version, precision
model, and classified discrepancy outcome.

### 92. Streaming spatial index maintenance

Maintain append-only and mutable spatial indexes over streaming batches with watermarking,
late-arrival handling, deletes, compaction, and snapshot-consistent reads.

**Exit:** index updates are idempotent, bounded in memory, and never produce stale positive or
negative pruning decisions.

### 93. Query-result interchange

Define a portable serialized plan, capability negotiation record, execution trace, and result
manifest that can move a Scan query between JavaScript, Rust, Python, and SQL engines.

**Exit:** an explainable query can be replayed in another supported runtime without changing
schema, ordering, CRS policy, or null semantics.

### 94. GPU and accelerator certification

Certify WebGPU, CUDA, Metal, and future accelerator backends against the scalar kernels for
conversion, bounds, predicates, transforms, indexing, and reductions. Publish occupancy and
transfer-cost profiles.

**Exit:** accelerator selection is capability-driven, reproducible, and always has a validated
fallback for unsupported devices or precision modes.

### 95. Embedded and edge profile

Define a compact profile for mobile, edge, serverless, and embedded runtimes with bounded code
size, no dynamic dependencies, incremental decoding, and optional native/WASM acceleration.

**Exit:** the profile retains WKB interoperability and native buffer semantics within documented
memory, startup, and bundle budgets.

### 96. Browser privacy and permission profile

Specify browser permissions, cross-origin isolation, worker policy, storage quotas, timing
side-channel controls, and user-consent boundaries for geometry processing and caches.

**Exit:** enabling acceleration or persistence does not expand data access beyond the declared
origin and permission model.

### 97. Schema and ABI notarization

Sign contract manifests, extension metadata rules, native descriptors, generated bindings, and
release fixtures. Provide verification tools for package consumers and downstream engines.

**Exit:** a consumer can verify that a schema, ABI, and fixture came from the same trusted
release lineage before executing data-dependent code.

### 98. Ecosystem conformance marketplace

Publish a public compatibility dashboard, self-serve fixture runner, implementation badges,
known-exception registry, and automated reports for producers, consumers, and engine adapters.

**Exit:** interoperability claims are evidence-backed, versioned, and comparable without relying
on marketing labels or undocumented behavior.

### 99. Long-horizon migration and archival

Design archival profiles, format migration tools, cold-storage checksums, old-runtime readers,
and semantic downgrade reports for decades-long datasets and changing CRS authorities.

**Exit:** an archived dataset can be validated, inspected, and migrated without losing declared
geometry, dimensional, CRS, or provenance semantics.

### 100. GeoArrow sovereignty review

Run an annual adversarial review of performance, security, numerical correctness, package
boundaries, ecosystem coverage, and governance. Publish the next hundred-tranche roadmap only
after measuring the current contract against real workloads and independent implementations.

**Exit:** GeoArrow remains a durable open contract rather than a framework-specific optimization,
with independent evidence for fidelity, compactness, speed, and operational resilience.
