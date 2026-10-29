Texture container

DDS

# Keep compressed desktop texture assets upload-ready.

DDS packages compressed texture blocks, dimensions, and mipmaps in a container common to Direct3D-oriented pipelines. loaders.gl extracts the levels and canonical format metadata for the consuming GPU runtime.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[Compressed textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)

DDS[DDS](https://loaders.gl/next/docs/modules/textures/formats/dds.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

Portable texture delivery

## Package once. Choose the GPU target at runtime.

Containers preserve dimensions and mip levels; portable payloads delay the final format choice until the application knows what the current device supports.

Distributed asset

[**KTX2**container and mip chain↗](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[**Basis**portable supercompression↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[**DDS / PVR**native GPU payloads↗](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)

inspec&#x74;**→**

GPU?

Runtime choice

mipsdevicetranscode

metadata · levels · capabilities

uploa&#x64;**→**

Renderer receives

**BC / S3TC**desktop GPU target

**ETC2 / ASTC**mobile GPU target

**Fallback pixels**when compression is unavailable

The application keeps one asset pipeline while the renderer receives the representation its WebGL or WebGPU device can use efficiently.

Compressed texture path

## Read the levels without expanding them prematurely.

DDS is useful when the runtime can consume the compressed blocks directly. The loader keeps the payload compressed and reports its layout so the application can choose upload or transcode behavior.

01

Header

Dimensions, format flags, mip count, and array/cube metadata.

02

Payload

BC, DXT, and other recognized compressed texture blocks.

03

Levels

Return mip data as a shared TextureLevel representation.

04

Runtime

Upload directly or choose an application-specific fallback.

Detailed guide

## DDS format and API details

The reference below covers the container header, compressed formats, mip-level extraction, and GPU upload boundaries.

* *[`@loaders.gl/textures`](https://loaders.gl/next/docs/modules/textures.md)* - loaders.gl implementation
* *[`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)* - reads DDS containers

DDS, short for DirectDraw Surface, is a Microsoft texture container format widely used to store GPU texture data, especially in Direct3D-oriented pipelines.

Although the name comes from an older Microsoft graphics API, the format remains common in asset pipelines because it can store compressed texture payloads and mipmaps in a single file.

## Why It Is Used[​](#why-it-is-used "Direct link to Why It Is Used")

DDS is often used for:

* precomputed mip chains
* BC / DXT-family compressed textures
* older desktop-oriented real-time rendering pipelines

## loaders.gl Support[​](#loadersgl-support "Direct link to loaders.gl Support")

| Format Feature                    | loaders.gl Support | Notes                                                                                                                                    |
| --------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| DDS container parsing             | ✅ Yes             | Supported by [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md). |
| Mip level extraction              | ✅ Yes             | Returned as `TextureLevel[]`.                                                                                                            |
| Common compressed texture formats | ✅ Yes             | loaders.gl maps known DDS texture formats to canonical texture format identifiers.                                                       |
| Direct GPU upload workflows       | ✅ Yes             | Output is designed for GPU upload by consuming frameworks and applications.                                                              |

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)
* [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)
