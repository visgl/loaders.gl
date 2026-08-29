---
title: Shapefile
description: Load Shapefile geometry and attributes as geospatial table data.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Shapefile module"
  title="Read the geometry and attributes that travel together."
  description="`@loaders.gl/shapefile` loads the familiar `.shp` geometry and companion attribute files into geospatial table data. Use the archive loader for a complete dataset or the lower-level SHP loader for geometry-only input."
  tone="orange"
  meta={['Shapefile', 'Geometry and attributes', 'GIS table data']}
  links={[
    {label: 'Shapefile format', to: '/docs/modules/shapefile/formats/shapefile'},
    {label: 'Shapefile loader', to: '/docs/modules/shapefile/api-reference/shapefile-loader'},
    {label: 'GIS category', to: '/docs/specifications/category-gis'}
  ]}
/>

<DocOrientation
  eyebrow="The Shapefile path"
  title="Read the dataset pieces. Join them into usable features."
  description="Shapefile is a small family of related files. The high-level loader coordinates the pieces so application code can work with geometry and properties together."
  tone="orange"
  items={[
    {label: 'Input', value: 'Shapefile archive or individual `.shp` data'},
    {label: 'Geometry', value: 'Points, lines, polygons, and multipart records'},
    {label: 'Attributes', value: 'DBF properties and optional projection metadata'},
    {label: 'Output', value: 'Geospatial table data'}
  ]}
/>

<ReferenceBoundary
  title="Loader and file-part details"
  description="The reference below covers installation, the complete archive loader, the geometry-only loader, companion files, and geospatial output."
  tone="orange"
/>

The `@loaders.gl/shapefile` module handles the [Shapefile](/docs/modules/shapefile/formats/shapefile) format, a widely used binary format.

## Installation

```bash
npm install @loaders.gl/shapefile
```

## Loaders and Writers

| Loader | Description |
| ------ | ----------- |
| [`ShapefileLoader`](/docs/modules/shapefile/api-reference/shapefile-loader) | Loads Shapefile archives as geospatial tables. |
| [`SHPLoader`](/docs/modules/shapefile/api-reference/shp-loader) | Loads individual Shapefile `.shp` geometry files. |

## Attribution

The Shapefile loaders were written from scratch for loaders.gl.
