---
title: Using writers
description: Encode application data into the formats supported by loaders.gl writers.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API"
  title="Using writers"
  description="Turn tables, geometry, images, and other application data back into portable files with the same explicit module boundaries used for loading."
  tone="yellow"
  meta={['encode() and encodeSync()', 'Format-specific writers', 'Browser and Node.js']}
  links={[
    {label: 'Writer object format', to: '/docs/specifications/writer-object-format'},
    {label: 'Converting data', to: '/docs/developer-guide/converting-data'}
  ]}
/>

<DocOrientation
  eyebrow="The writer path"
  title="Encode the application shape you already have."
  description="Writers sit at the far edge of a pipeline. Convert into the format’s documented input shape, choose the output container, and keep format-specific encoding behind one explicit module."
  tone="yellow"
  items={[
    {label: 'Prepare', value: 'Use a category shape or format-specific writer input'},
    {label: 'Encode', value: 'Call encode() or encodeSync() with one writer'},
    {label: 'Compress', value: 'Pass codec and container options where supported'},
    {label: 'Save', value: 'Write a buffer, stream, file, or application response'}
  ]}
/>

Writers allow applications to encoded data for a number of the formats supported by loaders.gl.

For a detailed specification of the writer object format see the [API reference](/docs/specifications/writer-object-format).

<ReferenceBoundary
  title="Writer inputs and output behavior"
  description="The guide below covers writer selection, category-compatible input data, asynchronous encoding, options, and format-specific boundaries."
  tone="yellow"
/>

## Usage

As an example, to Draco-compress a mesh using the `DracoWriter`:

```typescript
import {DracoWriter} from '@loaders.gl/draco';
import {encode} from '@loaders.gl/core';

const mesh = {
  attributes: {
    POSITION: {...}
  }
};

const data = await encode(mesh, DracoWriter, options);
```

## Input Data

_Writers_ accept the same format of data that is produced by the corresponding loaders. This format is documented either in each loader or usually as part of the documentation for that loader category.

Mesh category writers can accept either plain Mesh objects or Mesh Arrow tables. Plain Mesh data is normalized through the Mesh Arrow table conversion path before encoding.

If applications have data in a different format, they will need to first transform the data to the format expected by the _writer_.
