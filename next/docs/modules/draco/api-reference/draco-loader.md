Draco module · loader API

![](/next/images/format-logos/draco-logo.svg)

# DracoLoader

Decode compressed meshes and point clouds into a render-ready Mesh object or a Mesh Arrow table, with worker and backend controls for browser applications.

[Draco format](https://loaders.gl/next/docs/modules/draco/formats/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)[Draco module](https://loaders.gl/next/docs/modules/draco.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/draco.md)

![](/next/images/format-logos/draco-logo.svg)[Try It](https://loaders.gl/next/examples/pointclouds/draco)[Overview](https://loaders.gl/next/docs/modules/draco/formats/draco.md)[Format](https://loaders.gl/next/docs/modules/draco/format.md)[DracoLoader](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[DracoWriter](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)

What it returns

## Decode once. Keep the geometry useful downstream.

DracoLoader expands compressed attribute maps into the mesh family used by rendering and processing code, while preserving metadata and optional typed columnar output.

01

Input

Draco-compressed mesh or point cloud

02

Default

Mesh Arrow table

03

Arrow

Mesh Arrow table with attribute columns

04

Execution

WASM, JavaScript, or injected Draco backend

Detailed guide

## DracoLoader reference

The sections below document usage, output shapes, supported attributes, metadata, backends, and module overrides.

`DracoLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression. It returns a [Mesh Arrow table](https://loaders.gl/next/docs/specifications/category-mesh.md#mesh-arrow-tables) by default. Set `draco.shape: 'mesh'` for the legacy [Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md) object.

## Usage[​](#usage "Direct link to Usage")

```
import {DracoLoader} from '@loaders.gl/draco';

import {load} from '@loaders.gl/core';



const data = await load(url, DracoLoader, options);

const table = await load(url, DracoLoader, {

  worker: false,

  draco: {shape: 'arrow-table'}

});
```

## Shapes[​](#shapes "Direct link to Shapes")

`DracoLoader` returns Mesh Arrow tables by default. Set `draco.shape` to select another representation.

| Shape         | Output                                                      |
| ------------- | ----------------------------------------------------------- |
| `mesh`        | legacy loaders.gl `Mesh` object                             |
| `arrow-table` | loaders.gl Mesh Arrow table with geometry attribute columns |

## Support[​](#support "Direct link to Support")

For detailed information

General:

* Supports meshes and point clouds.
* Loads the Draco 1.5.7 decoder dynamically or from package-local assets.
* Supports meshes and point clouds.

Attributes:

* Supports custom attributes.
* Preserves multiple color, texture-coordinate, and other same-category attributes. When a Draco file has no name metadata, inferred names are made unique with numeric suffixes such as `COLOR_0`, `COLOR_1`, `TEXCOORD_0`, and `TEXCOORD_1`.
* Ability to prevent decompression of specific attributes (returns quantization or octahedron transform parameters, if application wishes to perform decompression on GPU).

Metadata Support:

* Extracts metadata dictionaries, both for the full mesh and for each attribute.
* Supports all Draco metadata field types, including `Int32Array`.

## DracoLoaderOptions[​](#dracoloaderoptions "Direct link to DracoLoaderOptions")

| Option                     | Type   | Default                                | Description                                                               |
| -------------------------- | ------ | -------------------------------------- | ------------------------------------------------------------------------- |
| `draco.shape`              | string | `'arrow-table'`                        | Output shape: `'arrow-table'` or `'mesh'`.                                |
| `draco.backend`            | string | `'wasm'` when WebAssembly is available | Draco decoder backend: `'wasm'`, `'javascript'`, or `'draco3d'`.          |
| `draco.extraAttributes`    | object | `{}`                                   | Additional custom attributes to decode.                                   |
| `draco.attributeNameEntry` | string | N/A                                    | Metadata entry used to map Draco attribute ids to output attribute names. |

## Dependencies[​](#dependencies "Direct link to Dependencies")

`draco.decoderProfile` selects `'full'` (the default) or `'gltf'`, the smaller decoder subset for glTF-compatible mesh bitstreams. The glTF loader selects `'gltf'` by default when decoding `KHR_draco_mesh_compression`; callers can explicitly select `'full'` to share one runtime.

Draco libraries load from a CDN by default. Browser applications can bundle the vendored runtimes with `getDracoLibraryOptions` from the existing `@loaders.gl/draco/bundled` entrypoint.

## Bundled Library Options[​](#bundled-library-options "Direct link to Bundled Library Options")

`getDracoLibraryOptions({decoderProfile})` returns the selected profile and a `modules` map for its matching WASM wrapper and binary, the encoder, and the JavaScript fallback. It preserves supplied `CDN` and `useLocalLibraries` settings; explicit `modules` overrides win. The helper owns the asset URLs, so applications do not need to maintain filename mappings. Only requested runtimes are fetched. This opt-in entrypoint keeps asset references out of the metadata-only root import.

```
import {parse} from '@loaders.gl/core';

import {DracoLoader} from '@loaders.gl/draco';

import {getDracoLibraryOptions} from '@loaders.gl/draco/bundled';



const libraries = getDracoLibraryOptions({decoderProfile: 'gltf'});

const mesh = await parse(bytes, DracoLoader, {

  core: {worker: false},

  modules: libraries.modules,

  draco: {shape: 'mesh', decoderProfile: libraries.decoderProfile}

});
```

The example uses main-thread parsing; applications using loader workers must also supply a bundled worker URL if CDN worker loading is unwanted. Library URL overrides are strings and can be passed to workers without transferring functions.

## Module Overrides[​](#module-overrides "Direct link to Module Overrides")

Use `options.modules` to override the Draco decoder runtime used by `DracoLoader`.

* `modules.draco3d`: supply the bundled `draco3d` package. `DracoLoader` uses `createDecoderModule()` from this object.
* Set `draco.backend: 'draco3d'` to select the injected `modules.draco3d` backend explicitly.
* `'draco_wasm_wrapper.js'`: override the URL used for the Draco WASM decoder wrapper.
* `'draco_decoder.wasm'`: override the URL used for the Draco WASM decoder binary.
* `'draco_decoder.js'`: override the URL used for the Draco JavaScript fallback decoder.

When the default WebAssembly backend cannot be initialized, `DracoLoader` attempts the JavaScript decoder before reporting a load failure. Set `draco.backend: 'javascript'` to select that implementation explicitly.
