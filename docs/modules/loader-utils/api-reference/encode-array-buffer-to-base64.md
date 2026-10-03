# encodeArrayBufferToBase64

Encodes an `ArrayBuffer` as a padded base64 string in browsers and Node.js.

```typescript
import {encodeArrayBufferToBase64} from '@loaders.gl/loader-utils';

const encoded = encodeArrayBufferToBase64(new Uint8Array([1, 2, 3, 4]).buffer);
// "AQIDBA=="
```

## Parameters

- `arrayBuffer`: The bytes to encode. The input is not modified.

## Returns

A base64 string without a data-URI prefix. An empty buffer returns an empty string.
Encoding uses bounded chunks to avoid argument limits while retaining padding only at the end.
