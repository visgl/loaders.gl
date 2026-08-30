---
title: '@loaders.gl/i3s'
description: Load and traverse Indexed 3D Scene Layers with profile-aware scene and point-cloud support.
hide_title: true
page_style: designed
---

import {DocPageHeader} from '@site/src/components/docs/doc-page-header';
import {ClientExample, DocLiveExample} from '@site/src/components';
import {TiledSceneGraphic} from '@site/src/components/docs/tiled-scene-graphic';
import {DocOrientation, ReferenceBoundary} from '@site/src/components/docs/designed-doc';

<DocPageHeader
  eyebrow="Tiled scene module"
  title="@loaders.gl/i3s"
  description="Read ArcGIS Indexed 3D Scene Layers through the same source and traversal building blocks used for large browser-rendered scenes."
  tone="orange"
  meta={['I3S profiles', 'Scene and point cloud', 'ArcGIS services']}
  logos={[
    {alt: 'ArcGIS', src: '/images/format-logos/arcgis-logo.svg'},
    {alt: 'Open Geospatial Consortium', src: '/images/format-logos/ogc-logo-transparent.png'}
  ]}
  links={[
    {label: 'I3S format', to: '/docs/modules/i3s/formats/i3s'},
    {label: 'I3SLoader', to: '/docs/modules/i3s/api-reference/i3s-loader'},
    {label: 'I3S examples', to: '/examples/i3s-arcgis'}
  ]}
/>

<DocLiveExample label="I3S building scene" height="430px">
  <ClientExample kind="i3s-building-scene-layer" />
</DocLiveExample>

<TiledSceneGraphic />

The `@loaders.gl/i3s` module supports loading and traversing Indexed 3D Scene Layer (I3S).

See the [I3S format support matrix](/docs/modules/i3s/formats/i3s) for detailed coverage of scene layer profiles,
specification generations, geometry, textures, attributes, delivery options, and known gaps.

<DocOrientation
  eyebrow="The I3S module"
  title="Traverse scene layers without flattening the service."
  description="I3S keeps scene, point, and point-cloud content in a spatial hierarchy. loaders.gl exposes the profile metadata and traversal inputs so applications can request and decode the pieces they need."
  tone="orange"
  items={[
    {label: 'Profiles', value: '3D objects, integrated mesh, point, and point cloud'},
    {label: 'Hierarchy', value: 'Nodes, bounds, levels of detail, and resource links'},
    {label: 'Payloads', value: 'Geometry, attributes, textures, Draco, and KTX2'},
    {label: 'Runtime', value: 'I3SSource, point-cloud sources, and Tileset3D traversal'}
  ]}
/>

## Standards

- [I3S Tiles Specification](https://github.com/Esri/i3s-spec) - The living specification.
- [I3S Tiles Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](http://www.ogc.org/standards/i3s), the Open Geospatial Consortium.

<ReferenceBoundary
  title="Profiles, APIs, and source behavior"
  description="The reference below covers installation, profile-specific loaders, source construction, traversal helpers, and the compatibility matrix."
  tone="orange"
/>

## Installation

```bash
npm install @loaders.gl/i3s
npm install @loaders.gl/core
```

## API

The module provides loaders and sources for I3S scene-layer profiles:

- [`I3SLoader`](/docs/modules/i3s/api-reference/i3s-loader), a loader for loading a top-down or nested tileset and its tiles.
- [`I3SPointCloudSource`](/docs/modules/i3s/api-reference/i3s-point-cloud-source), a source for I3S 2.x Point Cloud layers that can be used with [`PointCloudTileset`](/docs/modules/tiles/api-reference/point-cloud-tileset).

For dynamic selection and loading of scene layers larger than browser memory, use the helper classes
in the `@loaders.gl/tiles` module:

- [`Tileset3D`](/docs/modules/tiles/api-reference/tileset-3d) to work with the loaded tileset.
- [`Tile3D`](/docs/modules/tiles/api-reference/tile-3d) to access data for a specific tile.

## Attribution

MIT license, code is written for loaders.gl.
