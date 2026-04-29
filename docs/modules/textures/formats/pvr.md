import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';

# PVR

<TexturesDocsTabs active="pvr" />

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)_ - reads PVR containers

PVR is the PowerVR texture container format. It is associated with Imagination Technologies' PowerVR ecosystem and is commonly seen in mobile texture workflows.

The container can store compressed texture payloads together with mipmaps and texture metadata.

## Why It Is Used

PVR is commonly encountered in:

- PowerVR-oriented mobile pipelines
- PVRTC texture workflows
- offline-generated mipmapped texture assets

## loaders.gl Support

| Format Feature                   | loaders.gl Support | Notes                                                                                                     |
| -------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| PVR container parsing            | Yes                | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader). |
| Mip level extraction             | Yes                | Returned as `TextureLevel[]`.                                                                             |
| PVRTC and related format tagging | Yes                | loaders.gl maps recognized formats to canonical texture format identifiers.                               |
| Direct GPU upload workflows      | Yes                | Output is designed for GPU upload by consuming frameworks and applications.                               |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)
