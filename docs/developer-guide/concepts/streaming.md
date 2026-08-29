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

> Streaming support in loaders.gl is a work-in-progress. The ambition is that many loaders would support streaming from both Node and DOM streams, through a consistent API and set of conventions (for both applications and loader/writer objects).

## Streaming Loads

### Incremental Parsing

Some loaders offer incremental parsing (chunks of incomplete data can be parsed, and updates will be sent after a certain batch size has been exceeded). In many cases, parsing is fast compared to loading of data, so incremental parsing on its own may not provide a lot of value for applications.

### Incremental Loading

Incremental parsing becomes more interesting when it can be powered by incremental loading, whether through request updates or streams (see below).

### Streamed Loading

Streamed loading means that the entire data does not need to be loaded.

This is particularly advantageous when:

- loading files with sizes that exceed browser limits (e.g. 1GB in Chrome)
- doing local processing to files (tranforming one row at a time), this allows pipe constructions that can process files that far exceed internal memory.

## Batched Updates

For incemental loading and parsing to be really effective, the application needs to be able to deal efficiently with partial batches as they arrive. Each loader category (or loader) may define a batch update conventions that are appropriate for the format being loaded.

## Streaming Writes

TBA

## Node Streams vs DOM Streams

Stream support is finally arriving in browsers, however DOM Streams have a slightly different API than Node streams and the support across browsers is still spotty.

## Polyfills

Stream support across browsers can be somewhat improved with polyfills. TBA

## Stream Utilities

- Stream to memory, ...
- Automatically create stream if loader/writer only supports streaming
- ...
