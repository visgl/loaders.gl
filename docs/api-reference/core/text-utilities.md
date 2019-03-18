# Text Utilities

`TextEncoder` and `TextDecoder` polyfills are provided to ensure these APIs are always available. In modern browsers these will evaluate to the built-in objects of the same name, however under Node.js polyfills are transparently installed.

## Usage

```js
import {TextEncoder, TextDecoder} from '@loaders.gl/core';
```

## Remarks

- Refer to browser documentation for the usage of these classes, e.g. MDN.
- In the browser, overhead of using these imports is very low, as they refer to built-in classes.
- If working under older browsers, e.g. IE11, you may need to install your own TextEncoder/TextDecoder polyfills before loading this library (to be confirmed...)
