Tiled scene module

![](/next/images/format-logos/ogc-mark.svg)OGCI3S

# @loaders.gl/tiles-3d/i3s

Read ArcGIS Indexed 3D Scene Layers through the same source and traversal building blocks used for large browser-rendered scenes.

[I3S format](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md)[I3SLoader](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)

<!-- -->

[ ↗](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md)[I3S examples](https://loaders.gl/next/examples/i3s-arcgis)

<!-- -->

[ ↗](https://loaders.gl/next/examples/i3s-arcgis)

⛶⛶ Explore fullscreen

View-dependent delivery

## A hierarchy turns one scene into useful requests.

Tiled formats keep spatial structure and level-of-detail metadata alongside their payloads. A runtime can select visible leaves instead of downloading the complete world.

Dataset hierarchy

root · world boundscoarse content and children

region westgeometric error

region eastgeometric error

leaf · L06leaf · L07leaf · L06leaf · L08

selec&#x74;**→**

Current view

viewport + error budget

boundsSSEpriority

selected contentFetch only the leaves that can contribute to this view.

glTFpointstextures

[Tileset3D traversal ↗](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md)

3D Tiles and I3S differ in their resource layouts, but the application-facing idea is the same: preserve the hierarchy, select by view, and request content progressively.

The `@loaders.gl/tiles-3d/i3s` module supports loading and traversing Indexed 3D Scene Layer (I3S).

See the [I3S format support matrix](https://loaders.gl/next/docs/modules/tiles-3d/i3s/formats/i3s.md) for detailed coverage of scene layer profiles, specification generations, geometry, textures, attributes, delivery options, and known gaps.

The I3S module

## Traverse scene layers without flattening the service.

I3S keeps scene, point, and point-cloud content in a spatial hierarchy. loaders.gl exposes the profile metadata and traversal inputs so applications can request and decode the pieces they need.

01

Profiles

3D objects, integrated mesh, point, and point cloud

02

Hierarchy

Nodes, bounds, levels of detail, and resource links

03

Payloads

Geometry, attributes, textures, Draco, and KTX2

04

Runtime

I3SSource, point-cloud sources, and Tileset3D traversal

## Standards[​](#standards "Direct link to Standards")

* [I3S Tiles Specification](https://github.com/Esri/i3s-spec) - The living specification.
* [I3S Tiles Standard](http://www.ogc.org/standards/i3s) - The official standard from [OGC](http://www.ogc.org/standards/i3s), the Open Geospatial Consortium.

Detailed guide

## Profiles, APIs, and source behavior

The reference below covers installation, profile-specific loaders, source construction, traversal helpers, and the compatibility matrix.

## Installation[​](#installation "Direct link to Installation")

```
npm install @loaders.gl/tiles-3d

npm install @loaders.gl/core
```

## API[​](#api "Direct link to API")

The module provides loaders and sources for I3S scene-layer profiles:

* [`I3SLoader`](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-loader.md), a loader for loading a top-down or nested tileset and its tiles.
* [`I3SPointCloudSource`](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/i3s-point-cloud-source.md), a source for I3S 2.x Point Cloud layers that can be used with [`PointCloudTileset`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/point-cloud-tileset.md).

For dynamic selection and loading of scene layers larger than browser memory, use the helper classes in the `@loaders.gl/tiles` module:

* [`Tileset3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tileset-3d.md) to work with the loaded tileset.
* [`Tile3D`](https://loaders.gl/next/docs/modules/tiles-3d/api-reference/tile-3d.md) to access data for a specific tile.

## Attribution[​](#attribution "Direct link to Attribution")

MIT license, code is written for loaders.gl.

## Archive output[​](#archive-output "Direct link to Archive output")

[SLPKWriter](https://loaders.gl/next/docs/modules/tiles-3d/i3s/api-reference/slpk-writer.md) packages already-authored, individually compressed I3S resources into portable indexed SLPK archives with a complete output-size budget.

Call `await preloadI3SMeshCompression()` before the synchronous `encodeI3SMeshLayer()` helper. Async Draco encoding initializes its compress-utils GZIP backend automatically.
