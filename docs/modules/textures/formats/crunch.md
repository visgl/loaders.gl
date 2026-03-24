# Crunch

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)_ - reads Crunch `.crn` textures

Crunch is a lossy texture compression format designed to reduce distribution size for GPU texture assets, especially BC / DXT-style texture data.

It is not just a generic image format. In practice, Crunch is used as an intermediate distribution format for textures that will be expanded or decoded for GPU-oriented use.

## Why It Is Used

Crunch is commonly used when a pipeline wants:

- smaller downloadable texture assets
- mipmapped texture distribution
- compatibility with DXT-family texture workflows

## loaders.gl Support

| Format Feature               | loaders.gl Support | Notes                                                                                    |
| ---------------------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| `.crn` parsing               | Yes                | Supported by [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader). |
| Mip level extraction         | Yes                | Returned as `TextureLevel[]`.                                                            |
| GPU texture metadata tagging | Yes                | loaders.gl reports recognized texture format metadata on decoded levels.                 |
| Worker-based loading         | Yes                | Exposed through the Crunch worker loader path.                                           |

## Related Pages

- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
- [`CrunchWorkerLoader`](/docs/modules/textures/api-reference/crunch-loader)
