# RFC: File System Support in loaders.gl

- **Authors**: Ib Green
- **Date**: Jan 2020
- **Status**: Draft

## Abstract

This RFC discusses structure of loader categories, module naming etc.

## Overview

### Proposal: Clarify what a category is

Update documentation to state that a category provides

- A standardized data format that loaders can return.
- A set of utility functions/classes that helps the application work on that standardized data.

Some loaders have output that can be "converted" to a specific category with some loss of information. In that case they can offer an option to do this conversion.

### Proposal: Category modules

There are already category modles for tables and tiles:

- `@loaders.gl/schema` Tabular loaders: already have a category module with support for table batches and Arrow compatible table access API.
- `@loaders.gl/tiles` 3D tile loaders have a category module: `Tileset3D` class is exported from , which is confusing to users since the intention is that this class supports all 3d tile formats `i3s`, `potree` etc.

There are strong reasons for creating category modules for other categories

- Tabular loaders: already have an `@loaders.gl/schema` module with support for table batches and Arrow compatible table access API.
- Image loaders: `@loaders.gl/images` already exposes a set of utility functions to work on images. These are not necessary to just use the loader and are a cause for bundle size concerns due to the central role of the `ImageLoader`.
- 3D tile loaders: `Tileset3D` class is exported from `@loaders.gl/3d-tiles`, which is confusing to users since the intention is that this class supports all 3d tile formats `i3s`, `potree` etc.
- Scenegraph Loaders: the GLTFLoader comes with a bunch of helper classes but these are not necessarily generalized enough to justify being moved to a category module. However this is essentially a "category of one loader".
- Pointcloud/mesh loaders: There is a single `getmeshsize` utility in another module. Worth considering is any other utilities are likely to be useful for instance packaging loaded meshes as Arrow tables.
- Geospatial loaders: The work on binary output format for geospatial "feature" loaders would seem to point towards a category.

### Idea: Application can specify what category it expects

Right now loaders.gl supports parsing against a list of loaders (pre-registered and/or supplied in the `load` call).

if loaders of different categories are registered, The application may get something back that it can handle, or it may not, and even though it is often clear, there is no standard way to check this, to know what is being returned.

An option could be provided to request data of a certain category only - only loaders capable of returning data in that category's format.

## Idea: Category-level options

This is already being implemented to some extent, could be made more rigorous.
