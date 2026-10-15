---
title: writeFile
description: Save encoded writer output with a platform filesystem or download API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';

<DocPageHeader
  eyebrow="Core API / file output"
  title="Encode data, then save it with your platform."
  description="The current core package provides encoding APIs. Applications deliver the encoded bytes through Node.js files, browser downloads, or uploads."
  tone="mint"
  meta={['Encoding', 'Platform storage']}
  links={[
    {label: 'Encode API', to: '/docs/modules/core/api-reference/encode'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

`writeFile` and `writeFileSync` are not exported by the current
`@loaders.gl/core` package. Encoding and file delivery are separate operations:
use [`encode`](./encode) to produce bytes and a platform storage API to save them.

## Node.js example

```typescript
import {writeFile} from 'node:fs/promises';
import {encode} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const bytes = await encode({'message.txt': 'Hello'}, ZipWriter);
await writeFile('example.zip', new Uint8Array(bytes));
```

For synchronous Node.js output, use `writeFileSync` from `node:fs` with bytes
produced by `encodeSync`, provided the writer supports synchronous encoding.
Browser applications can use a `Blob` with their download or upload flow.
