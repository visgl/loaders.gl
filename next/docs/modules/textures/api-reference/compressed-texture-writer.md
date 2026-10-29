Compressed texture writer

GPU

# Keep the compression step at the build or Node.js boundary.

`CompressedTextureWriter` is an experimental Node.js-only bridge to an externally installed native compressor. It is useful when an application needs to produce a GPU texture container, but it is not a browser-side encoder.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Compressed textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

GPU[Compressed Textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[CompressedTextureWriter](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md)

The compression boundary

## Prepare image input. Invoke the local toolchain. Write a GPU container.

The writer delegates actual compression to \`texture-compressor\`. Keep that dependency explicit and run this path in build tooling or a controlled Node.js process.

01

Input

Encoded image URL or compatible image input

02

Toolchain

Application-installed texture-compressor package

03

Encode

Native compressor produces GPU blocks

04

Output

Compressed texture container at the destination URL

![From-v3.0](https://img.shields.io/badge/From-v3.0-blue.svg?style=flat-square)![Node.js-only](https://img.shields.io/badge/Node.js-only-red.svg?style=flat-square)

> The experimental `CompressedTextureWriter` class can encode a binary encoded image into a compressed texture.

Detailed guide

## Writer prerequisites and limitations

The reference below covers installation, Node.js constraints, output assumptions, native tool invocation, and current experimental limitations.

caution

This writer works by loading the [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor) package, which runs its bundled native compressor. That package is **not** installed by `@loaders.gl/textures`. Applications that use this writer must install it themselves:

```
npm install --save-dev texture-compressor
```

The package is resolved as an optional peer dependency and called directly. The writer does not invoke `npx` or access the npm registry. If the package cannot be resolved locally, `encodeURLtoURL()` rejects.

| CompressedTextureWriter |                                            |
| ----------------------- | ------------------------------------------ |
| File Extension          |                                            |
| File Type               | Binary                                     |
| Data Format             | Encoded image URL                          |
| File Format             | S3TC / DXT1 in a KTX container             |
| Encoder Type            | Asynchronous                               |
| Worker Thread           | ❌ No; Node.js-only native tool invocation |
| Streaming               | ❌ No                                      |

## Usage[​](#usage "Direct link to Usage")

```
import '@loaders.gl/core/polyfills'; // only if using under Node

import {encodeURLtoURL} from '@loaders.gl/core';

import {CompressedTextureWriter} from '@loaders.gl/textures';



export const IMAGE_URL = 'image.png';



const outputFilename = await encodeURLtoURL(IMAGE_URL, '/tmp/test.ktx', CompressedTextureWriter);



// app can now read the file from outputFilename
```

## Data Format[​](#data-format "Direct link to Data Format")

The experimental encoder accepts an input image URL and invokes the optional `texture-compressor` package to produce an S3TC/DXT1 texture. The current command-line tool writes a KTX container even though the public writer metadata uses the `dds` identifier. The output URL must therefore end in `.ktx`.

This path is intentionally URL-based and does not expose a browser-side `encode()` method. For a portable browser workflow, use [`KTX2BasisWriter`](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md) or prepare compressed textures during an asset build.

## Options[​](#options "Direct link to Options")

| Option                | Type      | Default  | Description                                                                                |
| --------------------- | --------- | -------- | ------------------------------------------------------------------------------------------ |
| `texture.format`      | `string`  | `'auto'` | Format hint retained for the writer options contract; the current encoder emits S3TC/DXT1. |
| `texture.compression` | `string`  | `'auto'` | Compression hint retained for compatibility; the current encoder uses DXT1.                |
| `texture.quality`     | `string`  | `'auto'` | Quality hint retained for compatibility; the current encoder uses normal quality.          |
| `texture.mipmap`      | `boolean` | `false`  | Mipmap preference retained for compatibility with the external toolchain.                  |
| `texture.flipY`       | `boolean` | `false`  | Vertical orientation preference retained for compatibility with the external toolchain.    |
| `texture.toolFlags`   | `string`  | `''`     | Additional tool flags reserved for the external compressor.                                |

## Remarks[​](#remarks "Direct link to Remarks")

* Requires the `texture-compressor` package to be installed by the application, see the note above.
* Output is currently hardcoded to the S3TC/DXT1 compression format, and the CLI only writes `.ktx` containers, so `outputUrl` must end in `.ktx` despite the writer being registered under the `dds` id.
* For more information, see [`texture-compressor`](https://github.com/TimvanScherpenzeel/texture-compressor).
