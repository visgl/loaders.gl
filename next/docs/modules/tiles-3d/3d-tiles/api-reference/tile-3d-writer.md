3D Tiles API / writer

![](/next/images/format-logos/3d-tiles-logo.png)

# Writing is a separate format boundary.

Tiles3DWriter is reserved for a future writer path. This page makes the current status explicit and points to the supported readers, converters, and lower-level writers available today.

[3D Tiles module](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles.md)[Tiles3DLoader](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/3d-tiles/api-reference/tiles-3d-loader.md)[Tile converter](https://loaders.gl/next/docs/modules/tile-converter.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tile-converter.md)

Current boundary

## Use the supported path for now.

loaders.gl can load and traverse 3D Tiles, and the tile converter can translate between I3S and 3D Tiles. A general-purpose Tiles3DWriter is not currently exposed.

01

Read

Use Tiles3DLoader and Tiles3DSource for existing datasets.

02

Convert

Use tile-converter for I3S ↔ 3D Tiles preparation workflows.

03

Write content

Use glTF, Draco, or other supported payload writers where applicable.

04

Status

No public Tiles3DWriter implementation is available yet.

Detailed guide

## Writer status and adjacent APIs

This page remains intentionally short until a writer contract exists; the links above point to the reader and conversion APIs that are currently supported.

`Tiles3DWriter` is not currently implemented. There is no public `encode()` or `encodeURLtoURL()` path for producing a complete 3D Tiles tileset from loaders.gl data.

For content-writing workflows, write the payload format separately—for example with [`GLTFWriter`](https://loaders.gl/next/docs/modules/scene/gltf/api-reference/gltf-writer.md) or [`DracoWriter`](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)—then assemble and publish the tileset with a format-specific toolchain.
