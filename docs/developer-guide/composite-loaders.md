---
title: Composite loaders
description: Let complex formats delegate embedded files and payloads through one loader context.
hide_title: true
page_style: designed
---

import {CompositeConcept} from '@site/src/components/home/concepts';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Composite loaders"
  title="One load can coordinate a whole format."
  description="Complex formats often contain other files, buffers, images, or tile payloads. Composite loaders keep that delegation inside the loader graph, so applications receive a useful result without wiring every nested request themselves."
  links={[
    {label: 'Using loaders', to: '/docs/developer-guide/using-loaders'},
    {label: '3D data formats', to: '/docs/developer-guide/3d-data-formats'}
  ]}
  tone="orange"
/>

<CompositeConcept />

<DocOrientation
  eyebrow="A small contract with a large payoff"
  title="Nested resources stay inside the same loading context."
  description="A composite loader can choose the right member loader, preserve caller options, and resolve relative resources from the original URL. The application still starts with one load call."
  items={[
    {label: 'Delegates', value: 'Embedded buffers, images, meshes, and tile content'},
    {label: 'Preserves', value: 'Loader lists, MIME hints, URLs, and base paths'},
    {label: 'Returns', value: 'The category data expected by the top-level format'}
  ]}
  tone="orange"
  compact
/>

loaders.gl enables loaders to call other loaders (referred to as "sub-loaders" in this section).
This enables loaders for "composite formats" to be "composed" out of loaders for the primitive parts.

An example of sub-loaders can be seen in the `GLTFLoader`, which delegates:

- Draco mesh decoding to the `DracoLoader`
- image decoding to the various `ImageLoaders` and the `BasisLoader`.

Naturally, composite loaders can call other composite loaders, which is for instance used by
the `Tiles3DLoader` which uses the `GLTFLoader` to parse embedded glTF data in certain tiles.

<ReferenceBoundary
  title="The friendly model, then the implementation details"
  description="The graphic above shows the application-level idea. The sections below document the loader context and the rules that make nested loading reliable across workers, URLs, and caller-supplied loaders."
/>

## Calling loaders inside loaders

To call another loader from the parse function of your loader, use the appropriate `parse*WithContext()` function provided by `@loaders.gl/loader-utils`.
Make sure to supply in the `context` parameter .

A conceptual example of a 3D Tiles loader calling the `GLTFLoader` with some additional options.

```typescript
import {parseWithContext} from '@loaders.gl/loader-utils';

export async function parse3DTile(arrayBuffer, options, context) {
  const tile = {};
  // Extract embedded GLB (if present) into `tile.gltfArrayBuffer`
  ...
  if (tile.gltfArrayBuffer) {
    tile.gltf = await parseWithContext(tile.gltfArrayBuffer, GLTFLoader, {gltf: {...}}, context);
  }
}
```

:::caution
While loaders could import `@loaders.gl/core` and use the core `parse*()` functions to call sub-loaders,
it is strongly discouraged for multiple reasons.
Most importantly it prevents loaders.gl from properly handling certain use cases
such as allowing worker-loaders to call other loaders.
The `parse*WithContext()` functions exported by `@loaders.gl/loader-utils` are the right tool for the job.
:::

-

## LoaderContext

When a loader is being called (i.e. one of its `parse*()` functions is being called), a `LoaderContext` object is supplied.

## Base URL Handling

Composite loaders should resolve relative sub-resources from `context.baseUrl`.

- `load(url, loader)` derives the effective base URL from the top-level resource URL and stores it on `context.baseUrl`
- subloader and associated-resource resolution should prefer `context.baseUrl`
- `options.core.baseUrl` is only a fallback for entrypoints that do not have a source URL, such as `parse(text, loader, options)`
- once a loader has a context, it should not keep forwarding `core.baseUrl` into subloader options; child loads should resolve from their own context instead

This keeps base URL state in one place and avoids passing ad hoc base values between composite loaders.

## Forwarding Loader Lists

When a composite loader parses sub-resources, it should preserve the top-level loader list so callers can provide additional member loaders.

- prefer calling subloaders with an array such as `[ImageLoader]`, not a single forced loader
- preserve `context.loaders` so caller-supplied loaders can participate in selection
- when possible, parse the fetched `Response` rather than a detached `ArrayBuffer`, so subloader selection can still use the member URL and MIME type
- if a child resource has its own URL, update the child context so downstream loaders see the correct `context.url` and `context.baseUrl`

This pattern lets a composite loader provide a default member loader while still allowing applications to extend subresource handling.
