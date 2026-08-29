---
title: writeFile
description: Write encoded data through a browser- and Node.js-compatible file helper.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core output API"
  title="Carry encoded bytes to the application’s file boundary."
  description="`writeFile` and `writeFileSync` provide a small compatibility layer for saving writer output across browser and Node.js environments. The encoding step remains the responsibility of the selected writer."
  tone="mint"
  meta={['Browser and Node.js', 'Writer output', 'Async and sync helpers']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Encode API', to: '/docs/modules/core/api-reference/encode'},
    {label: 'Using writers', to: '/docs/developer-guide/using-writers'}
  ]}
/>

<DocOrientation
  eyebrow="The output boundary"
  title="Encode with a writer. Save with the environment-aware helper."
  description="The core helper keeps file delivery separate from format encoding, allowing the same writer pipeline to target browser downloads, Node.js files, or data URLs where supported."
  tone="mint"
  items={[
    {label: 'Input', value: 'A destination URL or path plus writer output'},
    {label: 'Encode', value: 'Format-specific writer produces bytes'},
    {label: 'Write', value: 'Environment-specific file delivery'},
    {label: 'Options', value: 'Path prefix and standard loader options'}
  ]}
/>

A file save utilities that (attempts to) work consistently across browser and node.

<ReferenceBoundary
  title="Writing and environment details"
  description="The reference below covers asynchronous and synchronous helpers, supported environments, path prefixes, and the separation between encoding and file delivery."
  tone="mint"
/>

## Usage

```typescript
import {writeFile} from '@loaders.gl/core';
import {DracoWriter} from '@loaders.gl/draco';

await writeFile(url, DracoWriter);
```

## Functions

### writeFile(url : String [, options : Object]) : Promise.ArrayBuffer

Reads the raw data from a file asynchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

### writeFileSync(url : String [, options : Object]) : ArrayBuffer

> Only works on Node.js or using data URLs.

Reads the raw data from a "file" synchronously.

Notes:

- Any path prefix set by `setPathPrefix` will be appended to relative urls.

## Remarks

- The use of the loaders.gl `writeFile` and `writeFileAsync` functions is optional, loaders.gl loaders can be used with any data loaded via any mechanism the application prefers, e.g. `fetch`, `XMLHttpRequest` etc.
- The "path prefix" support is intentended to be a simple mechanism to support certain work-arounds. It is intended to help e.g. in situations like getting test cases to load data from the right place, but was never intended to support general application use cases.
