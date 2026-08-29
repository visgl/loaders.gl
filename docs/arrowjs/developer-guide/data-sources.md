---
title: Arrow JavaScript data sources and sinks
description: Connect Arrow JS to files, fetch responses, streams, buffers, and async iterators.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Arrow JavaScript · I/O boundaries"
  title="Feed Arrow from the source you already have."
  description="Arrow JS accepts browser and Node.js data sources through a small set of interoperable boundaries. Choose a stream, response, buffer, or async iterator without changing the table model downstream."
  tone="blue"
  meta={['DOM and Node streams', 'Fetch responses', 'Async iterators']}
  links={[
    {label: 'Arrow JS guide', to: '/docs/arrowjs'},
    {label: 'Reading and writing', to: '/docs/arrowjs/developer-guide/reading-and-writing'},
    {label: 'Async iterators', to: '/docs/developer-guide/concepts/async-iterators'}
  ]}
/>

<DocOrientation
  eyebrow="Pick the boundary"
  title="Streams in, batches through, streams out."
  description="Use the source form that matches your runtime. The same async-iterator model makes browser responses, Node streams, and in-memory chunks composable."
  tone="blue"
  items={[
    {label: 'Streams', value: 'DOM and Node readable streams'},
    {label: 'Responses', value: 'Fetch promises and response bodies'},
    {label: 'Buffers', value: 'Uint8Array and ArrayBuffer inputs'},
    {label: 'Iterators', value: 'General pull-based sources and sinks'}
  ]}
/>

<ReferenceBoundary
  title="Data source details"
  description="The sections below cover streams, fetch responses, ArrayBuffers, async iterators, and the corresponding writer boundaries."
  tone="blue"
/>

# Data Sources and Sinks

The Arrow JavaScript API is designed to make it easy to work with data sources both in the browser and in Node.js.

## Streams

Both Node and DOM/WhatWG Streams can be used directly as input sources by the Arrow JS API.

## Fetch Responses

Fetch responses (Promises) can be used where a data source is expected.

## ArrayBuffers

Most data sources accept `Uint8Arrays`.

## AsyncIterators

Async iterators are the most general way to abstract "streaming" data sources and data sinks and are consistently accepted (and in many cased returned) by the Arrow JS API.
