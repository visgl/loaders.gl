---
title: parseWithContext
description: Invoke a sub-loader with the parent loader context when parsing embedded or associated resources.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Loader utilities / composition"
  title="Let a composite loader delegate without losing context."
  description="parseWithContext() and its synchronous and batched variants provide a shared way for one loader to invoke another for embedded data or associated resources. Parent options, paths, and runtime context remain available to the sub-loader."
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
  title="parseWithContext reference"
  description="The detailed reference covers async, sync, and batched delegation, loader context, options, and composite-loader usage."
  tone="violet"
/>

Use when invoking a sub-loader from a loader, to parse embedded data or perhaps an associated resource.

## Usage

```typescript
import {parseWithContext} from '@loaders.gl/loader-utils';
import {OBJLoader} from '@loaders.gl/obj';

parse(data: ArrayBuffer, options: LoaderOptions, context?: LoaderContext) {
  const subData = data.slice(100, 200);
  data = await parseWithContext(subData, OBJLoader, options, context);
}
...
```

## Functions

### parse

### parseSyncWithContext

### parseInBatchesWithContext
