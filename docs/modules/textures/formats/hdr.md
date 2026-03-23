# Radiance HDR

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader)_ - loads Radiance RGBE `.hdr` files as `TextureLevel[]`

Radiance HDR is a classic high-dynamic-range raster image format commonly used for lighting environments, skyboxes, reflections, and tone-mapping test images in graphics pipelines.

The most common `.hdr` files used in realtime rendering are Radiance RGBE images:

- 3 color channels plus a shared exponent
- High dynamic range values, including values above `1.0`
- Efficient storage for bright light sources such as suns, studio lights, and emissive skies

## Why `.hdr` Is Used In Graphics

Unlike PNG and JPEG, Radiance HDR preserves scene-referred light intensity instead of clamping everything into low-dynamic-range display values.

That matters for:

- image-based lighting
- physically based rendering
- reflections
- exposure and tone-mapping validation

## File Structure

A Radiance HDR file typically contains:

- a magic header such as `#?RADIANCE` or `#?RGBE`
- metadata lines including `FORMAT=32-bit_rle_rgbe`
- an image size line such as `-Y 256 +X 512`
- scanline pixel data, commonly encoded with Radiance RLE

The pixel payload is usually stored as RGBE:

- `R`, `G`, `B` are mantissas
- `E` is a shared exponent for the pixel

`HDRLoader` decodes that representation into linear floating-point RGBA data with alpha synthesized to `1.0`.

## loaders.gl Support

Use [`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader) to load standard 2D Radiance RGBE `.hdr` textures.

Current scope:

- standard 2D Radiance `.hdr` images
- old flat pixel data and standard Radiance RLE scanlines
- decoded `Float32Array` output
- returned as a single `TextureLevel[]` entry with `textureFormat: 'rgba32float'`

Not included in this first release:

- cube map helpers
- environment-map preprocessing
- half-float output
- non-Radiance HDR container formats

## Related Pages

- [`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader)
- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)
