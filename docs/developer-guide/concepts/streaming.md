---
title: Streaming concepts
description: Understand incremental loading, batched updates, and async data flows in loaders.gl.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';
import {StreamingConcept} from '@site/src/components/home/concepts';

<DocPageHeader
  eyebrow="Developer guide · streaming"
  title="Start processing before the file is complete."
  description="Streaming loaders turn large inputs into useful batches without requiring the complete file in memory. The API is still evolving, but the core direction is a portable async-iterator contract across browser and Node.js sources."
  tone="mint"
  meta={['Incremental parsing', 'Batched updates', 'Browser and Node.js']}
  links={[
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'},
    {label: 'Async iterators', to: '/docs/developer-guide/concepts/async-iterators'},
    {label: 'Using workers', to: '/docs/developer-guide/using-worker-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Three ways to stream"
  title="Reduce memory, reduce latency, or keep a pipeline moving."
  description="Incremental parsing, incremental loading, and batched updates solve different parts of the problem. The most useful pipelines combine them while keeping batch semantics explicit."
  tone="mint"
  items={[
    {label: 'Incremental parsing', value: 'Parse partial input and emit updates'},
    {label: 'Incremental loading', value: 'Fetch or read only the input needed so far'},
    {label: 'Batched updates', value: 'Handle useful partial results as they arrive'},
    {label: 'Streaming writes', value: 'Emit output progressively when the writer supports it'}
  ]}
/>

<StreamingConcept />

<ReferenceBoundary
  title="Streaming model and limitations"
  description="The sections below cover streamed loads, batch conventions, Node versus DOM streams, polyfills, and the current utility surface."
  tone="mint"
/>

Streaming support is format-dependent. The common API is an async-iterator contract, while each
loader documents whether it can parse partial input, emit batches, or make progress from a source
that provides ranges or chunks.

## Streaming Loads

### Incremental Parsing

Some loaders offer incremental parsing (chunks of incomplete data can be parsed, and updates will be sent after a certain batch size has been exceeded). In many cases, parsing is fast compared to loading of data, so incremental parsing on its own may not provide a lot of value for applications.

### Incremental Loading

Incremental parsing becomes more interesting when it can be powered by incremental loading, whether through request updates or streams (see below).

### Streamed Loading

Streamed loading means that the entire data does not need to be loaded at once.

This is particularly advantageous when:

- loading files with sizes that exceed browser limits (e.g. 1GB in Chrome)
- doing local processing on files (transforming one row at a time), which allows pipelines to process files that far exceed available memory.

## Batched Updates

For incremental loading and parsing to be effective, the application needs to handle partial
batches efficiently as they arrive. Each loader category or loader can define batch conventions
that fit the format being loaded.

## Streaming Writes

Streaming writes remain format-specific. Use a writer that documents incremental output support;
otherwise `encode` or `encodeSync` produces a complete result in memory.

## Node Streams vs DOM Streams

Browser and Node streams have different APIs and deployment constraints. loaders.gl normalizes the
parts needed by its loaders, but a source or writer may still expose platform-specific behavior.

## Polyfills

Use the documented polyfills when an older runtime lacks the stream or text APIs required by a
loader.

## Stream Utilities

The core APIs provide helpers for loading complete results, iterating over batches, and applying
transforms between async-iterator stages. See [Using streaming loaders](/docs/developer-guide/using-streaming-loaders)
for the supported entry points and examples.
