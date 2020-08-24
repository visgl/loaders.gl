# CryptoHashTransform

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

## Static Methods

#### `CryptoHashTransform.hash(data: ArrayBuffer, options?: object): Promise<string>`

#### `CryptoHashTransform.hashSync(data: ArrayBuffer, options?: object): string`

- `options.modules.CryptoJS` the CryptoJS library needs to be supplied by the application.

## Remarks

- This transform supports streaming hashing.
