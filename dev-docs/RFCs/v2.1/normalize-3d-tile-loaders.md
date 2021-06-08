# RFC: Normalize 3D Tile Loaders

- **Authors**: Xintong Xia
- **Date**: Jan 2020
- **Status**: Draft

## Abstract

This RFC consolidates [`deck.gl`](https://deck.gl/#/) 2D [`TileLayer`](https://deck.gl/#/documentation/deckgl-api-reference/layers/tile-layer), Cesium tiles 3d and i3s loaders and unifies the output format, which could support or easy to extend from a Loader to work with other 3D tile formats (Potree, etc.).

## Motivation

### 3D tiles

Both Cesium 3D tiles and ArcGIS I3S are open specifications for easily streaming and sharing massive 3D content across different platforms.
Although the specs are distinct from each other, they do share the fundamental components in common. Both specifications divide massive dataset into small and renderable chunks that structured in a hierarchical tree.
Child tiles in the tree are subdivisions of their parents and have finer details, such that less data can be visualized by only loading and drawing the visible regions and level of details can be dynamically
displayed by zoom level.

- Dynamically loading the dataset based on viewport requires tree traversing and strategies to decide whether a specific tile node is sufficient for current viewport (geo boundaries, zoom).
- The math needed for loading is common in either graphics or geospatial, i.e. Bounding Box, frustum culling, Ellipsoid, and coordinate transformations, etc.
- To provide smooth user interaction with the map (panning, zooming), requires frequently loading and unloading tiles, and thus request scheduling and caching are needed to manage tile resources efficiently.
- A unified parsed format for 3d tiles category will empower all the rendering frameworks to load different 3D tiles specifications.

Therefore this RFC joins the 3D tiles and i3s loaders and specifies the semantics of the unified output format. This would also potentially benefit loading other 3D standards i.e. Potree, and further 2D standards.

### 2D Tiles

Paralleled with the [improvements](https://github.com/visgl/deck.gl/pull/4139) in deck.gl 2D Tile loading and rendering, 2D and 3D tiles loading share similar formats and can eventually converge in the future.

## Concepts

- [OGC 3D Tiles](https://www.opengeospatial.org/standards/3DTiles) standard
- [OGC i3s](https://www.opengeospatial.org/standards/i3s) standard
- **Tile Header Hierarchy** - An initial, "minimal" set of data listing the _hierarchy of available tiles_, with minimal information to allow an application to determine which tiles need to be loaded based on a certain viewing position in 3d space.
- **Tile Header** - A minimal header describing a tiles bounding volume and a screen space error tolerance (allowing the tile to be culled if it is distant), as well as the URL to load the tile's actual content from.
- **Tile Content** - The actual payload of the tile.
- **Tile Cache** - Since the number of tiles in big tilesets often exceed what can be loaded into available memory, it is important to have a system that releases no-longer visible tiles from memory.
- **Tileset Traversal** - Dynamically loading and rendering 3D tiles based on current viewing position, possibly triggering loads of new tiles and unloading of older, no-longer visible tiles.

## Modules Structure

**Current structure**

`@loaders.gl/3d-tiles`: Load Cesium 3D tiles

- loaders
  - `Tiles3DLoader`
  - `Tile3DHeaderLoader`
- Tile Classes
  - `Tileset3D`
  - `Tileset`
- Shared Components

  - `BaseTileset3DTraversal`
  - `Tileset3DCache`
  - `RequestScheduler`

`@loaders.gl/i3s`: Load ArcGIS I3S tiles

- loaders
  - `Tiles3DLoader`
  - `Tile3DHeaderLoader`
- Tile Classes
  - `I3STileset`
  - `I3STileHeader`
- Dependencies:
  - `@loaders.gl/3d-tiles`: `BaseTileset3DTraversal`, `Tileset3DCache`, `RequestScheduler`, etc.

`@loaders.gl/potree`: Load Potree tiles

- loaders
  - `PotreeLoader`
  - `PotreeHierarchyChunkLoader`
  - `PotreeBinLoader`
- Tile Classes
  - `Octree`

**Proposed structure**

Each specification will have its own loader module and expose a single `Tile` loader, which will be smart enough to load a tileset file or a tile file by detecting file type or peeking file content. And a separate module `@loaders.gl/tiles` will contain all the tile classes and common components shared by different tile loaders.

```
|--`@loaders.gl/3d-tiles`         // Load Cesium 3D tiles
|   |- `Tiles3DLoader`
|--`@loaders.gl/i3s`              // Load ArcGIS I3S tiles.
|   |-- `I3SLoader`
|--`@loaders.gl/potree`           // Load Potree tiles
|   |-- `PotreeLoader`
|--`@loaders.gl/tiles`            // A modules contains the tile classes and common components for loading 2d and 3d tiles.
    |-- `Tileset2D`
    |-- `Tileset3D`
    |-- `Tile2D`
    |-- `Tile3D`
    |-- `Tileset3DTraversal`
    |-- `Tileset3DCache`
    |-- `RequestScheduler`
```

**For users**

- `Tileset2D`: A class which help manage 2d tiles.
- `Tileset3D`: A class which can understand unified tileset format loaded from tile loaders, i.e. `Tiles3DLoader` of `@loaders.gl/3d-tiles`, `I3SLoader` of `@loaders.gl/i3s`. Also it provides helper functions to dynamically loading and unloading tiles for rendering under current viewport.
- `Tile2D`: A class that extended from 2D tile data.
- `Tile3D`: A class that can understand unified tile format loaded from tile loaders, i.e. `Tiles3DLoader` for `@loaders.gl/3d-tiles`, `I3SLoader` for `@loaders.gl/i3s`.

**For shared by tiles loaders**

- `TilesetTraversal`: A class that traverse tile tree to get renderable tiles based on certain state (i.e. viewport), may cause loading and unloading tiles, and updating tiles visibilties.
- `TilesetCache`: LRU cache for caching loaded tiles.
- `RequestScheduler`: Managing fetching requests based on traversal priorities.

```
           tileset url                tileset url              tileset url
                 |                         |                          |
                 \/                        \/                         \/
     -------------------------    --------------------    -----------------------
     |     Tiles3DLoader     |    |    I3SLoader     |    |     PotreeLoader    |
     |  @loaders.gl/3d-tiles |    | @loaders.gl/i3s  |    |  @loaders.gl/potree |
     -------------------------    --------------------    -----------------------
                  |                        |                          |
                 \/                        \/                         \/
                  -----------------------------------------------------
                                           |
                                           \/
                               -------------------------
                               | unified tileset object |
                               -------------------------
                                           |
                                           \/
                                    --------------     TilesetTraversal, TilesetCache, RequestScheduler, ...
                                    |  Tileset3D  | <-------------------|
                                    ---------------                     |
                                           |                            |
                                           \/                    ---------------------
                                      ------------               | @loaders.gl/tiles |
                                      | traverse |               ---------------------
                                      ------------
                                           |
                                           \/
                                       ---------
                                       | tiles |
                                       ---------
                                           |
                                           \/
                                       ---------
                                       | Tile3D |
                                       ---------
                                           /\
                                           |
                                  ----------------------
                                  | unified tile object |
                                  ----------------------
                                           /\
                                           |
                  --------------------------------------------------
                  /\                       /\                      /\
                  |                        |                       |
     -------------------------    --------------------    -----------------------
     |     Tiles3DLoader     |    |    I3SLoader     |    |     PotreeLoader    |
     |  @loaders.gl/3d-tiles |    | @loaders.gl/i3s  |    |  @loaders.gl/potree |
     -------------------------    --------------------    -----------------------
```

## Data Format

This section specifies the unified data formats from tileset loader and tile loader.

**Tilset Object**

The following fields are guaranteed. But different tileset loaders may have different extra fields.

| Field  | Type     | Contents                                                                      |
| ------ | -------- | ----------------------------------------------------------------------------- |
| `root` | `Object` | The root tile header object                                                   |
| `url`  | `Object` | The root tile header object                                                   |
| `type` | `String` | Indicate the type of tileset specification, `3d-tiles`, `i3s`, `potree`, etc. |

**Tile Object**

The following fields are guaranteed. But different tile loaders may have different extra fields.

| Field             | Type         | Contents                                                                                                                                                                                                                                                                                                                            |
| ----------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- |
| `boundingVolume`  | `Object`     | A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))                                                                                                        |
| `children`        | `Array`      | An array of objects that define child tiles. Each child tile content is fully enclosed by its parent tile's bounding volume and, generally, has more details than parent. for leaf tiles, the length of this array is zero, and children may not be defined.                                                                        |
| `content`         | `String`     | The actual payload of the tile or the url point to the actual payload.                                                                                                                                                                                                                                                              |
| `id`              | `String`     | Identifier of the tile, unique in a tileset                                                                                                                                                                                                                                                                                         |
| `lodSelection`    | `Object`     | Used for deciding if this tile is sufficient given current viewport. Cesium tile use [`geometricError`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#geometric-error), `i3s` uses [`metricType` and `maxError`](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) |
| `refine`          | `String`     | Refinement type of the tile, `ADD` or `REPLACE`                                                                                                                                                                                                                                                                                     |
| `type`            | `String`     | Type of the tile, one of `pointcloud`, `scenegraph`, `mesh`                                                                                                                                                                                                                                                                         |
| `transformMatrix` | `Number[16]` | A matrix that transforms from the tile's local coordinate system to the parent tile's coordinate system—or the tileset's coordinate system in the case of the root tile                                                                                                                                                             |     |

**Tile Content**

After content is loaded, the following fields are guaranteed. But different tiles may have different extra content fields.

| Field                | Type         | Contents                                                                                                                                |
| -------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `cartesianOrigin`    | `Number[3]`  | "Center" of tile geometry in WGS84 fixed frame coordinates                                                                              |
| `cartographicOrigin` | `Number[3]`  | "Origin" in lng/lat (center of tile's bounding volume)                                                                                  |
| `modelMatrix`        | `Number[16]` | Transforms tile geometry positions to fixed frame coordinates                                                                           |
| `attributes`         | `Object`     | Each attribute follows luma.gl [accessor](https://github.com/visgl/luma.gl/blob/master/docs/api-reference/webgl/accessor.md) properties |

`attributes` contains following fields

| Field                  | Type     | Contents                          |
| ---------------------- | -------- | --------------------------------- |
| `attributes.positions` | `Object` | `{value, type, size, normalized}` |
| `attributes.normals`   | `Object` | `{value, type, size, normalized}` |
| `attributes.colors`    | `Object` | `{value, type, size, normalized}` |

PointCloud Fields

| Field        | Type                       | Contents                                                 |
| ------------ | -------------------------- | -------------------------------------------------------- |
| `pointCount` | `Number`                   | Number of points                                         |
| `color`      | `Number[3]` or `Number[4]` | Color of the tile when there are not `attributes.colors` |

Scenegraph Fields

| Field  | Type     | Contents                                                                                             |
| ------ | -------- | ---------------------------------------------------------------------------------------------------- |
| `gltf` | `Object` | check [GLTFLoader](https://loaders.gl/modules/gltf/docs/api-reference/gltf-loader) for detailed spec |

SimpleMesh Fields

| Field     | Type | Contents              |
| --------- | ---- | --------------------- |
| `texture` | URL  | url of tile's texture |

## Tile Classes

`@loaders/tiles` exposes handy classes `Tileset3D` and `Tile3D` which can understand the unified formats respectively and provide useful functions for dynamically selecting tiles for rendering under a viewport.

### Tileset3D Class

#### Properties

- `boundingVolume` (`BoundingVolume`): The root tile's bounding volume, which is also the bouding volume of the entire tileset. Check `Tile3DHeader#boundingVolume`
- `cartesianCenter` (`Number[3]`): Center of tileset in fixed frame coordinates.
- `cartographicCenter` (`Number[3]`): Center of tileset in cartographic coordinates `[long, lat, elevation]`
- `ellipsoid` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid)): Gets an ellipsoid describing the shape of the globe.
- `maximumMemoryUsage` (`Number`): If tiles sized more than `maximumMemoryUsage` are needed to for the current view, when these tiles go out of view, they will be unloaded.`maximumMemoryUsage` must be greater than or equal to zero.
- `modelMatrix` (`Matrix4: A [Matrix4](https://math.gl/modules/core/docs/api-reference/matrix4) instance (4x4 transformation matrix) that transforms the entire tileset.
- `root` (`Tile3DHeader`): The root tile header.
- tiles: Array<Tile3DHeader>: All the tiles that have been traversed.
- `stats` ([`Stats`](https://uber-web.github.io/probe.gl/docs/api-reference/log/stats))): An instance of a probe.gl `Stats` object that contains information on how many tiles have been loaded etc. Easy to display using a probe.gl `StatsWidget`.
- `tileset` (`Object`): The original tileset data this object instanced from.
- `tilesLoaded` (`Boolean`): When `true`, all tiles that meet the screen space error this frame are loaded. The tileset is completely loaded for this view.
- `gpuMemoryUsageInBytes` (`Number`): The total amount of GPU memory in bytes used by the tileset. This value is estimated from geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also includes per-point metadata.
- `url` (`String`): The url to a tileset JSON file.
- `zoom` (`Number[3]`): A web mercator zoom level that displays the entire tile set bounding volume

#### Methods

- `constructor(tileset : Object, url : String [, options : Object])`
  - `tileset`: The loaded tileset (parsed JSON)
  - `options`: Options object, but not limited to
    Parameters:
    - `modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix that transforms the tileset's root tile.
    - `maximumMemoryUsage`=`512`] (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
    - `ellipsoid`=`Ellipsoid.WGS84` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid)) - The ellipsoid determining the size and shape of the globe.
      Callbacks:
    - `onTileLoad` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is fully loaded during the tileset traversal.
    - `onTileUnload` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is unloaded during the tileset traversal.
    - `onTileError` (`(tileHeader : Tile3DHeader, message : String) : void`) - callback when a tile faile to load during the tileset traversal.
- `update(viewport: WebMercatorViewport) : Number`: Execute traversal under current viewport and fetch tiles needed for current viewport and update `selectedTiles`. Return `frameNumber` of this update frame.
- `destroy() : void`: Destroys the WebGL resources held by this object, and destroy all the tiles' resources by recursively traversing the tileset tree.

### Tile3D Class

#### Properties

- `boundingVolume` (`BoundingVolume`): A bounding volume that encloses a tile or its content. Exactly one box, region, or sphere property is required. ([`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#bounding-volume))
- `id` (`Number`|`String`): A unique number for the tile in the tileset. Default to the url of the tile.
- `contentState` (`String`): Indicate of the tile content state. Available options
  - `UNLOADED`: Has never been requested or has been destroyed.
  - `LOADING`: Is waiting on a pending request.
  - `PROCESSING`: Contents are being processed for rendering. Depending on the content, it might make its own requests for external data.
  - `READY`: All the resources are loaded and decoded.
  - `FAILED`: Request failed.
- `contentType` (`String`): One of
  - `empty`: does not have any content to render
  - `render`: has content to render
  - `tileset`: tileset tile
- `depth` (`Number`): The depth of the tile in the tileset tree.
- `content` (`Object`): The tile's content.This represents the actual tile's payload.
- `type` (`String`): One of `scenegraph`, `pointcloud`, `mesh`
- `parent` (`Tile3DHeader`): Parent of this tile.
- `refine` (`String`): Specifies the type of refine that is used when traversing this tile for rendering. [`Reference`](https://github.com/AnalyticalGraphicsInc/3d-tiles/blob/master/specification/README.md#refinement)
  - `ADD`: high-resolution children tiles should be rendered in addition to lower-resolution parent tiles when level of details of parent tiles are not sufficient for current view.
  - `REPLACEMENT`: high-resolution children tiles should replace parent tiles when lower-resolution parent tiles are not sufficient for current view.
- `selected` (`Boolean`): Whether this tile is selected for rendering in current update frame and viewport. A selected tile should has its content loaded and satifies current viewport.
- `tileset` (`Tileset3D`): The `Tileset3D` instance containing this tile.
- `header` (`Object`): The unprocessed tile header object passed in.

#### Methods

- `constructor(tileset : Object, header : Object, parentHeader : Object)`
  - `tileset`: The loaded tileset (parsed JSON)
  - `header`: The url to a tileset JSON file.
  - `parentHeader`: The url to a tileset JSON file.
- `destroy()`: Destroy the tile node, including destroy all the metadata and unload content.
- `loadContent()`: Load a content of the tile.
- `unloadContent()`: Unload a content of the tile.

## Usage

### load tileset and render selected tiles

1 Load a tileset

```js
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';

const tilesetUrl = '<cesium-ion-sever-url>/tileset.json';

// load 3d tiles from Cesium Ion server
const tilesetJSON = await load(tilesetUrl, Tiles3DLoader, {
  ionAssetId,
  ionAssetToken
});
console.log(tilesetJSON);

// load i3s tileset
import {I3SLoader} from '@loaders.gl/i3s';

const tilesetJSON = await load(tilesetUrl, I3SLoader);
console.log(tilesetJSON);
```

2 Construct `Tileset3D` instance

```js
const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: tile => console.log(tile),
  onTileUnload: tile => console.log(tile),
  onTileError: ((tile, message, url) => console.error(message)
});
```

3 Update tiles visibilities when viewport changes

```js
tileset3d.update(viewport);
console.log(tileset3d.tiles);
```

4 Update renders

```js
const layers = {};

tileset3d.tiles.map(tile => {
  return {
    if (!tile.type) {
      return null;
    }

    let layer = !layers[tile.id];
    if (!layer) {
      // create layer
       switch (tileHeader.type) {
         case 'pointcloud':
           layer = createPointCloudTileLayer(tileHeader);
         case 'scenegraph':
           layer =  create3DModelTileLayer(tileHeader);
         case 'mesh':
           layer = createSimpleMeshLayer(tileHeader);
         default:
           console.error(`Tile3DLayer: Failed to render layer of type ${tileHeader.type}`);
       }
    }

    // update layer visibiity
    if (tile.isVisible && !layer.visible) {
       layer = layer.clone({visible: true});
    }

    if (!tile.isVisible  && !layer.visible) {
       layer = layer.clone({visible: false});
    }

    return layer;
  }
});
```

### load a tile

```js
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';

// 3d-tiles tileset.json contains the hierarchical info and metadata of each tile node
// extract a tile node from the tileset tree
const tileHeader = {
  children: [{}, {}],
  boundingVolume: {box: []},
  content: 'content-url',
  ...
};

// load a tile content from Cesium Ion server
const tile = await load(tileHeader, Tiles3DLoader);
console.log(tile)

// load i3s tile with the content
import {I3SLoader} from '@loaders.gl/i3s';

// i3s tileset (the layer file) doesn't have the hierarchical info
// but there is a url for each tile node
const tileUrl = 'i3s/tile-url';
// load with a url
const tile = await load(tileUrl, I3SLoader, {loadContent: true});

// load with a tile header object
const tileHeader = fetch(tileUrl).then(resp => resp.json())
const tile = await load(tileHeader, I3SLoader);
console.log(tile);
```

## Remarks

Cesium 3D Tiles [Specifications](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification)
I3S Tiles [Specifications](https://github.com/Esri/i3s-spec)
