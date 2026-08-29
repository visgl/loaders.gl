---
title: fetchProgress
description: Observe bytes arriving from a fetch response and report incremental progress to an application callback.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / transport"
  title="Show progress while a response is still arriving."
  description="fetchProgress() wraps a fetch response and reports loaded and total bytes as the body is consumed. It is an experimental low-level helper for applications that need transport progress beside a loader or source."
  tone="blue"
  meta={['Experimental', 'Response wrapper', 'Byte progress']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Fetch options', to: '/docs/modules/core/api-reference/loader-options'},
    {label: 'Streaming loaders', to: '/docs/developer-guide/using-streaming-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Progress boundary"
  title="Report transport state without changing the payload."
  description="The helper observes the response body and forwards it as a normal Response. Consumers can update progress UI while the regular loader continues to parse the body."
  tone="blue"
  items={[
    {label: 'Wrap', value: 'Pass a Response or response promise to the helper.'},
    {label: 'Report', value: 'Receive loaded bytes and an optional total byte count.'},
    {label: 'Continue', value: 'Read the returned Response as usual.'},
    {label: 'Status', value: 'Treat the helper as experimental and verify server headers.'}
  ]}
/>

<ReferenceBoundary
  title="fetchProgress reference"
  description="The detailed reference covers callback signatures, response handling, completion/error hooks, and the limitations of byte totals."
  tone="blue"
/>

> This function is still experimental

A function that tracks a fetch response object and calls `onProgress` callbacks.

## Usage

```typescript
import {_fetchProgress} from '@loaders.gl/core';

function onProgress(percent, {loadedBytes, totalBytes}) {
  console.log(`${percent}% ${Math.round(loadedBytes/1000)} of ${Math.round(totalBytes/1000)} Kbytes`);
}

async function main() {
  const response = await _fetchProgress(fetch(PROGRESS_IMAGE_URL, onProgress),
  const data = await response.arrayBuffer();
  // At this point, onProgress will have been called one or more times.
  ...
}
```

## \_fetchProgress(response : Response | Promise, onProgress : function, onDone : function, onError : function) : Response

`onProgress: (percent: number, {loadedBytes : number, totalBytes : number}) => void`
