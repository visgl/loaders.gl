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

const url = await videoBuilder.finalize()
video.src =
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |


## Alternatives considered:

* MediaRecorder + canvas.getStream - only realtime
* VideoFrame - not supported in FireFox