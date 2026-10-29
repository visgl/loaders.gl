Core API / file output

# Encode data, then save it with your platform.

The current core package provides encoding APIs. Applications deliver the encoded bytes through Node.js files, browser downloads, or uploads.

[Encode API](https://loaders.gl/next/docs/modules/core/api-reference/encode.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/core/api-reference/encode.md)[Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/developer-guide/using-writers.md)

`save` and `saveSync` are not exported by the current `@loaders.gl/core` package. Use [`encode`](https://loaders.gl/next/docs/modules/core/api-reference/encode.md) or `encodeText` to create file contents, then deliver those contents with your application's storage or download API.

## Node.js example[​](#nodejs-example "Direct link to Node.js example")

```
import {writeFile} from 'node:fs/promises';

import {encode} from '@loaders.gl/core';

import {ZipWriter} from '@loaders.gl/archives/zip';



const bytes = await encode({'message.txt': 'Hello'}, ZipWriter);

await writeFile('example.zip', new Uint8Array(bytes));
```

In a browser, wrap the encoded bytes in a `Blob` and use the application's download or upload flow. See [Using writers](https://loaders.gl/next/docs/developer-guide/using-writers.md).
