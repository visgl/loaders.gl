# Basis Universal

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)_ - decodes Basis Universal textures

Basis Universal is a supercompressed texture format designed to be transcoded efficiently into GPU-native compressed texture formats at load time.

Rather than shipping one texture asset per target GPU family, applications can distribute Basis-compressed data and transcode it on the client into a supported runtime format.

## Why It Is Used

Basis Universal is useful when an application needs:

- smaller portable texture distribution assets
- one source asset for multiple GPU format families
- runtime selection of the best supported target texture format

Basis data may appear as:

- raw `.basis` files
- Basis payloads stored inside `.ktx2` containers

## loaders.gl Support

| Format Feature | loaders.gl Support | Notes |
| --- | --- | --- |
| Raw `.basis` input | Yes | Supported by [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader). |
| Basis payloads in KTX2 | Yes | Supported by [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader). |
| Runtime transcoding | Yes | Transcodes into compressed or fallback uncompressed target formats. |
| Automatic format selection | Yes | `basis.format: 'auto'` and `basis.supportedTextureFormats` help select a target format. |
| Preservation of multiple images / mip levels | Yes | Returned as `TextureLevel[][]`. |

## Related Pages

- [`KTX / KTX2`](/docs/modules/textures/formats/ktx)
- [`BasisLoader`](/docs/modules/textures/api-reference/basis-loader)
- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
