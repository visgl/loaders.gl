---
title: registerLoaders
description: Register loaders globally for legacy format auto-selection.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core loader registry"
  title="Make a known loader set available to legacy call sites."
  description="`registerLoaders` adds loader metadata to the global registry so later `load` and `parse` calls can select by format. It remains available for compatibility; new applications should generally pass their loader list explicitly."
  tone="blue"
  meta={['Global registry', 'Format auto-selection', 'Deprecated in v5']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: 'Load API', to: '/docs/modules/core/api-reference/load'}
  ]}
/>

<DocOrientation
  eyebrow="The registry boundary"
  title="Import the loaders once. Let format detection find them."
  description="Registration is a convenience layer around explicit loader lists. Because it mutates global state, it can obscure dependencies and erase useful type information in larger applications."
  tone="blue"
  items={[
    {label: 'Import', value: 'Only the loaders the application needs'},
    {label: 'Register', value: 'Add them to the process-wide registry'},
    {label: 'Detect', value: 'Choose by URL, extension, or content'},
    {label: 'Prefer', value: 'Explicit loader lists for new code'}
  ]}
/>

> **Deprecated** — It is recommended that applications manage loader registration explicitly (for example, by passing loaders directly to `load` and `parse`). This function may be removed in loaders.gl v5.

The loader registry allows applications to cherry-pick which loaders to include in their application bundle by importing just the loaders they need and registering them during initialization.

Applications can then make all those imported loaders available (via format autodetection) to all subsequent `parse` and `load` calls, without those calls having to specify which loaders to use. Because `registerLoaders()` mutates global state and erases loader types, prefer managing registration in your application code:

<ReferenceBoundary
  title="Registry behavior and migration details"
  description="The reference below covers registration, auto-selection, global state, and the explicit-loader pattern recommended for new applications."
  tone="blue"
/>

```typescript
// centralize loader registration in your application instead of relying on the global registry
import {parse} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

export const applicationLoaders = [CSVLoader];

// pass the loaders to each call site
const result = await parse('data.csv', applicationLoaders);
```

## Usage

Sample application initialization code that imports and registers loaders:

```typescript
import {registerLoaders} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders(CSVLoader);
```

Some other file that needs to load CSV:

```typescript
import {load} from '@loaders.gl/core';

// The pre-registered CSVLoader gets auto selected based on file extension...
const data = await load('data.csv');
```

## Functions

### registerLoaders()

```typescript
registerLoaders(loaders : Loader | Loader[])
```

Registers one or more _loader objects_ to a global _loader object registry_, these loaders will be used if no loader object is supplied to `parse` and `load`.

- `loaders` - can be a single loader or an array of loaders. The specified loaders will be added to any previously registered loaders.
