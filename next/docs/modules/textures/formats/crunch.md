Legacy compressed texture

Crunch

# Keep an older compressed texture path understandable.

Crunch reduces distribution size for BC/DXT-style texture assets. It remains useful for existing pipelines, while newer web workflows generally prefer Basis Universal in KTX2 for broader GPU portability.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[CrunchWorkerLoader](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)[Basis and KTX2](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

Crunch[Crunch](https://loaders.gl/next/docs/modules/textures/formats/crunch.md)[CrunchWorkerLoader](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)

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

Distribution and decode

## Preserve compact assets while the pipeline transitions.

Crunch is a delivery encoding rather than a final rendering policy. The loader exposes compressed levels and metadata so an existing runtime can continue to consume the asset or migrate it to a newer container.

01

Input

Crunch \`.crn\` compressed texture files.

02

Decode

Read mip levels and recognized texture format metadata.

03

Runtime

Use the worker loader path for browser-friendly decoding.

04

Migration

Prefer Basis Universal and KTX2 for new cross-device pipelines.

Detailed guide

## Crunch format and API details

The reference below covers CRN payloads, mip levels, worker loading, format metadata, and the relationship to modern Basis workflows.

* *[`@loaders.gl/textures`](https://loaders.gl/next/docs/modules/textures.md)* - loaders.gl implementation
* *[`CrunchWorkerLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)* - reads Crunch `.crn` textures

Crunch is a lossy texture compression format designed to reduce distribution size for GPU texture assets, especially BC / DXT-style texture data.

It is not just a generic image format. In practice, Crunch is used as an intermediate distribution format for textures that will be expanded or decoded for GPU-oriented use.

Crunch is typically not used for new texture pipelines. In modern workflows it has largely been replaced by Basis Universal, often carried in KTX2 containers, because that path is more portable across GPU format families and fits current web and realtime graphics tooling better.

## Why It Is Used[​](#why-it-is-used "Direct link to Why It Is Used")

Crunch is commonly used when a pipeline wants:

* smaller downloadable texture assets
* mipmapped texture distribution
* compatibility with DXT-family texture workflows

## loaders.gl Support[​](#loadersgl-support "Direct link to loaders.gl Support")

| Format Feature               | loaders.gl Support | Notes                                                                                                                   |
| ---------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `.crn` parsing               | ✅                 | Supported by [`CrunchWorkerLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md). |
| Mip level extraction         | ✅                 | Returned as `TextureLevel[]`.                                                                                           |
| GPU texture metadata tagging | ✅                 | loaders.gl reports recognized texture format metadata on decoded levels.                                                |
| Worker-based loading         | ✅                 | Exposed through the Crunch worker loader path.                                                                          |

## Related Pages[​](#related-pages "Direct link to Related Pages")

* [`Basis Universal`](https://loaders.gl/next/docs/modules/textures/formats/basis.md)
* [`KTX / KTX2`](https://loaders.gl/next/docs/modules/textures/formats/ktx.md)
* [`Compressed Textures`](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)
* [`CrunchWorkerLoader`](https://loaders.gl/next/docs/modules/textures/api-reference/crunch-loader.md)
