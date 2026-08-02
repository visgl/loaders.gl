# Tileset3D

> The `Tileset3D` class is being generalized to handle more use cases. Since this may require modifying some APIs, this class should be considered experiemental.

The `Tileset3D` class is the shared runtime for traversal, culling, selection, cache management, and request scheduling across source-backed 3D tilesets.

It is constructed with a [`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source), such as [`Tiles3DSource`](/docs/modules/tiles/api-reference/tiles-3d-source) or [`I3SSource`](/docs/modules/tiles/api-reference/i3s-source).

References

- [3D Tiles](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification).
- [I3S Tiles](https://github.com/Esri/i3s-spec).

## Usage

Loading a tileset and instantiating a `Tileset3D` instance.

```typescript
import {Tiles3DLoader} from '@loaders.gl/3d-tiles';
import {Tiles3DSource, Tileset3D} from '@loaders.gl/tiles';

const tilesetUrl = 'https://assets.ion.cesium.com/43978/tileset.json';
const source = new Tiles3DSource({url: tilesetUrl, loader: Tiles3DLoader});
const tileset3d = new Tileset3D(source, {
  onTileLoad: (tile) => console.log(tile)
});
```

Loading a tileset and dynamically load/unload with viewport.

```typescript
import {I3SLoader} from '@loaders.gl/i3s';
import {I3SSource, Tileset3D} from '@loaders.gl/tiles';
import {WebMercatorViewport} from '@deck.gl/web-mercator';

const tileseturl =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';
const source = new I3SSource({url: tilesetUrl, loader: I3SLoader});
const tileset3d = new Tileset3D(source, {
  onTileLoad: (tile) => console.log(tile)
});

const viewport = new WebMercatorViewport({latitude, longitude, zoom});
tileset3d.update(viewport);
```

Since `Tileset3D's update` is a synchronized call, which selects the tiles qualified for rendering based on current viewport and available tiles, user can trigger another `update` when new tiles are loaded.

```typescript
import {Tileset3D} from '@loaders.gl/tiles';

const viewport = new WebMercatorViewport({latitude, longitude, zoom});

const tileset3d = new Tileset3D(source, {
  onTileLoad: (tile) => tileset3d.update(viewport)
});
```

## Constructor

```typescript
new Tileset3D(source, {
  onTileLoad: (tile) => console.log(tile)
});
```

Parameters:

- `source`: a [`Tileset3DSource`](/docs/modules/tiles/api-reference/tileset-3d-source) instance
- `options`:
  - `options.ellipsoid`=`Ellipsoid.WGS84` (`Ellipsoid`) - The ellipsoid determining the size and shape of the globe.
  - `options.throttleRequests`=`true` (`Boolean`) - Determines whether or not to throttle tile fetching requests. Throttled requests are prioritized according to tile visibility.
  - `options.maxRequests`=`64` (`Number`) - When throttling tile fetching, the maximum number of simultaneous requests.
  - `options.modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix this transforms the entire tileset.
  - `options.maximumMemoryUsage`=`32` (`Number`) - Soft limit for estimated cached GPU memory in MB. Current-frame tiles remain protected. See [Caching and memory](/docs/modules/3d-tiles/concepts/caching-and-memory).
  - `options.viewDistanceScale`=`1.0` (`Number`) - Multiplies calculated screen-space error. Lower values stop refinement earlier; higher values select more detail. See [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod).
  - `options.progressiveResolutionHeightFraction`=`0.3` (`Number`) - Prioritizes coarse viewport coverage using SSE at a reduced logical viewport height. Set to `0` to disable; values above `0.5` are ignored. See [Request scheduling and priorities](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities).
  - `options.foveatedScreenSpaceError`=`true` (`Boolean`) - Prioritizes perspective requests near the camera view axis before peripheral detail. This changes request timing, not the final LOD target. See [Request scheduling and priorities](/docs/modules/3d-tiles/concepts/request-scheduling-and-priorities).
  - `options.foveatedConeSize`=`0.1` (`Number`) - Fraction of the perspective field of view that receives no foveated SSE relaxation. Set to `1` to disable peripheral deferral.
  - `options.foveatedMinimumScreenSpaceErrorRelaxation`=`0` (`Number`) - Minimum logical-pixel SSE relaxation immediately outside the center cone.
  - `options.foveatedInterpolationCallback`=`linear interpolation` (`Function`) - Interpolates logical-pixel SSE relaxation from the cone edge toward the viewport edge.
  - `options.foveatedTimeDelay`=`0.2` (`Number`) - Maximum seconds eligible peripheral requests wait after camera movement. Traditional `REPLACE` traversal is never deferred.
  - `options.updateTransforms`=`true` (`Boolean`) - Always check if the tileset `modelMatrix` was updated. Set to `false` to improve performance when the tileset remains stationary in the scene.
  - `options.loadOptions` - _loaders.gl_ options used when loading tiles from the tiling server. Includes `fetch` options such as authentication `headers`, worker options such as `maxConcurrency`, and options to other loaders such as `3d-tiles`, `gltf`, and `draco`.
  - `options.contentLoader` = `null` (`Promise`) - An optional external async content loader for the tile. Once the promise resolves, a tile is regarded as _READY_ to be displayed on the viewport.
  - `options.loadTiles`=`true` (`Boolean`) - Whether the tileset traverse and update tiles. Set this options to `false` during the run time to freeze the scene.

Callbacks:

- `onTileLoad` (`(tileHeader : Tile3D) : void`) - callback when a tile node is fully loaded during the tileset traversal.
- `onTileUnload` (`(tileHeader : Tile3D) : void`) - callback when a tile node is unloaded during the tileset traversal.
- `onTileError` (`(tileHeader : Tile3D, message : String) : void`) - callback when a tile faile to load during the tileset traversal.
- `onTraversalComplete` (`(selectedTiles : Tile3D[]) : Tile3D[]`) - callback post-process selectedTiles right after traversal.

The `Tileset3D` allows callbacks (`onTileLoad`, `onTileUnload`) to be registered that notify the app when the set of tiles available for rendering has changed. This is important because tile loads complete asynchronously, after the `tileset3D.update(...)` call has returned.

For format-specific source behavior, see:

- [`Tiles3DSource`](/docs/modules/tiles/api-reference/tiles-3d-source)
- [`I3SSource`](/docs/modules/tiles/api-reference/i3s-source)

Cesium 3D tiles specific options:

- `options.maximumScreenSpaceError`=`8` (`Number`) - The maximum screen-space error used to drive level-of-detail refinement. See [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod).
- `options.dynamicScreenSpaceError`=`true` (`Boolean`) - Reduces refinement for distant,
  horizon-facing tiles in perspective views. Orthographic traversal is unaffected.
- `options.dynamicScreenSpaceErrorDensity`=`0.0002` (`Number`) - Base fog density, in inverse
  meters, used by dynamic SSE. Higher values reduce distant refinement sooner.
- `options.dynamicScreenSpaceErrorFactor`=`24` (`Number`) - Maximum dynamic SSE reduction in
  logical/CSS pixels.
- `options.dynamicScreenSpaceErrorHeightFalloff`=`0.25` (`Number`) - Fraction of the root tileset
  height at which dynamic SSE starts to fade as the camera rises. Values are clamped to `[0, 1]`.

See [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod#dynamic-perspective-sse)
for the formulas, worked example, projection boundaries, and tuning guidance.

## Properties

###### `boundingVolume` (BoundingVolume)

The root tile's bounding volume, which is also the bouding volume of the entire tileset. Check `Tile3D#boundingVolume`

###### `cartesianCenter` (Number[3])

Center of tileset in fixed frame coordinates.

###### `cartographicCenter` (Number[3])

Center of tileset in cartographic coordinates `[long, lat, elevation]`

###### `ellipsoid` ([`Ellipsoid`](https://math.gl/modules/geospatial/docs/api-reference/ellipsoid))

Gets an ellipsoid describing the shape of the globe.

##### `modelMatrix` (Matrix4)

A [Matrix4](https://math.gl/modules/core/docs/api-reference/matrix4) instance (4x4 transformation matrix) that transforms the entire tileset.

###### `root` (Tile3D)

The root tile header.

###### `tiles` (Tile3D[])

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

Threshold that controls the level of detail of loaded tiles. A higher value means tile traversal stops early, displaying lower quality tiles (but much faster load times & less bandwidth used), because we're using a high "error tolerance". A lower value means lower tolerance for error, so traversal goes deeper in the tree and displays higher quality tiles.

A tile's screen space error is roughly equivalent to the number of pixels wide that would be drawn if a sphere with a
radius equal to the tile's <b>geometric error</b> were rendered at the tile's position. If this value exceeds
`maximumScreenSpaceError` the tile refines to its descendants.

Depending on the tileset, `maximumScreenSpaceError` may need to be tweaked to achieve the right balance between performance with visual quality. \*

For formulas, projection-specific behavior, transform scaling, and tuning guidance, see [Screen-space error and level of detail](/docs/modules/3d-tiles/concepts/screen-space-error-and-lod).

^default 8 \*
^exception `maximumScreenSpaceError` must be greater than or equal to zero.

### maximumMemoryUsage : Number

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

^default 32 \*
^exception `maximumMemoryUsage` must be greater than or equal to zero.
^see Tileset3D#gpuMemoryUsageInBytes

### root : Tile3D

The root tile header.

### boundingSphere : BoundingSphere

The tileset's bounding sphere.

```typescript
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
