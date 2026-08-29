---
title: Iterator utilities
description: Bridge streams and async iterators across browser and Node.js runtimes.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core module · streaming API"
  title="Iterator utilities"
  description="Use one async-iteration model for readable and writable streams in browser and Node.js code."
  tone="blue"
  meta={['Readable streams', 'Writable streams', 'Browser and Node.js']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Parse in batches', to: '/docs/modules/core/api-reference/parse-in-batches'},
    {label: 'Worker processing', to: '/docs/modules/worker-utils/api-reference/worker-processing'}
  ]}
/>

<DocOrientation
  eyebrow="The stream boundary"
  title="Treat arriving data as an async sequence."
  description="The iterator helper lets loaders and application code consume or produce chunks without depending on the stream implementation underneath."
  tone="blue"
  items={[
    {label: 'Readable', value: 'Iterate chunks from a stream'},
    {label: 'Writable', value: 'Write chunks through an async iterator'},
    {label: 'Runtime', value: 'Works in browsers and Node.js'},
    {label: 'Use', value: 'Streaming loaders, writers, and transforms'}
  ]}
/>

<ReferenceBoundary
  title="Iterator utility reference"
  description="The section below documents the stream-to-iterator helper."
  tone="blue"
/>

## Functions

### getStreamIterator(stream : Stream) : AsyncIterator

Returns an async iterator that can be used to read chunks of data from the stream (or write chunks of data to the stream, in case of writable streams).

Works on both Node.js 8+ and browser streams.
