import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';

# CompressedTextureWriter 🚧

<TexturesDocsTabs active="compressedtexturewriter" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square" alt="From-v3.0" />
  <img src="https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square" alt="Node.js-only" />
</p>

> The experimental `CompressedTextureWriter` class can encode a binary encoded image into a compressed texture.

:::caution
This writer works by spawning the [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) command line utility via `npx`. That utility is **not** installed by `@loaders.gl/textures`. Applications that use this writer must install it themselves:

```bash
npm install --save-dev texture-compressor
```

The utility is invoked with `npx --no`, so it is never downloaded on demand. If it cannot be resolved locally, `encodeURLtoURL()` rejects.
:::

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

```typescript
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

- Requires the `texture-compressor` CLI to be installed by the application, see the note above.
- Output is currently hardcoded to the S3TC/DXT1 compression format, and the CLI only writes `.ktx` containers, so `outputUrl` must end in `.ktx` despite the writer being registered under the `dds` id.
- For more information, see [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor).
