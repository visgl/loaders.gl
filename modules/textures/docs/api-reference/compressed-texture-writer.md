# CompressedTextureWriter

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

> The experimental `CompressedTextureWriter` class can encode a binary encoded image into a compressed texture.

| Loader         | Characteristic                                         |
| -------------- | ------------------------------------------------------ |
| File Extension |                                                        |
| File Type      | Binary                                                 |
| Data Format    |                                                        |
| File Format    |                                                        |
| Encoder Type   | Asynchronous                                           |
| Worker Thread  | No (but may run on separate native thread in browsers) |
| Streaming      | No                                                     |

## Usage

```js
import '@loaders.gl/polyfill'; // only if using under Node
import {encodeURLtoURL} from '@loaders.gl/core';
import {CompressedTextureWriter} from '@loaders.gl/textures';

export const IMAGE_URL = 'image.png';

const outputFilename = await encodeURLtoURL(IMAGE_URL, '/tmp/test.ktx', CompressedTextureWriter);

// app can now read the file from outputFilename
```

## Data Format

TBA

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Remarks

- For more information, see [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor).
