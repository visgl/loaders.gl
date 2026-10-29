GPU texture container

![](/next/images/format-logos/ktx-logo.svg)

# Keep the texture layout with the payload.

KTX and KTX2 package the metadata needed to interpret texture levels, arrays, cube maps, and compressed GPU data. KTX2 also provides a standard home for Basis Universal payloads.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Compressed texture loader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)

![](/next/images/format-logos/ktx-logo.svg)[KTX](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[BasisLoader](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)[KTX2BasisWriter](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md)

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

Container responsibilities

## Describe how the GPU should read the bytes.

KTX containers carry dimensions, levels, layers, faces, and format information alongside the image payload. The loader exposes that structure instead of reducing it to one ordinary image.

01

Layouts

2D, 3D, array, and cube texture images

02

Levels

Mip chains with dimensions and byte sizes

03

Payloads

Native compressed blocks or Basis supercompression

04

Runtime

Texture metadata for WebGL, WebGPU, or another renderer

* *[`@loaders.gl/textures`](https://loaders.gl/next/docs/modules/textures.md)* - loaders.gl implementation
* *[`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)* - reads KTX and KTX2 containers
* *[`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)* - decodes Basis-compressed payloads commonly stored in KTX2

KTX is the Khronos texture container format for GPU textures. It is designed to store texture metadata and one or more texture images in a layout that maps cleanly onto graphics APIs.

Detailed guide

## KTX structure and runtime support

The sections below compare KTX revisions, describe supported container features, and show the loaders.gl return shapes.

KTX2 is the newer revision of the container. In realtime graphics workflows it is commonly used either for directly stored GPU texture payloads or as a container for Basis Universal supercompressed textures.

## Why It Is Used[​](#why-it-is-used "Direct link to Why It Is Used")

KTX containers are designed for texture data rather than conventional images:

* they can store mip chains
* they can store array, 3D, and cube texture layouts
* they preserve GPU-oriented format metadata
* they avoid re-encoding texture payloads at load time

## KTX vs KTX2[​](#ktx-vs-ktx2 "Direct link to KTX vs KTX2")

| Format | Status            | Notes                                                                                           |
| ------ | ----------------- | ----------------------------------------------------------------------------------------------- |
| KTX2   | Newer revision    | Common in modern realtime pipelines, including use as a container for Basis Universal payloads. |
| KTX    | Original revision | Still a Khronos texture container, but less flexible than KTX2 for newer workflows.             |

## loaders.gl Support[​](#loadersgl-support "Direct link to loaders.gl Support")

| Format Feature         | loaders.gl Support | Notes                                                                                                                                                |
| ---------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| KTX container parsing  | ✅                 | Supported by [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md).             |
| KTX2 container parsing | ✅                 | Supported by [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md).             |
| KTX2 Basis transcoding | ✅                 | Use [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md) when the KTX2 payload needs Basis transcoding. |
| Mip level extraction   | ✅                 | Returned as `TextureLevel[]` or `TextureLevel[][]` depending on loader.                                                                              |
| GPU format tagging     | ✅                 | loaders.gl maps known container formats to WebGL and canonical texture format identifiers.                                                           |

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)
* [`Basis Universal`](https://loaders.gl/next/docs/modules/textures/formats/basis.md)
* [`CompressedTextureLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)
* [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)
