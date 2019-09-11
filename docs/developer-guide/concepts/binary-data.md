# Binary Data

The loaders.gl API consistently uses `ArrayBuffer`s to represent and transport binary data.

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
