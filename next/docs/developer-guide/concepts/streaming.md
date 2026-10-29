Developer guide · streaming

# Start processing before the file is complete.

Streaming loaders turn large inputs into useful batches without requiring the complete file in memory. The API is still evolving, but the core direction is a portable async-iterator contract across browser and Node.js sources.

[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)[Async iterators](https://loaders.gl/next/docs/developer-guide/concepts/async-iterators.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/async-iterators.md)[Using workers](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-worker-loaders.md)

Three ways to stream

## Reduce memory, reduce latency, or keep a pipeline moving.

Incremental parsing, incremental loading, and batched updates solve different parts of the problem. The most useful pipelines combine them while keeping batch semantics explicit.

01

Incremental parsing

Parse partial input and emit updates

02

Incremental loading

Fetch or read only the input needed so far

03

Batched updates

Handle useful partial results as they arrive

04

Streaming writes

Emit output progressively when the writer supports it

Streaming loaders

### Stream data in batches.

Batched loaders let applications process results as bytes arrive, without holding a large file in one string or ArrayBuffer.

Streaming loaders

[CSV​Loader↗](https://loaders.gl/next/docs/modules/tables/csv/api-reference/csv-loader.md)[JSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/json-loader.md)[GeoJSON​Loader↗](https://loaders.gl/next/docs/modules/tables/json/api-reference/geojson-loader.md)[Parquet​Loader↗](https://loaders.gl/next/docs/modules/tables/parquet/api-reference/parquet-loader.md)

Incremental processing

Process while loading

load​In​Batches()

parse​In​Batches()

transforms

batch​Size

Batches

Table batches

GeoJSON batches

Arrow batches

Detailed guide

## Streaming model and limitations

The sections below cover streamed loads, batch conventions, Node versus DOM streams, polyfills, and the current utility surface.

Streaming support is format-dependent. The common API is an async-iterator contract, while each loader documents whether it can parse partial input, emit batches, or make progress from a source that provides ranges or chunks.

## Streaming Loads[​](#streaming-loads "Direct link to Streaming Loads")

### Incremental Parsing[​](#incremental-parsing "Direct link to Incremental Parsing")

Some loaders offer incremental parsing (chunks of incomplete data can be parsed, and updates will be sent after a certain batch size has been exceeded). In many cases, parsing is fast compared to loading of data, so incremental parsing on its own may not provide a lot of value for applications.

### Incremental Loading[​](#incremental-loading "Direct link to Incremental Loading")

Incremental parsing becomes more interesting when it can be powered by incremental loading, whether through request updates or streams (see below).

### Streamed Loading[​](#streamed-loading "Direct link to Streamed Loading")

Streamed loading means that the entire data does not need to be loaded at once.

This is particularly advantageous when:

* loading files with sizes that exceed browser limits (e.g. 1GB in Chrome)
* doing local processing on files (transforming one row at a time), which allows pipelines to process files that far exceed available memory.

## Batched Updates[​](#batched-updates "Direct link to Batched Updates")

For incremental loading and parsing to be effective, the application needs to handle partial batches efficiently as they arrive. Each loader category or loader can define batch conventions that fit the format being loaded.

## Streaming Writes[​](#streaming-writes "Direct link to Streaming Writes")

Streaming writes remain format-specific. Use a writer that documents incremental output support; otherwise `encode` or `encodeSync` produces a complete result in memory.

## Node Streams vs DOM Streams[​](#node-streams-vs-dom-streams "Direct link to Node Streams vs DOM Streams")

Browser and Node streams have different APIs and deployment constraints. loaders.gl normalizes the parts needed by its loaders, but a source or writer may still expose platform-specific behavior.

## Polyfills[​](#polyfills "Direct link to Polyfills")

Use the documented polyfills when an older runtime lacks the stream or text APIs required by a loader.

## Stream Utilities[​](#stream-utilities "Direct link to Stream Utilities")

The core APIs provide helpers for loading complete results, iterating over batches, and applying transforms between async-iterator stages. See [Using streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md) for the supported entry points and examples.
