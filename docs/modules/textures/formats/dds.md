import {TexturesDocsTabs} from '@site/src/components/docs/textures-docs-tabs';

# DDS

<TexturesDocsTabs active="dds" />

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)_ - reads DDS containers

DDS, short for DirectDraw Surface, is a Microsoft texture container format widely used to store GPU texture data, especially in Direct3D-oriented pipelines.

Although the name comes from an older Microsoft graphics API, the format remains common in asset pipelines because it can store compressed texture payloads and mipmaps in a single file.

## Why It Is Used

DDS is often used for:

- precomputed mip chains
- BC / DXT-family compressed textures
- older desktop-oriented real-time rendering pipelines

## loaders.gl Support

| Format Feature                    | loaders.gl Support | Notes                                                                                                     |
| --------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------- |
| DDS container parsing             | Yes                | Supported by [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader). |
| Mip level extraction              | Yes                | Returned as `TextureLevel[]`.                                                                             |
| Common compressed texture formats | Yes                | loaders.gl maps known DDS texture formats to canonical texture format identifiers.                        |
| Direct GPU upload workflows       | Yes                | Output is designed for GPU upload by consuming frameworks and applications.                               |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CompressedTextureLoader`](/docs/modules/textures/api-reference/compressed-texture-loader)
