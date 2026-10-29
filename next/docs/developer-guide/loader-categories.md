Composable APIs

# Design apps around your data, not data formats.

Loader categories normalize related formats into shared structures, so your application code can stay focused on the data.

meshtableGISscenegraph

category

tablemeshGISscenegraph

Category data

### Load many formats into one application path.

Category data lets related loaders return compatible structures, so rendering, analysis, and export code can be shared.

MeshTableGISImageJSONScenegraph3D Tiles

Arrow TablePlain

Decode

[Draco​Loader↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-loader.md)[LAS​Loader↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-loader.md)[OBJ​Loader↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-loader.md)[PCD​Loader↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-loader.md)[PLY​Loader↗](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-loader.md)[Quantized​Mesh​Loader↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-loader.md)[Terrain​Loader↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/terrain-loader.md)

Data

[Mesh Arrow tableArrow columns↗](https://loaders.gl/next/docs/specifications/category-mesh.md)

Encode

[Draco​Writer↗](https://loaders.gl/next/docs/modules/draco/api-reference/draco-writer.md)[LAS​Writer↗](https://loaders.gl/next/docs/modules/pointclouds/las/api-reference/las-writer.md)[OBJ​Writer↗](https://loaders.gl/next/docs/modules/scene/obj/api-reference/obj-writer.md)[PCD​Writer↗](https://loaders.gl/next/docs/modules/pointclouds/pcd/api-reference/pcd-writer.md)[PLY​Writer↗](https://loaders.gl/next/docs/modules/pointclouds/ply/api-reference/ply-writer.md)[Quantized​Mesh​Writer↗](https://loaders.gl/next/docs/modules/raster/terrain/api-reference/quantized-mesh-writer.md)

Category data

## Change the input format without changing the app.

A loader category defines a compatible result shape. Your application can register another loader in the same category without growing another rendering, analysis, or export path.

01

Common result

A documented shape shared by related loaders

02

Typical groups

Tables, GIS, images, textures, meshes, and scenes

03

Writers follow

Writers accept the category shape as input

04

Format-specific data

Use loaderData when the common shape is not enough

## Start here[​](#start-here "Direct link to Start here")

Choose a loader category when your application should accept several formats without separate code paths for each one. The category defines the common result shape, while each loader handles its own file format.

To simplify working with related formats, loaders and writers in loaders.gl are grouped into *categories*. A category defines the data shape that an application can rely on after loading, so one rendering, analysis, or export path can accept several input formats.

Each loader still preserves format-specific details in `loaderData` when they do not fit the common shape. Category data is therefore a stable application boundary, not a promise that every format has identical capabilities.

Detailed guide

## The category contract

The detailed sections explain registration, returned data formats, writers, and the escape hatch for format-specific fields.

## Categories and Loader Registration[​](#categories-and-loader-registration "Direct link to Categories and Loader Registration")

The fact that loaders belong to categories enables applications to register additional loaders in the same category.

For instance, an application can register several point-cloud loaders during startup and let the shared loader selector choose between them:

```
import {load, registerLoaders} from '@loaders.gl/core';

import {LASLoader} from '@loaders.gl/pointclouds/las';

import {PCDLoader} from '@loaders.gl/pointclouds/pcd';



registerLoaders([LASLoader, PCDLoader]);



async function loadPointCloud(url: string) {

  const pointCloud = await load(url);

  // Use some WebGL framework to render the parsed cloud

}
```

## Data format[​](#data-format "Direct link to Data format")

Each category documents the returned data format. Loaders and writers reference the category documentation.

## Writers and categories[​](#writers-and-categories "Direct link to Writers and categories")

Writers for a format that belongs to a category accept data objects with fields described by the documentation for that category.

## Accessing format-specific data[​](#accessing-format-specific-data "Direct link to Accessing format-specific data")

Sometimes, not all the properties provided by a certain file format can be mapped to common properties defined by the corresponding loader category.

To access format-specific properties, use the `loaderData` field in data object returned by the loader.

## Available Categories[​](#available-categories "Direct link to Available Categories")

Categories are described in the specifications section. Some currently defined categories are:

* [Table](https://loaders.gl/next/docs/specifications/category-table.md)
* [Image](https://loaders.gl/next/docs/specifications/category-image.md)
* [Texture](https://loaders.gl/next/docs/specifications/category-texture.md)
* [PointCloud/Mesh](https://loaders.gl/next/docs/specifications/category-mesh.md)
* [Scenegraph](https://loaders.gl/next/docs/specifications/category-scenegraph.md)
* [GIS](https://loaders.gl/next/docs/specifications/category-gis.md)
* [JSON](https://loaders.gl/next/docs/specifications/category-json.md)
* [3D Tiles](https://loaders.gl/next/docs/specifications/category-3d-tiles.md)
