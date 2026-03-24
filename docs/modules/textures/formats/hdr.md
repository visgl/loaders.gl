# Radiance HDR

- _[`@loaders.gl/textures`](/docs/modules/textures)_ - loaders.gl implementation
- _[`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader)_ - loads Radiance RGBE `.hdr` files as `Texture`

Radiance HDR is a classic high-dynamic-range raster image format commonly used for lighting environments, skyboxes, reflections, and tone-mapping test images in graphics pipelines.

## Origin And History

The format was defined by Greg Ward as part of the Radiance lighting simulation and rendering system. In Greg Ward's later retrospective on HDR encodings, he notes that work on Radiance began in 1985 at Lawrence Berkeley National Laboratory and that the system needed an image format that could preserve photometric values rather than quantizing everything down to conventional 24-bit display RGB.

That led to the RGBE representation used by Radiance picture files:

- three 8-bit mantissas for red, green, and blue
- one shared 8-bit exponent
- compact storage compared to full 96-bit float RGB

Ward later described this encoding in _Graphics Gems II_ ("Real Pixels", 1991), and the format shipped as part of the freely available Radiance system. In practice, this is the historical reason `.hdr` and `.pic` files show up so often in rendering, lighting, and image-based-lighting workflows.

## Format Revisions

Radiance's own documentation notes an important format change between Radiance release 1.4 and release 2.0:

- release 1.4 and earlier used an older, simpler run-length encoding
- the newer format switched to per-component scanline RLE
- older files remained readable
- newer files became the standard form produced by Radiance tools

This is why modern loaders usually target the `FORMAT=32-bit_rle_rgbe` form and support the older flat/non-RLE fallback only for compatibility.

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

The file is typically recognizable by:

- a magic header such as `#?RADIANCE`
- a format line such as `FORMAT=32-bit_rle_rgbe`
- a resolution line such as `-Y 256 +X 512`

## loaders.gl Support

Use [`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader) to load standard 2D Radiance RGBE `.hdr` textures.

| Format Feature | loaders.gl Support | Notes |
| --- | --- | --- |
| Standard 2D Radiance `.hdr` images | Yes | Returned as a `Texture` with `shape: 'texture'` and `type: '2d'`. |
| Radiance RGBE pixel decoding | Yes | Decoded to linear floating-point RGBA data. |
| Standard Radiance scanline RLE | Yes | Supports `FORMAT=32-bit_rle_rgbe`. |
| Older flat / non-RLE pixel data | Yes | Supported as a compatibility fallback. |
| Float output | Yes | Exposed as `Float32Array`. |
| Cube map helpers | No | Applications must assemble cube textures separately. |
| Environment-map preprocessing | No | No PMREM, convolution, or other lighting preprocessing utilities are included. |
| Half-float output | No | Output is currently `Float32Array` only. |
| Non-Radiance HDR container formats | No | This loader targets Radiance RGBE `.hdr` files, not EXR or other HDR image formats. |

## Related Pages

- [`HDRLoader`](/docs/modules/textures/api-reference/hdr-loader)
- [`Compressed Textures`](/docs/modules/textures/formats/compressed-textures)

## References

- [The RADIANCE Picture File Format](https://radsite.lbl.gov/radiance/refer/Notes/picture_format.html)
- [ra_rgbe(1) manual page](https://radsite.lbl.gov/radiance/man_html/ra_rgbe.1.html)
- [High Dynamic Range Image Encodings](https://www.anyhere.com/gward/hdrenc/Encodings.pdf)
