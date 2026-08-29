---
title: DracoLoader
description: Decode compressed meshes and point clouds into mesh or Arrow data.
hide_title: true
page_style: designed
---

import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';
import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Draco module · loader API"
  title="DracoLoader"
  description="Decode compressed meshes and point clouds into a render-ready Mesh object or a Mesh Arrow table, with worker and backend controls for browser applications."
  tone="blue"
  meta={['From v1.0', 'Mesh and point cloud', 'WASM / worker capable']}
  links={[
    {label: 'Draco format', to: '/docs/modules/draco/formats/draco'},
    {label: 'DracoWriter', to: '/docs/modules/draco/api-reference/draco-writer'},
    {label: 'Draco module', to: '/docs/modules/draco'}
  ]}
/>

<DracoDocsTabs active="dracoloader" />

<DocOrientation
  eyebrow="What it returns"
  title="Decode once. Keep the geometry useful downstream."
  description="DracoLoader expands compressed attribute maps into the mesh family used by rendering and processing code, while preserving metadata and optional typed columnar output."
  tone="blue"
  items={[
    {label: 'Input', value: 'Draco-compressed mesh or point cloud'},
    {label: 'Default', value: 'Legacy Mesh object'},
    {label: 'Arrow', value: 'Mesh Arrow table with attribute columns'},
    {label: 'Execution', value: 'WASM, JavaScript, or injected Draco backend'}
  ]}
/>

<ReferenceBoundary
  title="DracoLoader reference"
  description="The sections below document usage, output shapes, supported attributes, metadata, backends, and module overrides."
  tone="blue"
/>

![logo](../images/draco-small.png)

`DracoLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression. It returns the legacy [Mesh](/docs/specifications/category-mesh) object by default and can return a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables) with `draco.shape: 'arrow-table'`.

## Usage

```typescript
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const data = await load(url, DracoLoader, options);
const table = await load(url, DracoLoader, {
  worker: false,
  draco: {shape: 'arrow-table'}
});
```

## Shapes

`DracoLoader` returns legacy `Mesh` objects by default. Set `draco.shape` to select another representation.

| Shape         | Output                                                      |
| ------------- | ----------------------------------------------------------- |
| `mesh`        | legacy loaders.gl `Mesh` object                             |
| `arrow-table` | loaders.gl Mesh Arrow table with geometry attribute columns |

## Support

For detailed information

General:

- Supports meshes and point clouds.
- Loads the Draco 1.5.7 decoder dynamically or from package-local assets.
- Supports meshes and point clouds.

Attributes:

- Supports custom attributes.
- Preserves multiple color, texture-coordinate, and other same-category attributes. When a Draco
  file has no name metadata, inferred names are made unique with numeric suffixes such as
  `COLOR_0`, `COLOR_1`, `TEXCOORD_0`, and `TEXCOORD_1`.
- Ability to prevent decompression of specific attributes (returns quantization or octahedron transform parameters, if application wishes to perform decompression on GPU).

Metadata Support:

- Extracts metadata dictionaries, both for the full mesh and for each attribute.
- Supports all Draco metadata field types, including `Int32Array`.

## DracoLoaderOptions

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `draco.shape` | string | `'mesh'` | Output shape: `'mesh'` or `'arrow-table'`. |
| `draco.backend` | string | `'wasm'` when WebAssembly is available | Draco decoder backend: `'wasm'`, `'javascript'`, or `'draco3d'`. |
| `draco.decoderType` | string | `'wasm'` when WebAssembly is available | Deprecated alias for selecting `'wasm'` or the JavaScript fallback. Use `draco.backend` instead. |
| `draco.extraAttributes` | object | `{}` | Additional custom attributes to decode. |
| `draco.attributeNameEntry` | string | N/A | Metadata entry used to map Draco attribute ids to output attribute names. |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.

## Module Overrides

Use `options.modules` to override the Draco decoder runtime used by `DracoLoader`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoLoader` uses `createDecoderModule()` from this object.
- Set `draco.backend: 'draco3d'` to select the injected `modules.draco3d` backend explicitly.
- `'draco_wasm_wrapper.js'`: override the URL used for the Draco WASM decoder wrapper.
- `'draco_decoder.wasm'`: override the URL used for the Draco WASM decoder binary.
- `'draco_decoder.js'`: override the URL used for the Draco JavaScript fallback decoder.

When the default WebAssembly backend cannot be initialized, `DracoLoader` attempts the JavaScript decoder before reporting a load failure. Set `draco.backend: 'javascript'` to select that implementation explicitly.
