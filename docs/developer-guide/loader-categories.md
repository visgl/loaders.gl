---
title: Loader categories
description: Keep one application path while accepting multiple related data formats.
hide_title: true
page_style: designed
---

import {CapabilityHero} from '@site/src/components/docs/capability-hero';
import {CategoryDataConcept} from '@site/src/components/home/concepts';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<CapabilityHero capability="categories" />

<CategoryDataConcept />

<DocOrientation
  eyebrow="Category data"
  title="Change the input format without changing the app."
  description="A loader category defines a compatible result shape. Your application can register another loader in the same category without growing another rendering, analysis, or export path."
  tone="yellow"
  items={[
    {label: 'Common result', value: 'A documented shape shared by related loaders'},
    {label: 'Typical groups', value: 'Tables, GIS, images, textures, meshes, and scenes'},
    {label: 'Writers follow', value: 'Writers accept the category shape as input'},
    {label: 'Format-specific data', value: 'Use loaderData when the common shape is not enough'}
  ]}
/>

## Start here

Choose a loader category when your application should accept several formats without separate code
paths for each one. The category defines the common result shape, while each loader handles its own
file format.

To simplify working with multiple similar formats, loaders and writers in loaders.gl are grouped into _categories_.

The idea is that many loaders return very similar data (e.g. point clouds loaders), which makes it possible to represent the loaded data in the same data structure, letting applications handle the output from multiple loaders without

When a loader is documented as belonging to a specifc category, it converts the parsed data into the common format for that category. This allows an application to support multiple formats with a single code path, since all the loaders will return similar data structures.

<ReferenceBoundary
  title="The category contract"
  description="The detailed sections explain registration, returned data formats, writers, and the escape hatch for format-specific fields."
  tone="yellow"
/>

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
- [Image](/docs/specifications/category-image)
- [Texture](/docs/specifications/category-texture)
- [PointCloud/Mesh](/docs/specifications/category-mesh)
- [Scenegraph](/docs/specifications/category-scenegraph)
- [GIS](/docs/specifications/category-gis)
