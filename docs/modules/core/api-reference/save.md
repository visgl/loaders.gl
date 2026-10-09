---
title: save and saveSync
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

`save` and `saveSync` are not exported by the current `@loaders.gl/core` package.
Use [`encode`](./encode) or `encodeText` to create file contents, then deliver those
contents with your application's storage or download API.

## Node.js example

```typescript
import {writeFile} from 'node:fs/promises';
import {encode} from '@loaders.gl/core';
import {ZipWriter} from '@loaders.gl/zip';

const bytes = await encode({'message.txt': 'Hello'}, ZipWriter);
await writeFile('example.zip', new Uint8Array(bytes));
```

In a browser, wrap the encoded bytes in a `Blob` and use the application's download
or upload flow. See [Using writers](/docs/developer-guide/using-writers).
