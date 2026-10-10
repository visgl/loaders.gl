# MD5Hash

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v3.0" />
</p>

Calculates the MD5 hash.

## Interface

Implements the [`Hash](./hash) API.

## Methods

### `constructor(options?: object)`

MD5 hashing returns a native promise. Invalid input, WebAssembly instantiation failures,
and hashing errors reject this promise with the original error.
