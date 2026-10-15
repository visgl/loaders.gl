---
title: Node.js support
description: Use loaders.gl from Node.js while keeping the shared browser-compatible API available.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Server-side JavaScript"
  title="Use the same loaders in Node.js and the browser."
  description="loaders.gl uses portable Web APIs and provides Node.js adapters for local files, images, streams, and crypto."
  tone="blue"
  meta={['Node.js', 'Portable APIs', 'Optional polyfills']}
  links={[
    {label: 'Polyfills module', to: '/docs/modules/polyfills/api-reference'},
    {label: 'Preferred JavaScript APIs', to: '/docs/developer-guide/concepts/javascript-apis'}
  ]}
/>

<DocOrientation
  eyebrow="The Node.js boundary"
  title="Install the platform pieces, keep the data path portable."
  description="Import polyfills when the runtime needs them. The core loaders continue to use browser-compatible abstractions for fetching, files, streams, and binary data."
  tone="blue"
  items={[
    {label: 'Setup', value: 'Import @loaders.gl/polyfills when required'},
    {label: 'Core', value: 'Use fetch, Response, and ArrayBuffer APIs'},
    {label: 'Files', value: 'Adapt local data through readable-file APIs'},
    {label: 'Compatibility', value: 'Keep application code portable where useful'}
  ]}
/>

loaders.gl uses portable Web APIs such as `ArrayBuffer`, `Response`, and Web
Streams. Modern Node.js provides the basic APIs needed to parse in-memory data
and load HTTP URLs.

## Node.js adapters

Install and import `@loaders.gl/polyfills` before using features that require its
Node.js adapters, including local-file loading and image decoding:

```bash
yarn add @loaders.gl/polyfills
```

```typescript
import '@loaders.gl/polyfills';
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const table = await load('data.csv', CSVLoader);
```

The package registers filesystem, image, stream, and crypto adapters with
loaders.gl. It also supplies missing globals where applicable. Do not import it
in a browser bundle.

## Combining polyfills

Global polyfills are installed only when the corresponding global is absent.
Import another polyfill first if you want its implementation to take precedence.
The loaders.gl adapters are registered separately from these globals.

See the [polyfills API reference](/docs/modules/polyfills/api-reference) for details.
