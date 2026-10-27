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
  description="@loaders.gl/core/polyfills installs compatibility shims for file access, fetch, streams, crypto, images, and library loading when the runtime does not provide the browser-shaped API directly."
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
    {label: 'Network', value: 'fetch, Response, and Headers on older Node versions'},
    {label: 'Media', value: 'ImageBitmap and image-data helpers'},
    {label: 'Runtime', value: 'Crypto, streams, and dynamic library loading'}
  ]}
/>

<ReferenceBoundary
  title="Polyfill installation and limits"
  description="The sections below cover installation, installed capabilities, image behavior, readable files, deprecated fetch support, and attribution."
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

Image decoding and encoding require the optional `get-pixels`, `ndarray`, and `save-pixels` packages. Install them when using the Node image adapters. File aliases and prefixes for the polyfills can be configured with `addAliases` and `setPathPrefix` from this subpath.

## Features

The polyfills module installs the following capabilities.

- fetching files from Node file system
- Node Filesystem implementation
- Node ReadableFile and WritableFile implementations
- Node Crypto class
- Node Stream support
- Node library loading
- Image parsing and encoding under Node.js
- A minimal global `ImageBitmap` polyfill plus a global `getImageBitmapData(image)` helper under Node.js

## ImageBitmap Polyfill

When `@loaders.gl/core/polyfills` is imported under Node.js, it installs:

- `globalThis.ImageBitmap` as a lightweight wrapper around decoded image pixels
- `globalThis.getImageBitmapData(image)` to unwrap that bitmap back to `{data, width, height}`

This polyfill is intentionally limited:

- it is designed to support [`ImageBitmapLoader`](/docs/modules/images/api-reference/image-bitmap-loader) and parsed-image helpers
- it does not install `createImageBitmap()`
- it does not attempt to emulate full browser canvas/image interoperability

The Node image decoder support remains limited to the formats supported by the existing loaders.gl image polyfills.

## ReadableFile utilities

`@loaders.gl/core/loader-utils` exports `NodeFile` and `NodeFilesystem` wrappers that are installed by this polyfill package. They mirror the browser `HttpFile`/`BlobFile` implementations, exposing a consistent `ReadableFile` interface for local and remote assets without bundling Node built-ins directly into application code.

## Native Node.js APIs

Supported Node.js versions provide `Blob`, `File`, `fetch`, `Headers`, and `Response`. The polyfills entry point preserves these native globals and exports the native `Blob` and `File` constructors. The filesystem fetch adapter remains available for local files. The `File` export now refers to the native constructor; previously it incorrectly referred to the Node global object.

## Remarks

- The polyfills module can safely be imported in the browser. It is designed to be a no-op in this case, though if you are using new cutting-edge bundlers, they may not respect this configuration.

## Optional Node image codecs

Node file, library, and stream support works without the image codec dependencies.
Streams use Node's native Web Streams implementation. Node image codecs are installed
as optional dependencies and loaded on the first encode or decode request.

If optional dependencies were omitted during installation, install `get-pixels`
for PNG/JPEG/GIF decoding, and `save-pixels` plus `ndarray` for image encoding.
A missing codec reports installation instructions when its image operation is requested.
