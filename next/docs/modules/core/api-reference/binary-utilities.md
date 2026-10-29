Core API / binary data

# Make binary inputs predictable before decoding.

Browser and Node.js APIs represent bytes in several compatible but non-identical forms. The core binary utilities normalize those inputs so loaders and application code can share one boundary.

[Core module](https://loaders.gl/next/docs/modules/core.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core.md)[Binary data guide](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/concepts/binary-data.md)[Loader options](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/loader-options.md)

Binary input boundary

## Normalize once, then let the format parser work.

The utility functions handle the common differences between ArrayBuffer, typed arrays, Node.js Buffer, Blob, and related values. This keeps format-specific code focused on decoding rather than transport representation.

01

Accept

ArrayBuffer, Buffer, typed arrays, Blob, and related binary values.

02

Normalize

Convert compatible input into an ArrayBuffer representation.

03

Decode

Pass stable bytes to loaders, parsers, and format utilities.

04

Share

Use the same helper across browser and Node.js paths.

Detailed guide

## Binary utility reference

The detailed reference lists normalization functions, accepted inputs, view boundaries, and the cases where a copy may be required.

loaders.gl provides a set of functions to simplify working with binary data. There are a couple of different ways to deal with binary data in the JavaScript APIs for browser and Node.js, and some small but annoying "gotchas" that can trip up programmers when working with binary data.

## Usage[​](#usage "Direct link to Usage")

```
import {toArrayBuffer} from '@loaders.gl/core/loader-utils';
```

## Functions[​](#functions "Direct link to Functions")

### toArrayBuffer(binaryData : \*) : ArrayBuffer[​](#toarraybufferbinarydata----arraybuffer "Direct link to toArrayBuffer(binaryData : *) : ArrayBuffer")

Converts an `ArrayBuffer`, shared array buffer, typed-array view, Node.js buffer, or string to an `ArrayBuffer`. Strings are encoded as UTF-8. Full-buffer views can reuse their backing buffer; partial views are sliced to their byte range, and shared buffers are copied.

Native `Blob` values require asynchronous reading with `await blob.arrayBuffer()`; this synchronous helper does not read them.
