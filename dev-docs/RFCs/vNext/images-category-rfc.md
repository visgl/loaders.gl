# RFC: Separate images category module

- **Authors**: Ib Green
- **Date**: May 2020
- **Status**: For Review

See also

- category improvements rfc

## Abstract

This RFC discusses how an images category should be defined.

## Background

- `@loaders.gl/images` exposes a growing set of utility functions to work on images.
- But these are not necessary to just use the loader and are a cause for bundle size concerns due to the central role of the `ImageLoader` in most apps.
- Also we now have `BasisLoader` and `CompressedImageLoader` in this category and may soon have a `GIFWriter` module.

### Prior Art: Other category modules

Other examples of category modules

- `@loaders.gl/schema` Tabular loaders: already have a category module with support for table batches and Arrow compatible table access API.
- `@loaders.gl/tiles` 3D tile loaders have a category module: `Tileset3D` class is exported from , which is confusing to users since the intention is that this class supports all 3d tile formats `i3s`, `potree` etc.

Scenegraph, pointcloud/mesh and GIS loaders do not yet have category modules but there are strong reasons to believe that this will happen, see the separate RFC on category modules linked at the top.

## Proposal: Textures module

- Rename the basis module to `@loaders.gl/textures`
- Move the texture loading utils to the textures module

This will save a ~2-3KB in the images module.

## Proposal (WITHDRAWN): Split images module into an "image loader module" and an "images category module"

Status: Currently withdrawn. This idea was [attempted](https://github.com/visgl/loaders.gl/pull/746) but failed to give substantial memory savings. It may make more sense later on if the image category API keeps growing.

The proposal is:

- `@loaders.gl/image` A new module that contains only the minimal loaders and the binary sniffing methods need for the arraybuffer tests.

- `@loaders.gl/images` The existing name becomes the category module. For backwards compatibility, it re-exports the `@loaders.gl/image` module.

With this chanve, applications could now opt to reduce the size of their dependency by importing `@loaders.gl/image`, and we can continue to develop strong image utilities in the category module.
