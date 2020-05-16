# RFC: Separate images category module

- **Authors**: Ib Green
- **Date**: May 2020
- **Status**: For Review

See also
- category improvements rfc

## Abstract

This RFC discusses structure of loader categories, module naming etc.

## Motivations

Jusifications for creating an image category modules:

- `@loaders.gl/images` exposes a growing set of utility functions to work on images. 
- But these are not necessary to just use the loader and are a cause for bundle size concerns due to the central role of the `ImageLoader` in most apps.
- Also we now have `BasisLoader` and `CompressedImageLoader` in this category and may soon have a `GIFWriter` module.

## Proposal: Split images module into a loader and a category module

- `@loaders.gl/image` A new module that contains only the minimal loaders and  the binary sniffing methods need for the arraybuffer tests.

- `@loaders.gl/images` The existing name becomes the category module. For backwards compatibility, it re-exports the `@loaders.gl/image` module.

Applications can now opt to reduce the size of their dependency by importing `@loaders.gl/image`, and we can continue to develop strong image utilities in the category module.


## Prior Art: Other category modules

Other examples of category modules
- `@loaders.gl/tables` Tabular loaders: already have a category module with support for table batches and Arrow compatible table access API.
- `@loaders.gl/tiles` 3D tile loaders have a category module: `Tileset3D` class is exported from , which is confusing to users since the intention is that this class supports all 3d tile formats `i3s`, `potree` etc.

Scenegraph, pointcloud/mesh and GIS loaders do not yet have category modules but there are strong reasons to believe that this will happen, see the separate RFC on category modules linked at the top.
