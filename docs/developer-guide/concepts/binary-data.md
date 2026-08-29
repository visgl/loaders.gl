---
title: Binary data
description: Move typed bytes efficiently between files, workers, loaders, and renderers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="The transport layer"
  title="Make the bytes do the work."
  description="loaders.gl uses ArrayBuffers and typed views as a shared boundary for file access, parsing, worker transfer, Arrow tables, and GPU upload."
  tone="cyan"
  meta={['ArrayBuffer-first', 'Typed arrays', 'Transferable data']}
  links={[
    {label: 'Apache Arrow', to: '/docs/developer-guide/apache-arrow'},
    {label: 'Worker loaders', to: '/docs/developer-guide/using-worker-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Why binary is the common shape"
  title="Read once. Transfer cheaply. Interpret at the edge."
  description="A binary result can cross a worker boundary or move toward a renderer without first becoming a large graph of JavaScript objects. Typed views add meaning without copying the underlying bytes."
  tone="cyan"
  items={[
    {label: 'Input', value: 'Files, responses, blobs, and byte streams'},
    {label: 'Views', value: 'Uint8Array, DataView, and numeric typed arrays'},
    {label: 'Workers', value: 'Transfer ownership instead of serializing objects'},
    {label: 'Next step', value: 'Arrow columns, compressed data, or GPU buffers'}
  ]}
/>

The loaders.gl API consistently uses `ArrayBuffer`s to represent and transport binary data.

<ReferenceBoundary
  title="Binary representations and conversions"
  description="The sections below explain ArrayBuffers, typed-array views, text encoding, JavaScript binary types, and the conversion utilities provided by loaders.gl."
  tone="cyan"
/>

## Why ArrayBuffers?

One of the design goals of loaders.gl is to provide applications with a single, consistent API that works across (reasonably modern) browsers, worker threads and Node.js. One of the characteristics of this API is how binary data is represented.

loaders.gl "standardizes" on ArrayBuffers for a number of reasons:

- ArrayBuffers are the "canonical" input format for the WebGL API, allowing efficient uploads of large binary data sets to the GPU.
- ArrayBuffers allow ownership to be transferred between threads (Browser Main Thread and WebWorkers), massively improving performance when sending data back from loaders running on web worker to the application/main thread.
- ArrayBuffers are used to transport raw data in most newer JavaScript APIs, including WebSockets, Web Intents, XMLHttpRequest version 2 etc.
- ArrayBuffers are well supported by recent Node.js versions, in fact the traditional Node.js `Buffer` class is now backed by an `ArrayBuffer`.

## ArrayBuffers and Typed Arrays

Recall that typed arrays (e.g. `Float32Array`) are just views into array buffers. Every typed array has a `buffer` reference.

Many loaders.gl functions directly accept typed arrays, which essentially means they accept the associated ArrayBuffer. However, be aware that typed arrays can represent partial views (i.e. they can have offsets) that sometimes need special handling in the application.

## Converting between ArrayBuffers and Strings

We use the `TextEncoder` and `TextDecoder` classes in the JavaScript [string encoding/decoding library](https://github.com/inexorabletash/text-encoding).

Since these classes are central to using ArrayBuffers correctly, loaders.gl provides polyfills for them under Node.js.

## Binary Types in JavaScript

Binary data types in JS:

- `ArrayBuffer`
- `Uint8Array` and other typed arrays, plus
- `DataView`
- `Blob`
- `Buffer` nodejs

Examples of "semi-binary" data types in JS:

- `Array`: Array of bytes (elements are numbers between 0 and 255).
- `String` (binary): string in “binary” form, 1 byte per char (2 bytes).
- `String` (base64): string containing the binary data encoded in a base64 form.

## Converting between ArrayBuffers and other Binary Formats.

Standardizing on ArrayBuffers helps streamline the loaders.gl API. But occasionally applications need to interface with APIs that accept other binary data types/formats. To support this case, loaders.gl provides a small set of utilities (non-exhaustive) for converting from and to other binary JavaScript types/formats, e.g. `toArrayBuffer`:
