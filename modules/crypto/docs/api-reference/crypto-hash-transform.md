# CryptoHashTransform

> The `CryptoHashTransform` is a wrapper around [crypto-js](https://github.com/brix/crypto-js) which is an archived project. Make your choices around whether and how to use this class accordingly (i.e. building on a module that is not actively maintenaned is not ideal for security related algorithms).

<p class="badges">
  <img src="https://img.shields.io/badge/From-v2.3-blue.svg?style=flat-square" alt="From-v2.3" /> 
</p>

## Static Methods

#### `CryptoHashTransform.run(data: ArrayBuffer, options?: object): Promise<string>`

- `options.modules.CryptoJS` the CryptoJS library needs to be supplied by the application.

## Remarks

- This transform supports streaming hashing.
