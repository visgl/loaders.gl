# Tileset3D

> The `Tileset3D` class is being generalized to handle more use cases. Since this may require modifying some APIs, this class should be considered experimental.

The `Tileset3D` class can be instantiated with tileset data formatted according to the [3D Tiles Category](docs/specifications/3d-tiles), which is supported by the [Tileset3DLoader](docs/api-reference/3d-tiles/tileset-3d-loader).

References

- [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification).
- [Indexed 3d Scene Layer (i3s)](https://github.com/Esri/i3s-spec).

## Usage

####### Loading a tileset and instantiating a `Tileset3D` instance.

**Use Tileset3DLoader with load**

```js
//
import {Tileset3DLoader, Tileset3D} from '@loaders.gl/3d-tiles';
import {load} from '@loaders.gl/core';

const tilesetUrl = 'A tileset url';
const tilesetJSON = await load(tilesetUrl, Tileset3DLoader);
const tileset3d = new Tileset3D(tilesetJson, tilesetUrl, {
  onTileLoad: tile => console.log(tile),
  onTileUnload: tile => console.log(tile),
  onTileError: ((tile, message, url) => console.error(message)
});

// A web mercator zoom level that displays the entire tile set bounding volume
console.log(tileset3d.webMercatorZoom);
```

####### Updating tileset when viewport changes

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';

const tilesetJSON = await parse(fetch(tileset));
const tileset3d = new Tileset3D(tilesetJson);
tileset.update(viewport);

// Check the selectedTiles based on current viewport
// Each tile is a Tile3DHeader instance
console.log(tileset3d.selectedTiles);
```

** [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification): Common settings for the `dynamicScreenSpaceError` optimization **

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';
const tileset = new Tileset3D(tilesetJSON, tilesetUrl, {
  dynamicScreenSpaceError: true,
  dynamicScreenSpaceErrorDensity: 0.00278,
  dynamicScreenSpaceErrorFactor: 4.0
});
```

##### Properties

##### boundingVolume : BoundingVolume

The root tile's bounding volume. Check `Tile3DHeader#boundingVolume`

##### cartesianCenter : Number[3]

Center of tileset in fixed frame coordinates.

##### cartographicCenter : Number[3]

Center of tileset in cartographic coordinates `[long, lat, elevation]`

##### ellipsoid : Ellipsoid

Gets an ellipsoid describing the shape of the globe.

##### maximumMemoryUsage : Number

If tiles sized more than `maximumMemoryUsage` are needed to for the current view, when these tiles go out of view, they will be unloaded.

`maximumMemoryUsage` must be greater than or equal to zero.

##### modelMatrix : Matrix4

A [Matrix4](https://math.gl/modules/core/docs/api-reference/matrix4) instance (4x4 transformation matrix) that transforms the entire tileset.

##### root : Tile3DHeader

The root tile header.

##### selectedTiles : Array<Tile3DHeader> (readonly)

The selected tiles for render in current update frame based on viewport.

##### stats : Stats

An instance of a probe.gl `Stats` object that contains information on how many tiles have been loaded etc. Easy to display using a probe.gl `StatsWidget`.

##### tilesLoaded : boolean (readonly)

When `true`, all tiles that meet the screen space error this frame are loaded. The tileset is completely loaded for this view.

##### totalMemoryUsageInBytes : Number

The total amount of GPU memory in bytes used by the tileset. This value is estimated from geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also includes per-point metadata.

##### url : String (readonly)

The url to a tileset JSON file.

##### webMercatorZoom : Number[3](readonly)

A web mercator zoom level that displays the entire tile set bounding volume

## Methods

##### constructor(tileset : Object, url : String [, options : Object])

- `tileset`: The loaded tileset (parsed JSON)
- `url`: The url to a tileset JSON file.
- `options`: Options object, see the options section below for available options.

  - `modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix that transforms the tileset's root tile.
  - `maximumMemoryUsage`=`512`] (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
  - `ellipsoid`=`Ellipsoid.WGS84` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid)) - The ellipsoid determining the size and shape of the globe.

  Cesium 3d tiles specific options:

  - `maximumScreenSpaceError`=`16`] (`Number`) - The maximum screen space error used to drive level of detail refinement.
  - `dynamicScreenSpaceError`=`false`] (`Boolean`) - Optimization option. Reduce the screen space error for tiles that are further away from the camera.
  - `dynamicScreenSpaceErrorDensity`=`0.00278`] (`Number`) - Density used to adjust the dynamic screen space error, similar to fog density.
  - `dynamicScreenSpaceErrorFactor`=`4.0`] (`Number`) - A factor used to increase the computed dynamic screen space error.
  - `baseScreenSpaceError`=`1024` (`Number`) - When `skipLevelOfDetail` is `true`, the screen space error that must be reached before skipping levels of detail.

  Callbacks:

  - `onTileLoad` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is fully loaded during the tileset traversal.
  - `onTileUnload` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is unloaded during the tileset traversal.
  - `onTileError` (`(tileHeader : Tile3DHeader, message : String) : void`) - callback when a tile faile to load during the tileset traversal.

##### update(viewport: WebMercatorViewport) : Number

Execute traversal under current viewport and fetch tiles needed for current viewport and update `selectedTiles`. Return `frameNumber` of this update frame.

##### destroy() : void

Destroys the WebGL resources held by this object, and destroy all the tiles' resources by recursively traversing the tileset tree.
