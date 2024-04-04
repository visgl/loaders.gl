# DracoLoader

![logo](../images/draco-small.png)

The `DracoLoader` decodes a mesh or point cloud (maps of attributes) using [DRACO](https://google.github.io/draco/) compression.

| Loader         | Characteristic                             |
| -------------- | ------------------------------------------ |
| File Format    | [Draco](/docs/modules/draco/formats/draco)   |
| Data Format    | [Mesh](/docs/specifications/category-mesh) |
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
import {DracoLoader} from '@loaders.gl/draco';
import {load} from '@loaders.gl/core';

const data = await load(url, DracoLoader, options);
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |

## Dependencies

Draco libraries by default are loaded from CDN, but can be bundled and injected. See [modules/draco/docs] for details.
