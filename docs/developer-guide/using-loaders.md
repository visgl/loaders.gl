---
title: Using loaders
description: Choose, configure, and run format loaders through the shared loaders.gl core API.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {LoaderSelectionGraphic} from '@site/src/components/docs/loader-selection-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API"
  title="Using loaders"
  description="Keep application code focused on the result: choose a loader explicitly, or let loaders.gl select one from the formats your app supports."
  tone="pink"
  meta={['load() and parse()', 'TypeScript-aware', 'Explicit or automatic selection']}
  links={[
    {label: 'Get started', to: '/docs/developer-guide/get-started'},
    {label: 'Loader object format', to: '/docs/specifications/loader-object-format'}
  ]}
/>

<LoaderSelectionGraphic />

<DocOrientation
  eyebrow="The loader path"
  title="Choose how much the application wants to know."
  description="Use one known loader when the format is part of the application contract, a list when the input may vary, or the shared registry when discovery belongs to the runtime."
  tone="pink"
  items={[
    {label: 'Explicit', value: 'Pass one loader and retain precise result types'},
    {label: 'Multiple', value: 'Offer compatible loaders for automatic selection'},
    {label: 'Registered', value: 'Add application-wide defaults with registerLoaders()'},
    {label: 'Result', value: 'Use load(), parse(), or loadInBatches() for the chosen shape'}
  ]}
/>

loaders.gl has parser functions that use so-called **loaders** to convert raw file data into parsed
objects. Each loader combines a parser for one format (or related group of formats) with metadata
such as its name, supported extensions, and input type.

<ReferenceBoundary
  title="Selection, options, and runtime behavior"
  description="The guide below covers installation, explicit and automatic selection, TypeScript inference, options, composite loaders, and error handling."
  tone="pink"
/>

## Installing loaders

loaders.gl provides a suite of pre-built loader objects packaged as scoped npm modules. The intention is that applications will install and import loaders only for the formats they need.

## Using Loaders

Loaders are passed into utility functions in the loaders.gl core API to enable parsing of the chosen format.

```typescript
import {load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

const data = await load(url, CSVLoader);
// Application code here
...
```

## Specifying Loaders

As shown above, loaders can be specified directly in a call to `load` or any of the `parse` functions:

```typescript
import {load} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
import {LASLoader} from '@loaders.gl/las';

const pointCloud = await load(url, [PCDLoader, LASLoader]);

// Application code here
...
```

### Loaders and TypeScript

Since v4.0, all loaders are typed, meaning that loaders.gl can infer types for returned data and loader options from the supplied loader.

Note that type inference only works when single loader is provided:

```typescript
import {load} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
import {LASLoader} from '@loaders.gl/las';

// Single loader infers type
const pcdPointCloud = await load(url, PCDLoader); // => type PCDMesh
const lasPointCloud = await load(url, LASLoader); // => type LASMesh

const pointCloud = await load(url, [PCDLoader, LASLoader]); // => type unknown
```

You can use `selectLoader` and a `switch` statement when the input format is unknown but the result should remain typed:

```typescript
import {load, selectLoader} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
import {LASLoader} from '@loaders.gl/las';

const loader = await selectLoader(url, [PCDLoader, LASLoader]);
switch (loader.id) {
  case 'pcd': {
    const pcdPointCloud = await load(url, PCDLoader); // => type PCDMesh
    break;
  }
  case 'las': {
    const lasPointCloud = await load(url, LASLoader); // => type LASMesh
    break;
  }
}
```

### Registering Loaders

Loaders can also be registered globally. To register a loader, use `registerLoaders()`.
Registered loaders will be included in loader selection if you call any form of
`parse()` or `load()` that does not specify a single loader.

```typescript
import {registerLoaders, load} from '@loaders.gl/core';
import {CSVLoader} from '@loaders.gl/csv';

registerLoaders([CSVLoader]);

const data = await load('url.csv'); // => CSVLoader selected from pre-registered loaders
```

Note that in this case the loader type is not known and the return type will be unknown.

:::caution
Relying on global state (such as set by `registerLoaders()`) is not a
recommended application development practice.
It sometimes causes problems later, as it tends to create unexpected dependencies between distant parts of the code.
The mechanism is provided but the choice to use it is yours.
:::

## Selecting Loaders

The loader selection algorithm is exposed to applications via `selectLoader`:

```typescript
import {selectLoader} from '@loaders.gl/core';
import {ArrowLoader} from '@loaders.gl/arrow';
import {CSVLoader} from '@loaders.gl/csv';

const loader = await selectLoader('filename.csv', [ArrowLoader, CSVLoader]); // => CSVLoader
```

Note: Selection works on urls and/or data

## Loader Options

`load`, `parse` and other core functions accept loader options in the form of an options object.

```typescript
parse(data, Loader, {...options});
```

Such loader options objects are organized into nested sub objects, with one sub-object per loader or loader category. This provides a structured way to pass options to multiple loaders.

```typescript
load(url, {
  json: {...},
  csv: {...},
  '3d-tiles': {...},
  gltf: {...}
});
```

An advantage of this design is that since the core functions can select a loader from a list of multiple candidate loaders, or invoke sub-loaders, the nested options system allows separate specification of options to each loader in a single options object.

Loader options are merged with default options using a deep, two-level merge. Any object-valued key on the top level will be merged with the corresponding key value in the default options object.

### Core options

Options that apply to every loader (for instance `fetch`, `worker`, `nothrow`, batching controls, etc.) now live under an explicit `core` sub-object:

```typescript
load(url, Loader, {
  core: {
    fetch: customFetch,
    worker: false,
    nothrow: true,
    shape: 'object-row-table'
  },
  gltf: {...}
});
```

Use `options.core.shape` when you want one shared default return shape across loaders that support shape selection. Loader-scoped options such as `options.csv.shape` or `options.json.shape` still take precedence for that loader. <img src="https://img.shields.io/badge/From-v5.0-blue.svg?style=flat-square" alt="From-v5.0" />

The deprecated top-level forms (`options.fetch`, `options.worker`, `options.nothrow`, `options.shape`, ...) are still supported for backwards compatibility and will continue to emit a warning so that applications can migrate at their own pace. The intent is to make the structure of loader options self-describing by grouping cross-loader settings together under `core`.

## Using Composite Loaders

loaders.gl enables the creation of _composite loaders_ that call other loaders (referred to as "sub-loaders" in this section). This enables loaders for "composite formats" to be quickly composed out of loaders for the primitive parts.

Composite Loader usage is designed to be conceptually simple for applications (loaders.gl handles a number of subtleties under the hood).

A composite loader is called just like any other loader, however there are some additional

### Parameter Passing between Loaders

Loaders and parameters are passed through to sub loaders and are merged so that applications can override them:

```typescript
  parse(data, [Tiles3DLoader, GLTFLoader, DracoLoader], {
    '3d-tiles': {
      ...
    },
    gltf: {
      ...
    }
  });
```

In this example:

- the passed in loaders would override any loaders specified inside the sub-loaders as well as any globally registered loaders.
- The options will be passed through to the sub-loaders, so that the `GLTFLoader` will receive the `gltf` options, merged with any `gltf` options set by the `Tiles3DLoader`.

This override system makes it easy for applications to test alternate sub-loaders or parameter options without having to modify any existing loader code.
