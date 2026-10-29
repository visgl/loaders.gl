End-to-end performance

# Measure bytes, copies, and boundaries.

Performance depends on the complete path: selective I/O, decoding, allocation, worker transfer, and the shape handed to the application.

I/Omemoryworkers

bytes

copies

transfer

first batch

Developer guide · performance

# Measure the pipeline, not the language label.

WebAssembly can accelerate a compute-heavy kernel, while JavaScript or TypeScript can win end to end by avoiding I/O, allocation, copying, and conversion. The right comparison includes the work around decoding.

[Scan architecture](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/common-scan-architecture.md)[Using workers](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)[Compression benchmarks](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/compression/benchmarks.md)

A useful performance model

## Count bytes, copies, boundaries, and time to first result.

A fast inner loop is only one part of a loader. Selective reads, direct Arrow or GPU output, lazy code loading, worker transfer, and pipeline fusion can dominate the result users experience.

01

WASM excels

Dense compute with amortized initialization cost

02

TypeScript can win

Selective I/O and direct output construction

03

Measure

Cold start, throughput, bytes, memory, and transfer

04

Decide

Use reproducible data and the output shape users need

Detailed guide

## Performance reasoning and measurements

The sections below compare WASM and JavaScript strengths, give Parquet and COPC examples, and define a practical end-to-end benchmark checklist.

WebAssembly (WASM) makes code written in languages such as Rust and C++ available in browsers. It can deliver excellent performance, particularly for dense computation with predictable memory access. It does not, however, make an entire data-loading pipeline faster by itself. JavaScript or TypeScript loaders can be faster and smaller when they perform less total work around the decode kernel.

The useful comparison is therefore between complete loader pipelines, measured with representative data and output shapes, rather than between source languages.

## Where WASM Excels[​](#where-wasm-excels "Direct link to Where WASM Excels")

WASM is often a strong choice when:

* most elapsed time is spent in a compute-heavy inner loop
* the algorithm maps cleanly to linear memory
* input and output can remain in WASM memory for a substantial amount of work
* a mature native implementation already provides broad format conformance
* the module's download, compilation, and initialization costs are amortized over large inputs

Compression, cryptography, numerical transforms, and complex entropy decoders often fit this profile.

## Where JavaScript and TypeScript Can Win[​](#where-javascript-and-typescript-can-win "Direct link to Where JavaScript and TypeScript Can Win")

A JavaScript or TypeScript loader can outperform a WASM loader end to end when it combines several pipeline advantages:

* **Selective I/O:** range requests, column projection, spatial selection, or field-layer selection can avoid downloading and decoding irrelevant bytes.
* **Direct output construction:** decoded values can be written directly into TypedArray, Arrow, or GPU-ready buffers instead of being materialized as intermediate objects.
* **Fewer memory copies:** WASM normally uses a separate linear memory. Moving data into that memory and converting results back into JavaScript-owned structures can cost more than the decode kernel.
* **Fewer boundary crossings:** repeated small calls between JavaScript and WASM are more expensive than a small number of coarse calls.
* **Browser-native facilities:** built-in streams and supported decompression formats can avoid shipping another implementation and may use optimized platform code.
* **Lazy code loading:** a focused TypeScript path and dynamically loaded codecs can have a smaller startup and transfer cost than a general WASM binary containing every feature.
* **Pipeline fusion:** parsing, validation, dictionary expansion, null handling, and final buffer construction can share one pass over the data.

These advantages do not imply that JavaScript has a faster instruction loop. They mean that loader architecture can eliminate enough I/O, allocation, copying, and conversion to outweigh a slower individual kernel.

## Format Examples[​](#format-examples "Direct link to Format Examples")

Parquet is naturally selective: its footer, row groups, column chunks, statistics, bloom filters, and page indexes can identify small byte ranges that satisfy a projection or filter. A loader that reads only those ranges and decodes directly into Arrow buffers may do substantially less work than a faster general-purpose decoder that materializes every selected value through intermediate representations.

LAZ and COPC offer similar opportunities. A loader can request only relevant COPC nodes, decode only the LAZ field layers needed by the selected output schema, and write point attributes directly into their final typed columns. The arithmetic decoder is important, but it is only one stage of that pipeline.

## How to Compare Implementations[​](#how-to-compare-implementations "Direct link to How to Compare Implementations")

Measure the operation the application actually needs, including:

* cold startup and warmed-up throughput
* bytes fetched and decoded after projection or filtering
* time to first useful batch and total elapsed time
* peak and retained memory, including both JavaScript and WASM memory
* final output construction and worker transfer costs
* JavaScript, worker, codec, and WASM asset sizes
* correctness across realistic encodings, compressions, schemas, null patterns, and input sizes

Use multiple demanding cases. Tiny inputs expose startup costs; large and varied inputs expose sustained decode performance and memory behavior. A result for object rows does not predict the result for Arrow tables, and a full-file result does not predict a selective range scan.

The practical rule is simple: choose implementations using reproducible end-to-end measurements. Treat language and runtime as design constraints, not performance conclusions.
