Core API / transport

# Show progress while a response is still arriving.

fetchProgress() wraps a fetch response and reports loaded and total bytes as the body is consumed. It is an experimental low-level helper for applications that need transport progress beside a loader or source.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Fetch options](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)[Streaming loaders](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-streaming-loaders.md)

Progress boundary

## Report transport state without changing the payload.

The helper observes the response body and forwards it as a normal Response. Consumers can update progress UI while the regular loader continues to parse the body.

01

Wrap

Pass a Response or response promise to the helper.

02

Report

Receive loaded bytes and an optional total byte count.

03

Continue

Read the returned Response as usual.

04

Status

Treat the helper as experimental and verify server headers.

Detailed guide

## fetchProgress reference

The detailed reference covers callback signatures, response handling, completion/error hooks, and the limitations of byte totals.

> This function is still experimental

A function that tracks a fetch response object and calls `onProgress` callbacks.

## Usage[​](#usage "Direct link to Usage")

```
import {_fetchProgress} from '@loaders.gl/core';



function onProgress(percent, {loadedBytes, totalBytes}) {

  console.log(`${percent}% ${Math.round(loadedBytes/1000)} of ${Math.round(totalBytes/1000)} Kbytes`);

}



async function main() {

  const response = await _fetchProgress(fetch(PROGRESS_IMAGE_URL), onProgress);

  const data = await response.arrayBuffer();

  // At this point, onProgress will have been called one or more times.

  return data;

}
```

## `_fetchProgress(response, onProgress, onDone?, onError?): Promise<Response>`[​](#_fetchprogressresponse-onprogress-ondone-onerror-promiseresponse "Direct link to _fetchprogressresponse-onprogress-ondone-onerror-promiseresponse")

`onProgress: (percent: number, {loadedBytes : number, totalBytes : number}) => void`

Progress callbacks require a successful response with a readable body and a positive `Content-Length`. Without those, the original response is returned and progress is not reported. The wrapped response contains the body stream but does not preserve the original response headers, status, or URL; inspect those before wrapping if your application needs them.
