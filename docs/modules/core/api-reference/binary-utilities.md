---
title: Binary utilities
description: Normalize browser and Node.js binary inputs into predictable ArrayBuffer views before parsing.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / binary data"
  title="Make binary inputs predictable before decoding."
  description="Browser and Node.js APIs represent bytes in several compatible but non-identical forms. The core binary utilities normalize those inputs so loaders and application code can share one boundary."
  tone="cyan"
  meta={['ArrayBuffer normalization', 'Typed arrays and Buffer', 'Browser and Node.js']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Binary data guide', to: '/docs/developer-guide/concepts/binary-data'},
    {label: 'Loader options', to: '/docs/modules/core/api-reference/loader-options'}
  ]}
/>

<DocOrientation
  eyebrow="Binary input boundary"
  title="Normalize once, then let the format parser work."
  description="The utility functions handle the common differences between ArrayBuffer, typed arrays, Node.js Buffer, Blob, and related values. This keeps format-specific code focused on decoding rather than transport representation."
  tone="cyan"
  items={[
    {label: 'Accept', value: 'ArrayBuffer, Buffer, typed arrays, Blob, and related binary values.'},
    {label: 'Normalize', value: 'Convert compatible input into an ArrayBuffer representation.'},
    {label: 'Decode', value: 'Pass stable bytes to loaders, parsers, and format utilities.'},
    {label: 'Share', value: 'Use the same helper across browser and Node.js paths.'}
  ]}
/>

<ReferenceBoundary
  title="Binary utility reference"
  description="The detailed reference lists normalization functions, accepted inputs, view boundaries, and the cases where a copy may be required."
  tone="cyan"
/>

loaders.gl provides a set of functions to simplify working with binary data. There are a couple of different ways to deal with binary data in the JavaScript APIs for browser and Node.js, and some small but annoying "gotchas" that can trip up programmers when working with binary data.

## Usage

```typescript
import {toArrayBuffer} from '@loaders.gl/core';
```

## Functions

### toArrayBuffer(binaryData : \*) : ArrayBuffer

"Repackages" a binary data in non-array-buffer form as an `ArrayBuffer`.

- binaryData - ArrayBuffer, Buffer (Node.js), typed array, blob, ...

## Remarks

- Most functions in loaders.gl that accept binary data call `toArrayBuffer(...)` on input parameters before starting processing, thus ensuring that functions work on all types of input data.
