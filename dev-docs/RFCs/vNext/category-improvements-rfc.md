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

Reasons for creating category modules:

- Tabular loaders: already have an `@loaders.gl/tables` module with support for table batches and Arrow compatible table access API.
- Image loaders: `@loaders.gl/images` already exposes a set of utility functions to work on images. These are not necessary to just use the loader and are a cause for bundle size concerns due to the central role of the `ImageLoader`.
- 3D tile loaders: `Tileset3D` class is exported from `@loaders.gl/3d-tiles`, which is confusing to users since the intention is that this class supports all 3d tile formats `i3s`, `potree` etc.
- Scenegraph Loaders: the GLTFLoader comes with a bunch of helper classes but these are not necessarily generalized enough to justify being moved to a category module. However this is essentially a category of one at the moment.
- Pointcloud/mesh loaders: There is a single `getmeshsize` utility in another module. Worth considering is any other utilities might be useful.
- Geospatial loaders: Currently unclear.

### Idea: Application can specify what category it expects

Right now loaders.gl supports parsing against a list of loaders (pre-registered and/or supplied in the `load` call).

if loaders of different categories are registered, The application may get something back that it can handle, or it may not, and even though it is often clear, there is no standard way to check this, r know what is being returned.

An option could be provided to request data of a certain category only.

## Idea: Category-level options
