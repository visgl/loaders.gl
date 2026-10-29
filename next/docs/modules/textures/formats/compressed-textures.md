Texture formats

GPU

# Keep compressed texture data compressed until the GPU needs it.

Compressed texture containers package GPU-readable mip levels, arrays, and cube faces. Supercompressed formats add a portable transport layer that can be transcoded to the device’s supported GPU format.

[Textures module](https://loaders.gl/next/docs/modules/textures.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures.md)[Texture category](https://loaders.gl/next/docs/specifications/category-texture.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/specifications/category-texture.md)[Basis format](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/textures/formats/basis.md)

GPU[Compressed Textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[CompressedTextureWriter](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md)

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

Container, payload, device

## Choose the container. Preserve the mip chain. Upload the supported format.

The container carries dimensions, levels, and format metadata. The payload stays opaque to the CPU while the application selects a compatible GPU path.

01

Container

KTX, DDS, or PVR stores texture levels

02

Payload

GPU-compressed blocks or supercompressed data

03

Transcode

Basis Universal chooses a device target

04

Upload

Hand levels to WebGL, WebGPU, or a rendering library

GPU[Compressed Textures](https://loaders.gl/next/docs/modules/textures/formats/compressed-textures.md)[CompressedTextureLoader](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-loader.md)[CompressedTextureWriter](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md)

**Compressed textures** are different from compressed images in that they do not have to be decompressed, they can be used directly by a supporting GPU. However, a compressed texture typically consists of a collection of compressed subimages, representing mipmaps etc. These compressed subimages are stored as an array of "binary blobs" in a container file. Only the container file is parsed, extracting metadata and the binary buffers representing subimages. The binary subimages can then be passed directly to a GPU that understands how to read pixels directly from them without decompressing them first.

**Supercompressed textures** are an intermediate format whose subimages are compressed in a common format. This format can be cheaply transcoded on to a real compressed texture format supported on the current client, without decompressing and recompressing the texture. This allows a single supercompressed texture to be portably used on multiple platforms even though those platforms do not support the same compressed texture formats.

Detailed guide

## Compression and GPU format details

The reference below covers containers, mipmaps, supported compression families, runtime upload, WebGL/WebGPU considerations, and writer prerequisites.

## Performance Considerations[​](#performance-considerations "Direct link to Performance Considerations")

Advantages:

* Compressed textures can allow a lot more textures (\~4x) to be stored in the same amount of GPU memory, which can make a big difference, decreasing memory bandwidth use, or allowing more detail, also mobile devices tend to crash when memory fills up.
* Compressed textures do not need to be decoded before use which reduces CPU load, noticable when many textures are loaded.
* Compressed textures include mipmaps, further reducing CPU load by avoiding mipmap generation step, noticable when many textures are loaded.

On the downside:

* Compressed textures can be somewhat bigger and slower than JPEGs to load over the network. Actual number should be verified but as an example, compressed texture formats might achieve about 4-6x compression, compared to say 15x compression for JPEG.
* Compression tends to be relatively slow. In combination with some IP issues this usually makes it impractical to create GPU compressed textures on the fly.
* Since different devices have different GPUs that support different compressed texture formats, one typically has to provide compressed textures in multiple formats and decide which ones to load at runtime (although basis avoids this problem).

## Container Formats[​](#container-formats "Direct link to Container Formats")

> [Texture Containers](http://www.devans.xyz/2017/04/04/texture-containers.html) This section is based on the information in Dave Evan's helpful Texture Containers article, please refer to it for additional details.

Non-texture image formats do not support storing mipmap chains. When loading a JPG or a PNG, mipmaps must be generated by resizing the original image repeatedly for each required mipmap level.

In contrast, a single texture container can store all the data required for an entire texture, mipmaps, array layers or cubemap faces. Generating mipmaps offline is important if you use compressed textures, as it’s generally impractical to generate compressed textures at runtime.

The main container formats for compressed textures are the Khronos Texture format (KTX) and Microsoft's DirectDraw Surface (DDS). KTX, being a standard, is better specified and therefore recommended.

### KTX (Khronos Texture)[​](#ktx-khronos-texture "Direct link to KTX (Khronos Texture)")

The KTX format is a Khronos Group standard for storing textures. It can store 1D, 2D, 3D, Cubemaps and Array Textures, along with any number of mipmaps for these textures. This makes it ideal for storing almost any kind of texture you could want.

The fields in the KTX header are directly compatible with other Khronos standards such as WebGL. The texture data is described in the `glType`, `glFormat`, `glInternalFormat`, and `glBaseInternalFormat` header fields. These should match up with the parameters to the `gl[Compressed]Tex[Sub]Image*` calls used to submit each texture mipmap level’s data.

* [Khronos KTX Specification](http://github.khronos.org/KTX-Specification)
* [Khronos KTX Software](https://github.com/KhronosGroup/KTX-Software)

### DDS (DirectDraw Surface)[​](#dds-directdraw-surface "Direct link to DDS (DirectDraw Surface)")

The DDS format is in common use for storing textures (despite DirectDraw being long deprecated). Originally only 2D textures were supported, but the D3D10 header extension added support for texture arrays and D3D10+ features. The format is partially documented on MSDN.

* [MSDN: Programming Guide for DDS](https://docs.microsoft.com/en-us/windows/win32/direct3ddds/dx-graphics-dds-pguide)

### PVR (PowerVR)[​](#pvr-powervr "Direct link to PVR (PowerVR)")

The PVR texture compression format defines its own container

<http://cdn.imgtec.com/sdk-documentation/PVR+File+Format.Specification.pdf>

## Compression Formats[​](#compression-formats "Direct link to Compression Formats")

As mentioned the actual compressed subimages are not parsed or modified by loaders.gl, however loaders.gl attempts to identify the formats using metadata and return the appropiate format fields to facilitate use in WebGL and WebGPU.

The following is a list of the most common compressed texture formats, which loaders.gl can properly tag:

| Format                                                                 | aka                | Description                                     |
| ---------------------------------------------------------------------- | ------------------ | ----------------------------------------------- |
| [`S3TC`](https://en.wikipedia.org/wiki/S3_Texture_Compression)         | DXTn, DXTC, or BCn | S3 texture compression formats                  |
| [`PVRTC`](https://en.wikipedia.org/wiki/PVRTC)                         |                    | PowerVR texture compression formats             |
| [`ETC`](https://en.wikipedia.org/wiki/Ericsson_Texture_Compression)    | ETC1, ETC2, EAC    | Ericsoon texture compression formats            |
| [`ASTC`](https://www.khronos.org/opengl/wiki/ASTC_Texture_Compression) |                    | Adaptable, scalable texture compression formats |
| `ATC`                                                                  |                    | AMD texture compression formats                 |

### Recommnended Formats[​](#recommnended-formats "Direct link to Recommnended Formats")

The following could be a starting point for choosing texture formats

Desktop:

* `BC3`(`DXT5`) - transparent textures with full alpha range
* `BC1`(`DXT1`) - opaque textures

iOS:

* `PVR4` - transparent textures with alpha
* `PVR2` - opaque textures

Android:

* `ASTC_4x4`, `ASTC8x8` - transparent textures with full alpha range
* `ETC1` - opaque textures

## Using Compressed Textures[​](#using-compressed-textures "Direct link to Using Compressed Textures")

Compressed textures are designed to be directly uploaded to GPUs that have the required decoding support implemented in hardware.

### Using compressed textures in JS[​](#using-compressed-textures-in-js "Direct link to Using compressed textures in JS")

loaders.gl currently does not provide CPU-side decoding capabilities for compressed textures, meaning that they can only be uploaded directly to supporting GPUs. Use a WebGL context and read back the rendered texture to the client.

### Using Compressed Textures in luma.gl[​](#using-compressed-textures-in-lumagl "Direct link to Using Compressed Textures in luma.gl")

While loaders.gl itself is framework-independent, luma.gl (and other vis.gl frameworks like deck.gl) are designed to seamless consume data loaded by loaders.gl.

Data returned by any loaders.gl "image" category loader (including texture loaders) can be passed directly to luma.gl `Texture2D` class.

### Using Compressed Textures in raw WebGL[​](#using-compressed-textures-in-raw-webgl "Direct link to Using Compressed Textures in raw WebGL")

To use compressed textures in WebGL

```
const texture = gl.createTexture();

gl.bindTexture(gl.TEXTURE_2D, texture);



gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);

gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);



for (let index = 0; index < images.length; ++index) {

  const image = images[index];

  const {width, height, format, data} = image;



  gl.compressedTexImage2D(gl.TEXTURE_2D, index, format, width, height, 0, data);

}



if (images.length > 1) {

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

} else {

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

}
```

### WebGL Extensions[​](#webgl-extensions "Direct link to WebGL Extensions")

Used to query if the GPU supports specific proprietary compressed texture formats.

| Extension                                                                                                                      | Enables                             |
| ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------- |
| \[`WEBGL_compressed_texture_s3tc`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc>)           | S3 texture compression formats      |
| \[`WEBGL_compressed_texture_s3tc_srgb`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc_srgb>) | S3 SRGB texture compression formats |
| \[`WEBGL_compressed_texture_atc`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_atc>)             | AMD texture compression formats     |
| \[`WEBGL_compressed_texture_pvrtc`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc>)         | PowerVR texture compression formats |
| \[`WEBGL_compressed_texture_etc1`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1>)           | texture compression formats         |
| \[`WEBGL_compressed_texture_etc`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc>)             | texture compression formats         |
| \[`WEBGL_compressed_texture_astc`(<https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc>)           | texture compression formats         |

### Using Compressed Textures in WebGPU[​](#using-compressed-textures-in-webgpu "Direct link to Using Compressed Textures in WebGPU")

Support for compressed textures is a work in progress in the [WebGPU standard](https://gpuweb.github.io/gpuweb/#texture-formats).

At the time of writing, only S3 texture compression has been specified:

```
    // BC compressed formats usable if "texture-compression-bc" is both

    // supported by the device/user agent and enabled in requestDevice.

    "bc1-rgba-unorm",

    "bc1-rgba-unorm-srgb",

    "bc2-rgba-unorm",

    "bc2-rgba-unorm-srgb",

    "bc3-rgba-unorm",

    "bc3-rgba-unorm-srgb",

    "bc4-r-unorm",

    "bc4-r-snorm",

    "bc5-rg-unorm",

    "bc5-rg-snorm",

    "bc6h-rgb-ufloat",

    "bc6h-rgb-float",

    "bc7-rgba-unorm",

    "bc7-rgba-unorm-srgb",
```

## Creating Compressed Textures[​](#creating-compressed-textures "Direct link to Creating Compressed Textures")

Texture compression code is usually not readily available, particulary not in JavaScript. Compression is typically done by binary programs, e.g. [PVRTexTool](https://www.imaginationtech.com/developers/powervr-sdk-tools/pvrtextool/).

The loaders.gl `CompressedTextureWriter` can compress textures (under Node.js only) by executing a binary with the appropriate command line, and then loading back the output. The binary it invokes is not bundled with or installed by loaders.gl - see the [`CompressedTextureWriter`](https://loaders.gl/next/docs/modules/textures/api-reference/compressed-texture-writer.md) documentation for the prerequisites.

## IP and Patent Considerations[​](#ip-and-patent-considerations "Direct link to IP and Patent Considerations")

An issue with compressed texture formats is that they tend to be highly propietary and patent-encumbered, and while it is usually no longer an issue, there can be cases where e.g. royalty requirements come into play when using them.

To side-step patent issues when using these formats an application would typically:

1. Generate compressed textures in external applications (which should already have licensed any required formats and libraries).
2. Load them in binary form without touching the content.
3. Pass them directly to a texture, so that they are processed inside the GPU driver (which should also habe licensed the supported formats and libraries).
