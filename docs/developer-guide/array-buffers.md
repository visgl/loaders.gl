# ArrayBuffers

loaders.gl API consistently uses ArrayBuffers to represent and transport binary data.


## Why ArrayBuffers?

One of the design goals of loaders.gl is to provide applications with a single, consistent API that works across (reasonably modern) browsers, worker threads and Node.js. One of the characteristics of this API is how binary data is represented.

loaders.gl "standardizes" on ArrayBuffers for a number of reasons:

* ArrayBuffers are the "canonical" input format for the WebGL API, allowing efficient uploads of large binary data sets to the GPU.
* ArrayBuffers allow ownership to be transferred between threads (Browser Main Thread and WebWorkers), massively improving performance when parsing on loaders.
* ArrayBuffers are used to transport raw data and most newer JavaScript APIs rely on them, including WebSockets, Web Intents, XMLHttpRequest version 2 etc.
* ArrayBuffers are well supported by recent Node.js versions, in fact the traditional Node.js `Buffer` class is now backed by an `ArrayBuffer`.


## ArrayBuffers and Typed Arrays

Recall that typed arrays (e.g. `Float32Array`) are just views into array buffers. Every typed array has a `buffer` reference.

Many loaders.gl functions directly accept typed arrays.

Caveat: typed arrays that are partial views (e.g. with offsets) sometimes need special handling in the application.


## Converting between ArrayBuffers and Strings

Use `TextEncoder` and `TextDecoder` in the JavaScript [string encoding/decoding library](https://github.com/inexorabletash/text-encoding).

Since these classes are central to using ArrayBuffers correctly, loaders.gl re-exports these symbols, transparently polyfilling them under Node.js.


## Converting between ArrayBuffers and other Binary Formats.

While standardizing on ArrayBuffers helps streamline the loaders.gl API and application code, occaionally applications need to interface with APIs that accept other binary data types/formats. To support this case, loaders.gl provides a small set of utilities (non-exhaustive) for converting from and to other binary JavaScript types/formats, e.g. `toArrayBuffer`:

Binary formats in JS:
* ArrayBuffer
* Uint8Array
* Blob
* nodejs Buffer

Examples of semi-"binary" formats in JS:
* array: Array of bytes (numbers between 0 and 255).
* string (binary): string in “binary” form, 1 byte per char (2 bytes).
* string (base64): string containing the binary data encoded in a base64 form.


## Utilities

* [BufferReader/BufferWriter](https://github.com/yuntonyx/arraybuffer-utils) - Helps keep track of current position when working with DataView's through a tightly packed binary object.
