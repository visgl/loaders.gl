Core API / file output

# Encode data, then save it with your platform.

The current core package provides encoding APIs. Applications deliver the encoded bytes through Node.js files, browser downloads, or uploads.

[Encode API](https://loaders.gl/next/docs/modules/core/api-reference/encode.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/encode.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

`writeFile` and `writeFileSync` are not exported by the current `@loaders.gl/core` package. Encoding and file delivery are separate operations: use [`encode`](https://loaders.gl/next/docs/modules/core/api-reference/encode.md) to produce bytes and a platform storage API to save them.

## Node.js example[​](#nodejs-example "Direct link to Node.js example")

```
import {writeFile} from 'node:fs/promises';

import {encode} from '@loaders.gl/core';

import {ZipWriter} from '@loaders.gl/archives/zip';



const bytes = await encode({'message.txt': 'Hello'}, ZipWriter);

await writeFile('example.zip', new Uint8Array(bytes));
```

For synchronous Node.js output, use `writeFileSync` from `node:fs` with bytes produced by `encodeSync`, provided the writer supports synchronous encoding. Browser applications can use a `Blob` with their download or upload flow.
