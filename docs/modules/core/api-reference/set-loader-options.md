---
title: Loader options
description: Configure shared loaders.gl behavior and module-specific options through the global loader options object.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Core API / configuration"
  title="Set shared options once, keep individual calls focused."
  description="setLoaderOptions() merges application-wide defaults for core and loader modules. Use it for stable runtime configuration such as decoder modules, then override individual operations when a request needs different behavior."
  tone="yellow"
  meta={['Global defaults', 'Module-specific options', 'Per-call overrides']}
  links={[
    {label: 'Core module', to: '/docs/modules/core'},
    {label: 'LoaderOptions', to: '/docs/modules/core/api-reference/loader-options'},
    {label: 'Worker loaders', to: '/docs/developer-guide/using-worker-loaders'}
  ]}
/>

<DocOrientation
  eyebrow="Configuration scope"
  title="Configure the runtime at the edge."
  description="Global options are useful for module registration and shared defaults, but the effective options still come from the merge of global, loader, and operation-level settings."
  tone="yellow"
  items={[
    {label: 'Register', value: 'Provide decoder modules or shared runtime dependencies.'},
    {label: 'Default', value: 'Set module-specific options used by later operations.'},
    {label: 'Override', value: 'Pass operation options when one request needs a different policy.'},
    {label: 'Inspect', value: 'Read the current merged global options with getLoaderOptions().' }
  ]}
/>

<ReferenceBoundary
  title="Loader options reference"
  description="The detailed reference covers set/get behavior, merge semantics, module namespaces, and the relationship to parse and loader options."
  tone="yellow"
/>

Set or get the supplied options onto the current global options object

## Usage

Bundling the entire `draco3d` library (instead of loading it on-demand from CDN):

```typescript
import draco from 'draco3d';
import {setLoaderOptions} from '@loaders.gl/core';
setLoaderOptions({
  modules: {
    draco3d
  }
});
```

## Functions

### setLoaderOptions(options: LoaderOptions) : void

Merges the supplied options into the current global options

- `options`: See [`LoaderOptions`](./loader-options).

### getLoaderOptions() : LoaderOptions

Returns current global options

## Options

A loader object, that can contain a mix of options:

- options defined by the `parse` function can be specified.
- options specific to any loaders can also be specified (in loader specific sub-objects).

Please refer to the corresponding documentation page for `parse` and to each loader for details.
