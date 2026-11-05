Polyfills module

# Give Node.js the platform APIs loaders expect.

@loaders.gl/core/polyfills provides Node.js adapters for file access, streams, crypto, images, and library loading.

[Polyfills module](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/polyfills/api-reference.md)[Preferred JavaScript APIs](https://loaders.gl/next/docs/developer-guide/concepts/javascript-apis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/javascript-apis.md)[Image module](https://loaders.gl/next/docs/modules/images.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/images.md)

The runtime boundary

## Import once, keep loader code portable.

The core polyfills subpath is primarily for Node.js. In browsers it is designed to be a no-op, while under Node it fills the specific gaps needed by loaders.gl’s browser-compatible contracts.

01

Files

NodeFile, NodeFilesystem, ReadableFile, and WritableFile

02

Network

Uses the built-in fetch, Response, and Headers

03

Media

ImageBitmap and image-data helpers

04

Runtime

Crypto, streams, and dynamic library loading

Detailed guide

## Polyfill installation and limits

The sections below cover installation, Node.js adapters, image behavior, and readable files.

The `@loaders.gl/core/polyfills` subpath installs support for Node.js. Import it before using loaders.gl functionality that needs filesystem, image, or other Node adapters. It does not import the core root or another loaders.gl module. Modern Node.js already provides standard network fetch and web streams.

loaders.gl is based on the HTML5 API provided by modern, evergreen browsers.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/core
```

## Usage[​](#usage "Direct link to Usage")

Just import `@loaders.gl/core/polyfills` before you start using other loaders.gl modules.

```
import '@loaders.gl/core/polyfills';

import '@loaders.gl/core';
```

CommonJS applications can install the same Node adapters with:

```
require('@loaders.gl/core/polyfills');
```

The Node library transport accepts local paths and file URLs, including URL-escaped filenames. Binary reads return exactly the file's bytes. Relative imports in a local CommonJS library resolve from that library's directory. Browser bundlers resolve both package entrypoints to the browser shim.

Node image decoding and encoding require the optional `sharp` peer dependency. Install it explicitly with `npm install sharp`; filesystem, stream, crypto, and library adapters do not require an image codec. File aliases and prefixes for the polyfills can be configured with `addAliases` and `setPathPrefix` from this subpath.

## Features[​](#features "Direct link to Features")

The polyfills module installs the following capabilities.

* fetching files from Node file system
* Node Filesystem implementation
* Node ReadableFile and WritableFile implementations
* Node Crypto class
* Node Stream support, including propagation of errors raised while reading an iterable
* Node library loading
* Image parsing and encoding under Node.js
* A minimal global `ImageBitmap` polyfill plus a global `getImageBitmapData(image)` helper under Node.js

## ImageBitmap Polyfill[​](#imagebitmap-polyfill "Direct link to ImageBitmap Polyfill")

When `@loaders.gl/core/polyfills` is imported under Node.js, it installs:

* `globalThis.ImageBitmap` as a lightweight wrapper around decoded image pixels
* `globalThis.getImageBitmapData(image)` to unwrap that bitmap back to `{data, width, height}`

This polyfill is intentionally limited:

* it is designed to support [`ImageLoader`](https://loaders.gl/next/docs/modules/images/api-reference/image-loader.md) and parsed-image helpers
* it does not install `createImageBitmap()`
* it does not attempt to emulate full browser canvas/image interoperability

The optional Sharp backend decodes PNG, JPEG, GIF, WebP, AVIF, TIFF, and SVG into RGBA pixels. It detects formats from the bytes, so a MIME hint is not required. The bitmap wrapper exposes pixel access and `close()`; it does not emulate browser canvas APIs, transferability, or every `createImageBitmap()` option.

## ReadableFile utilities[​](#readablefile-utilities "Direct link to ReadableFile utilities")

`@loaders.gl/core/loader-utils` exports `NodeFile` and `NodeFilesystem` wrappers that are installed by this polyfill package. They mirror the browser `HttpFile`/`BlobFile` implementations, exposing a consistent `ReadableFile` interface for local and remote assets without bundling Node built-ins directly into application code.

## Remarks[​](#remarks "Direct link to Remarks")

* The polyfills module can safely be imported in the browser. It is designed to be a no-op in this case, though if you are using new cutting-edge bundlers, they may not respect this configuration.

## Optional Node image codecs[​](#optional-node-image-codecs "Direct link to Optional Node image codecs")

Sharp is an optional peer dependency, not an automatically installed codec. Install it only in applications that decode or encode images under Node.js:

```
npm install @loaders.gl/core sharp
```

Importing `@loaders.gl/core/polyfills` does not load Sharp. The first image decode or encode loads it lazily; if it is missing or cannot initialize, that operation reports installation instructions. Browser image operations use browser codecs. Node file, library, crypto, and native stream support work without Sharp.
