# DracoLoader

The `DracoLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.

| Loader         | Characteristic                               |
| -------------- | -------------------------------------------- |
| File Extension | `.drc`                                       |
| File Type      | Binary                                       |
| File Format    | [Draco](https://google.github.io/draco/)     |
| Data Format    | [Mesh](docs/specifications/category-mesh.md) |
| Supported APIs | `parse`                                      |

Features:

- Supports meshes and point clouds.
- Supports custom attributes.
- Extracts metadata dictionaries, both for the full mesh and for each attribute.
- Supports all Draco metadata field types, including `Int32Array`.
- Loads draco decoders dynamically from CDN (can optionally be bundled).
- Ability to prevent decompression of specific attributes (returns quantization or octahedron transform parameters).

## Usage

```js
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const data = await load(url, DracoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.
