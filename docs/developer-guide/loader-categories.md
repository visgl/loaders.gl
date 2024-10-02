# Loader Categories

To simplify working with multiple similar formats, loaders and writers in loaders.gl are grouped into _categories_.

The idea is that many loaders return very similar data (e.g. point clouds loaders), which makes it possible to represent the loaded data in the same data structure, letting applications handle the output from multiple loaders without

When a loader is documented as belonging to a specifc category, it converts the parsed data into the common format for that category. This allows an application to support multiple formats with a single code path, since all the loaders will return similar data structures.

## Categories and Loader Registration

The fact that loaders belong to categories enable applications to flexibly register new loaders in the same category.

For instance, once an application has added support for one loader in a category, other loaders in the same category can be registered during application startup.

```typescript
import {parse, registerLoaders} from '@loaders.gl/core';
import {PCDLoader} from '@loaders.gl/pcd';
async function loadPointCloud(url) {
  const pointCloud = await parse(fetch(url, PCDLoader));
  // Use some WebGL framework to render the parsed cloud
}
```

## Data Format

Each category documents the returned data format. loaders and writers reference the category documentation.

## Writers and Categories

Writers for a format that belongs to a category accept data objects with fields described by the documentation for that category.

## Accessing Format-Specific Data

Sometimes, not all the properties provided by a certain file format can be mapped to common properties defined by the corresponding loader category.

To access format-specific properties, use the `loaderData` field in data object returned by the loader.

## Available Categories

Categories are described in the specifications section. Some currently defined categories are:

- [Table](/docs/specifications/category-table)
- [PointCloud/Mesh](/docs/specifications/category-mesh)
- [Scenegraph](/docs/specifications/category-scenegraph)
- [GIS](/docs/specifications/category-gis)
