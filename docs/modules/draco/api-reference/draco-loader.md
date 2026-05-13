import {DracoDocsTabs} from '@site/src/components/docs/draco-docs-tabs';

# Draco Loaders

<DracoDocsTabs active="dracoloader" />

<p class="badges">
  <img src="https://img.shields.io/badge/From-v1.0-blue.svg?style=flat-square" alt="From-v1.0" />
</p>

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
- Loads draco decoders dynamically from CDN (can optionally be bundled).
- Supports meshes and point clouds.

Attributes:

- Supports custom attributes.
- Ability to prevent decompression of specific attributes (returns quantization or octahedron transform parameters, if application wishes to perform decompression on GPU).

Metadata Support:

- Extracts metadata dictionaries, both for the full mesh and for each attribute.
- Supports all Draco metadata field types, including `Int32Array`.

## DracoLoaderOptions

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `draco.shape` | string | `'mesh'` | Output shape: `'mesh'` or `'arrow-table'`. |
| `draco.decoderType` | string | `'wasm'` when WebAssembly is available | Draco decoder runtime: `'wasm'` or `'js'`. |
| `draco.extraAttributes` | object | `{}` | Additional custom attributes to decode. |
| `draco.attributeNameEntry` | string | N/A | Metadata entry used to map Draco attribute ids to output attribute names. |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.

## Module Overrides

Use `options.modules` to override the Draco decoder runtime used by `DracoLoader`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoLoader` uses `createDecoderModule()` from this object.
- `'draco_wasm_wrapper.js'`: override the URL used for the Draco WASM decoder wrapper.
- `'draco_decoder.wasm'`: override the URL used for the Draco WASM decoder binary.
- `'draco_decoder.js'`: override the URL used for the Draco JavaScript fallback decoder.
