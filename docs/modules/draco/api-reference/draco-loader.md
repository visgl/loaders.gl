# DracoLoader

![logo](../images/draco-small.png)

The `DracoArrowLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression and returns a [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables).

`DracoLoader` parses the same Draco format and returns the legacy [Mesh](/docs/specifications/category-mesh) object.

| Loader         | Characteristic                             |
| -------------- | ------------------------------------------ |
| File Format    | [Draco](/docs/modules/draco/formats/draco) |
| Data Format    | [Mesh Arrow table](/docs/specifications/category-mesh#mesh-arrow-tables), [Mesh](/docs/specifications/category-mesh) |
| File Extension | `.drc`                                     |
| File Type      | Binary                                     |
| Supported APIs | `parse`                                    |

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

## Usage

```typescript
import {DracoArrowLoader, DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const table = await load(url, DracoArrowLoader, options);
const data = await load(url, DracoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.

## Module Overrides

Use `options.modules` to override the Draco decoder runtime used by `DracoLoader`.

- `modules.draco3d`: supply the bundled `draco3d` package. `DracoLoader` uses `createDecoderModule()` from this object.
- `'draco_wasm_wrapper.js'`: override the URL used for the Draco WASM decoder wrapper.
- `'draco_decoder.wasm'`: override the URL used for the Draco WASM decoder binary.
- `'draco_decoder.js'`: override the URL used for the Draco JavaScript fallback decoder.
