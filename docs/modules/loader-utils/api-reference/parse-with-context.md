---
title: parseFromContext
description: Invoke a sub-loader with the parent loader context when parsing embedded or associated resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities / composition"
  title="Let a composite loader delegate without losing context."
  description="parseFromContext() and its synchronous and batched variants provide a shared way for one loader to invoke another for embedded data or associated resources. Parent options, paths, and runtime context remain available to the sub-loader."
  tone="violet"
  meta={['Composite loaders', 'Embedded resources', 'Shared loader context']}
  links={[
    {label: 'Loader utilities', to: '/docs/modules/loader-utils'},
    {label: 'Composite loaders', to: '/docs/developer-guide/composite-loaders'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Delegated parsing"
  title="Keep nested formats inside the same loading contract."
  description="A composite format can slice or locate embedded data, then call the appropriate sub-loader with the context that explains where that data came from and how related resources should resolve."
  tone="violet"
  items={[
    {label: 'Locate', value: 'Extract embedded or associated content from the parent format.'},
    {label: 'Delegate', value: 'Call a sub-loader through the context-aware helper.'},
    {label: 'Preserve', value: 'Carry options, paths, and runtime hooks across the boundary.'},
    {label: 'Choose', value: 'Use async, sync, or batched variants for the nested data.'}
  ]}
/>

<ReferenceBoundary
  title="parseFromContext reference"
  description="The detailed reference covers async, sync, and batched delegation, loader context, options, and composite-loader usage."
  tone="violet"
/>

Use these helpers inside a composite loader to delegate parsing while retaining
its loader context. They are exported from `@loaders.gl/loader-utils`.

## Usage

```typescript
import {parseFromContext} from '@loaders.gl/loader-utils';
import {OBJLoader} from '@loaders.gl/obj';

async function parseEmbeddedMesh(arrayBuffer, options, context) {
  const meshBytes = arrayBuffer.slice(100, 200);
  return await parseFromContext(meshBytes, OBJLoader, options, context);
}
```

## Functions

| Helper | Result | Requirement |
| --- | --- | --- |
| `parseFromContext(data, loader, options, context)` | Promise of decoded data | Parent parsing context. |
| `parseSyncFromContext(data, loader, options, context)` | Decoded data | Context with synchronous parsing and a synchronous child parser. |
| `parseInBatchesFromContext(data, loader, options, context)` | Promise of an async batch iterable | Context with batched parsing. |

Pass the context supplied to the parent parser. Published loader modules must not
import core to make nested parsing calls. New implementations can also use the
`context.coreApi` methods, passing the parent context explicitly.
