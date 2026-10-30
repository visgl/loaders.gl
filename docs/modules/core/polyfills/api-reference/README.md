---
title: Polyfills
description: Add the small set of Node.js and browser-compatibility APIs needed by loaders.gl.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Polyfills module"
  title="Give Node.js the platform APIs loaders expect."
  description="@loaders.gl/core/polyfills provides Node.js adapters for file access, streams, crypto, images, and library loading."
  tone="blue"
  meta={['Node.js support', 'Fetch and files', 'ImageBitmap and streams']}
  links={[
    {label: 'Polyfills module', to: '/docs/modules/core/polyfills/api-reference'},
    {label: 'Preferred JavaScript APIs', to: '/docs/developer-guide/concepts/javascript-apis'},
    {label: 'Image module', to: '/docs/modules/images'}
  ]}
/>

<DocOrientation
  eyebrow="The runtime boundary"
  title="Import once, keep loader code portable."
  description="The core polyfills subpath is primarily for Node.js. In browsers it is designed to be a no-op, while under Node it fills the specific gaps needed by loaders.gl’s browser-compatible contracts."
  tone="blue"
  items={[
    {label: 'Files', value: 'NodeFile, NodeFilesystem, ReadableFile, and WritableFile'},
    {label: 'Network', value: 'Uses the built-in fetch, Response, and Headers'},
    {label: 'Media', value: 'ImageBitmap and image-data helpers'},
    {label: 'Runtime', value: 'Crypto, streams, and dynamic library loading'}
  ]}
/>

<ReferenceBoundary
  title="Polyfill installation and limits"
  description="The sections below cover installation, Node.js adapters, image behavior, and readable files."
  tone="blue"
/>

The `@loaders.gl/core/polyfills` subpath installs support for Node.js. Import it before using loaders.gl functionality that needs filesystem, image, or other Node adapters. It does not import the core root or another loaders.gl module. Modern Node.js already provides standard network fetch and web streams.

loaders.gl is based on the HTML5 API provided by modern, evergreen browsers.

## Installation

```bash
npm install @loaders.gl/core
```

## Usage

Just import `@loaders.gl/core/polyfills` before you start using other loaders.gl modules.

```typescript
import '@loaders.gl/core/polyfills';
import '@loaders.gl/core';
```

CommonJS applications can install the same Node adapters with:

```javascript
require('@loaders.gl/core/polyfills');
```

The Node library transport accepts local paths and file URLs, including URL-escaped filenames.
Binary reads return exactly the file's bytes. Relative imports in a local CommonJS library
resolve from that library's directory. Browser bundlers resolve both package entrypoints to
the browser shim.

Node image decoding and encoding require the optional `sharp` peer dependency. Install it explicitly with `npm install sharp`; filesystem, stream, crypto, and library adapters do not require an image codec. File aliases and prefixes for the polyfills can be configured with `addAliases` and `setPathPrefix` from this subpath.

## Features

The polyfills module installs the following capabilities.

- fetching files from Node file system
- Node Filesystem implementation
- Node ReadableFile and WritableFile implementations
- Node Crypto class
- Node Stream support, including propagation of errors raised while reading an iterable
- Node library loading
- Image parsing and encoding under Node.js
- A minimal global `ImageBitmap` polyfill plus a global `getImageBitmapData(image)` helper under Node.js

## ImageBitmap Polyfill

When `@loaders.gl/core/polyfills` is imported under Node.js, it installs:

- `globalThis.ImageBitmap` as a lightweight wrapper around decoded image pixels
- `globalThis.getImageBitmapData(image)` to unwrap that bitmap back to `{data, width, height}`

This polyfill is intentionally limited:

- it is designed to support [`ImageLoader`](/docs/modules/images/api-reference/image-loader) and parsed-image helpers
- it does not install `createImageBitmap()`
- it does not attempt to emulate full browser canvas/image interoperability

The optional Sharp backend decodes PNG, JPEG, GIF, WebP, AVIF, TIFF, and SVG into RGBA pixels. It detects formats from the bytes, so a MIME hint is not required. The bitmap wrapper exposes pixel access and `close()`; it does not emulate browser canvas APIs, transferability, or every `createImageBitmap()` option.

## ReadableFile utilities

`@loaders.gl/core/loader-utils` exports `NodeFile` and `NodeFilesystem` wrappers that are installed by this polyfill package. They mirror the browser `HttpFile`/`BlobFile` implementations, exposing a consistent `ReadableFile` interface for local and remote assets without bundling Node built-ins directly into application code.

## Remarks

- The polyfills module can safely be imported in the browser. It is designed to be a no-op in this case, though if you are using new cutting-edge bundlers, they may not respect this configuration.

## Optional Node image codecs

Sharp is an optional peer dependency, not an automatically installed codec.
Install it only in applications that decode or encode images under Node.js:

```sh
npm install @loaders.gl/core sharp
```

Importing `@loaders.gl/core/polyfills` does not load Sharp. The first image decode
or encode loads it lazily; if it is missing or cannot initialize, that operation
reports installation instructions. Browser image operations use browser codecs.
Node file, library, crypto, and native stream support work without Sharp.
