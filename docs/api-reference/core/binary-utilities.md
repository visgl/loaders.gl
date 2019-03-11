# Binary Utilities

loaders.gl provides a set of functions to simplify working with binary data. There are a couple of different ways to deal with binary data in the JavaScript APIs for browser and Node.js, and some small but annoying "gotchas" that can trip up programmers when working with binary data.

## Usage

```
import {toArrayBuffer} from '@loaders.gl/core';
```

## Functions

### toArrayBuffer(binaryData : \*) : ArrayBuffer

"Repackages" a binary data in non-array-buffer form as an `ArrayBuffer`.

- binaryData - ArrayBuffer, Buffer (Node.js), typed array, blob, ...

## Remarks

- Most functions in loaders.gl that accept binary data call `toArrayBuffer(...)` on input parameters before starting processing, thus ensuring that functions work on all types of input data.
