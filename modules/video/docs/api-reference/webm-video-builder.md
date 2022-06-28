# WebMVideoBuilder

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.2-blue.svg?style=flat-square" alt="From-v3.2" />
</p>

> The `WebMVideoBuilder` is experimental.

A basic WebM Video encoder. Only works in the browser.

| Encoder        | Characteristic                                          |
| -------------- | ------------------------------------------------------- |
| File Extension | `.webm`                                                 |
| File Type      | Binary                                                  |
| File Format    | WebM                                                    |
| Data Format    | `Video` (browsers) (Not currently supported on node.js) |
| Supported APIs | `addFrame`, `finalize`                                  |

## Usage

```js
import {WebMVideoBuilder} from '@loaders.gl/video';

const videoBuilder = new WebMVideoBuilder({ source: canvas, frameRate: 24 });

for (const frame of frames) {
  ctx.drawImage(frame);
  videoBuilder.addFrame(ctx);
}

const url = await videoBuilder.finalize();
video.src = url;
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `width` | number | 512 | The height of the output video
| `height` | number | 512 | The width of the output video
| `framerate` | number | 24 | How many frames per second the final container should hold
| `bitrate` | number | 200 | The bitrate (in kbps) to record the
| `realtime` | boolean | false | Whether to record in realtime. Used for streaming videos, for instance.

## Attribution
`WebMVideoBuilder` uses code from Google Chrome Labs' incredible [webm-wasm](https://github.com/GoogleChromeLabs/webm-wasm) package which is Apache 2.0 licensed.
