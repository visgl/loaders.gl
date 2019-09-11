# fetchProgress

> This function is still experimental

A function that tracks a fetch response object and calls `onProgress` callbacks.

## Usage

```js
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

## _fetchProgress(response : Response | Promise, onProgress : function, onDone : function, onError : function) : Response

`onProgress: (percent: number, {loadedBytes : number, totalBytes : number}) => void`

