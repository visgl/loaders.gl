Texture format

PVR

# Keep mobile texture payloads and mip levels together.

PVR is a PowerVR-oriented texture container that packages compressed payloads, mipmaps, and texture metadata. loaders.gl exposes those levels in a common texture representation for a GPU runtime to consume.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

PVR[PVR](https://loaders.gl/next/docs/modules/textures/formats/pvr.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

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

GPU texture path

## Decode the container, choose the runtime format later.

The loader preserves mip levels and canonical format metadata while leaving device-specific upload and fallback decisions to the consuming application or graphics framework.

01

Container

PVR headers, dimensions, levels, and compressed payloads.

02

Decode

Read each mip level as TextureLevel data.

03

Describe

Map recognized formats to canonical texture identifiers.

04

Upload

Hand levels to the GPU-oriented texture runtime.

Detailed guide

## PVR format and API details

The reference below covers the PVR container, mip levels, format tagging, and the shared compressed-texture loader path.

* *[`@loaders.gl/textures`](https://loaders.gl/next/docs/modules/textures.md)* - loaders.gl implementation
* *[`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)* - reads PVR containers

PVR is the PowerVR texture container format. It is associated with Imagination Technologies' PowerVR ecosystem and is commonly seen in mobile texture workflows.

The container can store compressed texture payloads together with mipmaps and texture metadata.

## Why It Is Used[​](#why-it-is-used "Direct link to Why It Is Used")

PVR is commonly encountered in:

* PowerVR-oriented mobile pipelines
* PVRTC texture workflows
* offline-generated mipmapped texture assets

## loaders.gl Support[​](#loadersgl-support "Direct link to loaders.gl Support")

| Format Feature                   | loaders.gl Support | Notes                                                                                                                                    |
| -------------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| PVR container parsing            | ✅ Yes             | Supported by [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md). |
| Mip level extraction             | ✅ Yes             | Returned as `TextureLevel[]`.                                                                                                            |
| PVRTC and related format tagging | ✅ Yes             | loaders.gl maps recognized formats to canonical texture format identifiers.                                                              |
| Direct GPU upload workflows      | ✅ Yes             | Output is designed for GPU upload by consuming frameworks and applications.                                                              |

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)
* [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)
