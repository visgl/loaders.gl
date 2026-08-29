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
  description="loaders.gl favors portable Web APIs, with an explicit polyfill package for Node.js environments that do not provide fetch, Response, or related globals."
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

Firstly, to run loaders.gl on Node.js you want to import the `@loaders.gl/polyfills` module.

Also it is good to understand that loaders.gl avoids using Node.js specific APIs (such as Buffer, path, util, fs, streams etc) instead favoring browser compatible equivalents. loaders.gl is optimized for cross-platform compatible APIs.

However, if your goal is to write Node.js-idiomatic code rather than browser-portable code, you may find that working with loaders.gl can require some extra work.

## Polyfills

To install these polyfills, just `import` the polyfills module before start using loaders.gl.

```typescript
import '@loaders.gl/polyfills';
import {parse} from '@loaders.gl/core';
```

## Combining with other Polyfills

loaders.gl only installs polyfills if the corresponding global symbol is `undefined`. This means that if another polyfill is already installed when `@loaders.gl/polyfills` is imported, the other polyfill will remain in effect. Since most polyfill libraries work this way, applications can mix and match polyfills by ordering the polyfill import statements appropriately (but see the remarks below for a possible caveat).

## Provided Polyfills

See [API Reference](/docs/modules/polyfills/api-reference).

## Remarks
