# Tileset3D

> The `Tileset3D` class is being generalized to handle more use cases. Since this may require modifying some APIs, this class should be considered experiemental.

The `Tileset3D` class can be instantiated with tileset data formatted according to the [3D Tiles Category](docs/specifications/3d-tiles), which is supported by the [Tiles3DLoader](docs/api-reference/3d-tiles/tileset-3d-loader).

References

- [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification).
- [I3S Tiles](https://github.com/Esri/i3s-spec).

## Usage

Loading a tileset and instantiating a `Tileset3D` instance.

```js
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';

const tilesetUrl = 'https://assets.cesium.com/43978/tileset.json';
const tilesetJson = await load(tilesetUrl, Tiles3DLoader);
const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: (tile) => console.log(tile)
});
```

Loading a tileset and dynamically load/unload with viewport.

```js
import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {I3SLoader} from '@loaders.gl/i3s';
import {WebMercatorViewport} from '@deck.gl/web-mercator';

const tileseturl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';
const tilesetJson = await load(tilesetUrl, I3SLoader);
const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: (tile) => console.log(tile)
});

const viewport = new WebMercatorViewport({latitude, longitude, zoom});
tileset3d.update(viewport);
```

Since `Tileset3D's update` is a synchronized call, which selects the tiles qualified for rendering based on current viewport and available tiles, user can trigger another `update` when new tiles are loaded.

```js
import {Tileset3D} from '@loaders.gl/tiles';

const viewport = new WebMercatorViewport({latitude, longitude, zoom});

const tileset3d = new Tileset3D(tilesetJson, {
  onTileLoad: (tile) => tileset3d.update(viewport)
});
```

## Constructor

```js
new Tileset3D(tilesetJson, {
  onTileLoad: (tile) => console.log(tile)
});
```

Parameters:

- `json`: loaded tileset json object, should follow the format [tiles format](https://loaders.gl/docs/specifications/category-3d-tiles)
- `options`:
  - `options.ellipsoid`=`Ellipsoid.WGS84` (`Ellipsoid`) - The ellipsoid determining the size and shape of the globe.
  - `options.throttleRequests`=`true` (`Boolean`) - Determines whether or not to throttle tile fetching requests. Throttled requests are prioritized according to tile visibility.
  - `options.maxRequests`=`64` (`Number`) - When throttling tile fetching, the maximum number of simultaneous requests.
  - `options.modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix this transforms the entire tileset.
  - `options.maximumMemoryUsage`=`512` (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
  - `options.viewDistanceScale`=`1.0` (`Number`) - A scaling factor for tile refinement. A lower value would cause lower level tiles to load. Useful for debugging and for restricting resource usage.
  - `options.updateTransforms`=`true` (`Boolean`) - Always check if the tileset `modelMatrix` was updated. Set to `false` to improve performance when the tileset remains stationary in the scene.
  - `options.loadOptions` - _loaders.gl_ options used when loading tiles from the tiling server. Includes `fetch` options such as authentication `headers`, worker options such as `maxConcurrency`, and options to other loaders such as `3d-tiles`, `gltf`, and `draco`.
  - `options.contentLoader` = `null` (`Promise`) - An optional external async content loader for the tile. Once the promise resolves, a tile is regarded as _READY_ to be displayed on the viewport.
  - `options.loadTiles`=`true` (`Boolean`) - Whether the tileset traverse and update tiles. Set this options to `false` during the run time to freeze the scene.

Callbacks:

- `onTileLoad` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is fully loaded during the tileset traversal.
- `onTileUnload` (`(tileHeader : Tile3DHeader) : void`) - callback when a tile node is unloaded during the tileset traversal.
- `onTileError` (`(tileHeader : Tile3DHeader, message : String) : void`) - callback when a tile faile to load during the tileset traversal.

The `Tileset3D` allows callbacks (`onTileLoad`, `onTileUnload`) to be registered that notify the app when the set of tiles available for rendering has changed. This is important because tile loads complete asynchronously, after the `tileset3D.update(...)` call has returned.

Cesium 3D tiles specific options:

- `options.maximumScreenSpaceError`=`16`] (`Number`) - The maximum screen space error used to drive level of detail refinement.

## Properties

###### `boundingVolume` (BoundingVolume)

The root tile's bounding volume, which is also the bouding volume of the entire tileset. Check `Tile3DHeader#boundingVolume`

###### `cartesianCenter` (Number[3])

Center of tileset in fixed frame coordinates.

###### `cartographicCenter` (Number[3])

Center of tileset in cartographic coordinates `[long, lat, elevation]`

###### `ellipsoid` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid))

Gets an ellipsoid describing the shape of the globe.

##### `modelMatrix` (Matrix4)

A [Matrix4](https://math.gl/modules/core/docs/api-reference/matrix4) instance (4x4 transformation matrix) that transforms the entire tileset.

###### `root` (Tile3DHeader)

The root tile header.

###### `tiles` (Tile3DHeader[])

All the tiles that have been traversed.

###### `stats` ([`Stats`](https://uber-web.github.io/probe.gl/docs/api-reference/log/stats))

An instance of a probe.gl `Stats` object that contains information on how many tiles have been loaded etc. Easy to display using a probe.gl `StatsWidget`.

###### `tileset` (Object)

The original tileset data this object instanced from.

###### `tilesLoaded` (Boolean)

When `true`, all tiles that meet the screen space error this frame are loaded. The tileset is completely loaded for this view.

###### `gpuMemoryUsageInBytes` (Number)

The total amount of GPU memory in bytes used by the tileset. This value is estimated from geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also includes per-point metadata.

###### `url` (String)

The url to a tileset JSON file.

###### `zoom` (Number[3])

A web mercator zoom level that displays the entire tile set bounding volume

##### `tilesLoaded` : boolean

When `true`, all tiles that meet the screen space error this frame are loaded. The tileset is
completely loaded for this view.

See Tileset3D#allTilesLoaded

### Cesium 3D Tiles properties

### asset : Object

Gets the tileset's asset object property, which contains metadata about the tileset.

See the [asset schema reference](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-asset) in the 3D Tiles spec for the full set of properties.

### properties : Object

Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.

See the [properties schema reference](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-properties) in the 3D Tiles spec for the full set of properties.

### maximumScreenSpaceError : Number

The maximum screen space error used to drive level of detail refinement. This value helps determine when a tile refines to its descendants, and therefore plays a major role in balancing performance with visual quality.

A tile's screen space error is roughly equivalent to the number of pixels wide that would be drawn if a sphere with a
radius equal to the tile's <b>geometric error</b> were rendered at the tile's position. If this value exceeds
`maximumScreenSpaceError` the tile refines to its descendants.

Depending on the tileset, `maximumScreenSpaceError` may need to be tweaked to achieve the right balance. Higher values provide better performance but lower visual quality. \*

### maximumMemoryUsage : Number

^default 16 \*
^exception `maximumScreenSpaceError` must be greater than or equal to zero.

The maximum amount of GPU memory (in MB) that may be used to cache tiles. This value is estimated from
geometry, textures, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.

Tiles not in view are unloaded to enforce this.

If decreasing this value results in unloading tiles, the tiles are unloaded the next frame.

If tiles sized more than `maximumMemoryUsage` are needed
to meet the desired screen space error, determined by `Tileset3D.maximumScreenSpaceError`,
for the current view, then the memory usage of the tiles loaded will exceed
`maximumMemoryUsage`. For example, if the maximum is 256 MB, but
300 MB of tiles are needed to meet the screen space error, then 300 MB of tiles may be loaded. When
these tiles go out of view, they will be unloaded.

^default 512 \*
^exception `maximumMemoryUsage` must be greater than or equal to zero.
^see Tileset3D#gpuMemoryUsageInBytes

### root : Tile3DHeader

The root tile header.

### boundingSphere : BoundingSphere

The tileset's bounding sphere.

```js
var tileset = viewer.scene.primitives.add(
  new Tileset3D({
    url: 'http://localhost:8002/tilesets/Seattle/tileset.json'
  })
);

tileset.readyPromise.then(function (tileset) {
  // Set the camera to view the newly added tileset
  viewer.camera.viewBoundingSphere(tileset.boundingSphere, new HeadingPitchRange(0, -0.5, 0));
});
```

### modelMatrix : Matrix4

A 4x4 transformation matrix that transforms the entire tileset.

### maximumMemoryUsage : Number

### gpuMemoryUsageInBytes : Number

The total amount of GPU memory in bytes used by the tileset. This value is estimated from
geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.

### stats : Stats

An instance of a probe.gl `Stats` object that contains information on how many tiles have been loaded etc. Easy to display using a probe.gl `StatsWidget`.

### ellipsoid : Ellipsoid

Gets an ellipsoid describing the shape of the globe.

Returns the `extras` property at the top-level of the tileset JSON, which contains application specific metadata.
Returns `undefined` if `extras` does not exist.

Exception The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.

See [Extras](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras) in the 3D Tiles specification.}

### unloadTileset

Unloads all tiles that weren't selected the previous frame. This can be used to
explicitly manage the tile cache and reduce the total number of tiles loaded below
`Tileset3D.maximumMemoryUsage`.

Tile unloads occur at the next frame to keep all the WebGL delete calls
within the render loop.

### isDestroyed() : Boolean

Returns true if this object was destroyed; otherwise, false.

If this object was destroyed, it should not be used; calling any function other than
`isDestroyed` will result in an exception.

^returns `Boolean`: `true` if this object was destroyed; otherwise, `false`.

### destroy()

Destroys the WebGL resources held by this object. Destroying an object allows for deterministic
release of WebGL resources, instead of relying on the garbage collector to destroy this object.

Once an object is destroyed, it should not be used; calling any function other than `isDestroyed` will result in an exception. Therefore, assign the return value `undefined` to the object as done in the example.

Wxception This object was destroyed, i.e., destroy() was called.

## Methods

##### `setOptions`

`setOptions(options: Object) : void`:

Parameters:

- `options`: the options map to apply

Apply new options to an instance of the class. Use this method to update options of the tileset during the run time.

##### `update`

`update(viewport: WebMercatorViewport) : Number`:

Parameters:

- `viewport`: a [`WebMercatorViewport`](https://deck.gl/#/documentation/deckgl-api-reference/viewports/web-mercator-viewport)

Execute traversal under current viewport and fetch tiles needed for current viewport and update `selectedTiles`. Return `frameNumber` of this update frame.
