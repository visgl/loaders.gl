Portable texture payload

BASIS

# Ship one compressed asset. Transcode at the edge.

Basis Universal keeps distribution compact and postpones the final texture choice until the runtime knows which GPU formats the device supports. It can travel as a standalone Basis file or inside KTX2.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)

BASIS[Basis](https://loaders.gl/next/docs/modules/textures/formats/basis.md)[BasisLoader](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)[KTX2BasisWriter](https://loaders.gl/next/docs/modules/textures/api-reference/ktx2-basis-texture-writer.md)

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

The delivery tradeoff

## Separate distribution format from device format.

A Basis payload is optimized for transport. At load time, the transcoder selects a compressed or fallback representation that the current rendering device can use.

01

Input

Raw .basis files or Basis payloads in .ktx2

02

Runtime choice

Target selected from device texture capabilities

03

Preserves

Images, mip levels, dimensions, and texture metadata

04

Output

TextureLevel data ready for the rendering layer

* *[`@loaders.gl/textures`](https://loaders.gl/next/docs/modules/textures.md)* - loaders.gl implementation
* *[`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)* - decodes Basis Universal textures

Basis Universal is a supercompressed texture format designed to be transcoded efficiently into GPU-native compressed texture formats at load time.

Detailed guide

## Basis format and transcoding details

The sections below document containers, runtime selection, returned levels, and loaders.gl compatibility.

Rather than shipping one texture asset per target GPU family, applications can distribute Basis-compressed data and transcode it on the client into a supported runtime format.

## Why It Is Used[​](#why-it-is-used "Direct link to Why It Is Used")

Basis Universal is useful when an application needs:

* smaller portable texture distribution assets
* one source asset for multiple GPU format families
* runtime selection of the best supported target texture format

Basis data may appear as:

* raw `.basis` files
* Basis payloads stored inside `.ktx2` containers

## loaders.gl Support[​](#loadersgl-support "Direct link to loaders.gl Support")

| Format Feature                               | loaders.gl Support | Notes                                                                                                           |
| -------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------- |
| Raw `.basis` input                           | ✅ Yes             | Supported by [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md). |
| Basis payloads in KTX2                       | ✅ Yes             | Supported by [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md). |
| Runtime transcoding                          | ✅ Yes             | Transcodes into compressed or fallback uncompressed target formats.                                             |
| Automatic format selection                   | ✅ Yes             | `basis.format: 'auto'` and `basis.supportedTextureFormats` help select a target format.                         |
| Preservation of multiple images / mip levels | ✅ Yes             | Returned as `TextureLevel[][]`.                                                                                 |

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`KTX / KTX2`](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)
* [`BasisLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/basis-loader.md)
* [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)
