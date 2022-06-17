# VideoBuilder

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.2-blue.svg?style=flat-square" alt="From-v2.2" />
</p>

> The `VideoBuilder` is experimental.

A basic WebM Video encoder. Only works in the browser.

| Encoder        | Characteristic                                          |
| -------------- | ------------------------------------------------------- |
| File Extension | `.webm`                                                  |
| File Type      | Binary                                                  |
| File Format    | Image                                                   |
| Data Format    | `Video` (browsers) (Not currently supported on node.js) |
| Supported APIs | `load`, `parse`                                         |

## Usage

```js
import {VideoBuilder} from '@loaders.gl/video';

const videoBuilder = new VideoBuilder({ source: canvas, frameRate: 24 });

for (const frame of frames) {
  ctx.drawImage(frame);
  const imageData = ctx.getImageData(0, 0, width, height);
  const buffer = imageData.data.buffer;
  videoBuilder.addFrame(buffer);
}

const url = await videoBuilder.finalize();
video.src = url;
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |


## Open questions and alternatives considered:

Questions:
* Should this be a completely agnostic API to RGB pixel data (i.e. a wrapper around webm-wasm) or should it attempt to infer context types from a passed in canvas - it's easy to imagine use cases for DOM, Canvas2D, or WebGL, but it would be nice if these Just Worked.
*

Alternatives:
* MediaRecorder + canvas.getStream - only realtime
* WebMWriter - uses canvas.toDataUrl() which incurrs costly serialization
* VideoFrame - not supported in FireFox