# Tileset3D

> The 3D tiles loaders are still under development.

The definition of a [3D Tiles tileset](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification).

## Usage

```js
const tileset = new Tileset3D();
console.log(`Maximum building height: ${tileset.properties.height.maximum}`);
console.log(`Minimum building height: ${tileset.properties.height.minimum}`);
```

```js
import {Tileset3D} from '^loaders.gl/3d-tiles';
const tileset = new Tileset3D({
  url: 'http://localhost:8002/tilesets/Seattle/tileset.json',
  baseScreenSpaceError: 1024,
  skipScreenSpaceErrorFactor: 16
});
```

### Properties

### asset : Object (readonly)

Gets the tileset's asset object property, which contains metadata about the tileset.

See the [asset schema reference](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-asset) in the 3D Tiles spec for the full set of properties.


Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.

See the [properties schema reference](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-properties) in the 3D Tiles spec for the full set of properties.

see Cesium3DTileFeature#getProperty
see Cesium3DTileFeature#setProperty

### ready

When `true`, the tileset's root tile is loaded and the tileset is ready to render.
This is set to `true` right before `Tileset3D.readyPromise` is resolved.

### readyPromise

Gets the promise that will be resolved when the tileset's root tile is loaded and the tileset is ready to render.

This promise is resolved at the end of the frame before the first frame the tileset is rendered in.


```js
tileset.readyPromise.then(function(tileset) {
    // tile.properties is not defined until readyPromise resolves.
    var properties = tileset.properties;
    if (defined(properties)) {
        for (var name in properties) {
            console.log(properties[name]);
        }
    }
});
```

### url : String (readonly)

The url to a tileset JSON file.

### basePath : String (readonly) (deprecated)

The base path that non-absolute paths in tileset JSON file are relative to.

### maximumScreenSpaceError

The maximum screen space error used to drive level of detail refinement. This value helps determine when a tile refines to its descendants, and therefore plays a major role in balancing performance with visual quality.


A tile's screen space error is roughly equivalent to the number of pixels wide that would be drawn if a sphere with a
radius equal to the tile's <b>geometric error</b> were rendered at the tile's position. If this value exceeds
`maximumScreenSpaceError` the tile refines to its descendants.

Depending on the tileset, `maximumScreenSpaceError` may need to be tweaked to achieve the right balance. Higher values provide better performance but lower visual quality.
 *

### maximumMemoryUsage : Number

^default 16
 *
^exception `maximumScreenSpaceError` must be greater than or equal to zero.

The maximum amount of GPU memory (in MB) that may be used to cache tiles. This value is estimated from
geometry, textures, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.


Tiles not in view are unloaded to enforce this.

If decreasing this value results in unloading tiles, the tiles are unloaded the next frame.

If tiles sized more than `maximumMemoryUsage` are needed
to meet the desired screen space error, determined by `Tileset3D.maximumScreenSpaceError `,
for the current view, then the memory usage of the tiles loaded will exceed
`maximumMemoryUsage`.  For example, if the maximum is 256 MB, but
300 MB of tiles are needed to meet the screen space error, then 300 MB of tiles may be loaded.  When
these tiles go out of view, they will be unloaded.

^default 512
 *
^exception `maximumMemoryUsage` must be greater than or equal to zero.
^see Tileset3D#gpuMemoryUsageInBytes

### root : Tile3DHeader

The root tile header.


### boundingSphere : BoundingSphere

The tileset's bounding sphere.


```js
var tileset = viewer.scene.primitives.add(new Tileset3D({
url : 'http://localhost:8002/tilesets/Seattle/tileset.json'
}));

tileset.readyPromise.then(function(tileset) {
// Set the camera to view the newly added tileset
viewer.camera.viewBoundingSphere(tileset.boundingSphere, new HeadingPitchRange(0, -0.5, 0));
});
```

### modelMatrix : Matrix4

A 4x4 transformation matrix that transforms the entire tileset.

```js
// Adjust a tileset's height from the globe's surface.
var heightOffset = 20.0;
var boundingSphere = tileset.boundingSphere;
var cartographic = Cartographic.fromCartesian(boundingSphere.center);
var surface = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
var offset = Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
var translation = Cartesian3.subtract(offset, surface, new Cartesian3());
tileset.modelMatrix = Matrix4.fromTranslation(translation);
```


### timeSinceLoad : Number

Returns the time, in milliseconds, since the tileset was loaded and first updated.


### maximumMemoryUsage : Number

### gpuMemoryUsageInBytes : Number

The total amount of GPU memory in bytes used by the tileset. This value is estimated from
geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.

### statistics


### classificationType (Experimental) readonly

Determines whether terrain, 3D Tiles or both will be classified by this tileset.


This option is only applied to tilesets containing batched 3D models, geometry data, or vector data. Even when undefined, vector data and geometry data
must render as classifications and will default to rendering on both terrain and other 3D Tiles tilesets.

When enabled for batched 3D model tilesets, there are a few requirements/limitations on the glTF:
<ul>
    <li>POSITION and _BATCHID semantics are required.</li>
    <li>All indices with the same batch id must occupy contiguous sections of the index buffer.</li>
    <li>All shaders and techniques are ignored. The generated shader simply multiplies the position by the model-view-projection matrix.</li>
    <li>The only supported extensions are CESIUM_RTC and WEB3D_quantized_attributes.</li>
    <li>Only one node is supported.</li>
    <li>Only one mesh per node is supported.</li>
    <li>Only one primitive per mesh is supported.</li>
</ul>

This feature is using part of the 3D Tiles spec that is not final and is subject to change without the standard deprecation policy.


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

### constructor(tileset, url, options)

- `tileset` (`Object`) - The loaded tileset (parsed JSON)
- `url` - (`String) The url to a tileset JSON file.
- `options` Options object, see  with the following properties:

Notes:
- The `version` tileset must be 3D Tiles version 0.0 or 1.0.


### hasExtension(extensionName : String) : Boolean

`true` if the tileset JSON file lists the extension in extensionsUsed; otherwise, `false`.
^param {String} extensionName The name of the extension to check. \*
^returns {Boolean} `true` if the tileset JSON file lists the extension in extensionsUsed; otherwise, `false`.


## Options


- `options.url` (`Resource|String|Promise.Resource|Promise.String`) The url to a tileset JSON file.
- `options.show`=`true` (`Boolean`) - Determines if the tileset will be shown.
- `options.modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix that transforms the tileset's root tile.
- `options.maximumScreenSpaceError`=`16`] (`Number`) - The maximum screen space error used to drive level of detail refinement.
- `options.maximumMemoryUsage`=`512`] (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
- `options.dynamicScreenSpaceError`=`false`] (`Boolean`) - Optimization option. Reduce the screen space error for tiles that are further away from the camera.
- `options.dynamicScreenSpaceErrorDensity`=`0.00278`] (`Number`) - Density used to adjust the dynamic screen space error, similar to fog density.
- `options.dynamicScreenSpaceErrorFactor`=`4.0`] (`Number`) - A factor used to increase the computed dynamic screen space error.
- `options.skipLevelOfDetail`=`true` (`Boolean`) - Optimization option. Determines if level of detail skipping should be applied during the traversal.
- `options.baseScreenSpaceError`=`1024` (`Number`) - When `skipLevelOfDetail` is `true`, the screen space error that must be reached before skipping levels of detail.
- `options.ellipsoid`=`Ellipsoid.WGS84` (`Ellipsoid`) - The ellipsoid determining the size and shape of the globe.

Callbacks
- `options.onTileLoad` (`void(tileHeader)`) -
- `options.onTileUnload` (`void(tileHeader)`) -
- `options.onTileError` (`void(tileHeader, message : String)`) -


### dynamicScreenSpaceError

=`false`

Optimization option. Whether the tileset should refine based on a dynamic screen space error. Tiles that are further away will be rendered with lower detail than closer tiles. This improves performance by rendering fewer tiles and making less requests, but may result in a slight drop in visual quality for tiles in the distance.

The algorithm is biased towards "street views" where the camera is close to the ground plane of the tileset and looking at the horizon. In addition results are more accurate for tightly fitting bounding volumes like box and region.

### dynamicScreenSpaceErrorDensity

=`0.00278`

A scalar that determines the density used to adjust the dynamic screen space error (similar to "fog"). Increasing this value has the effect of increasing the maximum screen space error for all tiles, but in a non-linear fashion.

The error starts at 0.0 and increases exponentially until a midpoint is reached, and then approaches 1.0 asymptotically. This has the effect of keeping high detail in the closer tiles and lower detail in the further tiles, with all tiles beyond a certain distance all roughly having an error of 1.0.


The dynamic error is in the range [0.0, 1.0) and is multiplied by `dynamicScreenSpaceErrorFactor` to produce the
final dynamic error. This dynamic error is then subtracted from the tile's actual screen space error.

Increasing `dynamicScreenSpaceErrorDensity` has the effect of moving the error midpoint closer to the camera.
It is analogous to moving fog closer to the camera.

### dynamicScreenSpaceErrorFactor

= 4.0;

A factor used to increase the screen space error of tiles for dynamic screen space error. As this value increases less tiles
are requested for rendering and tiles in the distance will have lower detail. If set to zero, the feature will be disabled.

### onTileLoad(tileHeader : Tile3DHeader) : void

Indicate ssthat a tile's content was loaded.

The loaded `Tile3DHeader` is passed to the event listener.

This event is fired during the tileset traversal while the frame is being rendered
so that updates to the tile take effect in the same frame.  Do not create or modify
entities or primitives during the event listener.

```js
  new Tileset3D({
    onTileLoad(tileHeader => console.log('A tile was loaded.'));
  });
```

### onTileUnload(tileHeader : Tile3DHeader) : void

Indicates that a tile's content was unloaded.

The unloaded `Tile3DHeaders` is passed to the event listener.

This event is fired immediately before the tile's content is unloaded while the frame is being
rendered so that the event listener has access to the tile's content.  Do not create
or modify entities or primitives during the event listener.

```js
  new Tileset3D({
    onTileUnload(tile =>  console.log('A tile was unloaded from the cache.'));
  });
```

See
- Tileset3D#maximumMemoryUsage
- Tileset3D#trimLoadedTiles


### onTileError(tileHeader : Tile3DHeader) : void

Called to indicate that a tile's content failed to load. By default, error messages will be logged to the console.

The error object passed to the listener contains two properties:
- `url`: the url of the failed tile.
- `message`: the error message.

```js
  new Tileset3D({
    onTileFailed(tileHeader, url, message) {
      console.log('An error occurred loading tile: ', url);
      console.log('Error: ', message);
    }
  });
```

### skipLevelOfDetail : Boolean

Default: true

Optimization option. Determines if level of detail skipping should be applied during the traversal.

The common strategy for replacement-refinement traversal is to store all levels of the tree in memory and require
all children to be loaded before the parent can refine. With this optimization levels of the tree can be skipped
entirely and children can be rendered alongside their parents. The tileset requires significantly less memory when
using this optimization.


### baseScreenSpaceError : Number

Default: 1024

The screen space error that must be reached before skipping levels of detail.

Only used when `skipLevelOfDetail` is `true`.

### skipScreenSpaceErrorFactor : Number

Default: 16

Multiplier defining the minimum screen space error to skip.
For example, if a tile has screen space error of 100, no tiles will be loaded unless they
are leaves or have a screen space error `<= 100 / skipScreenSpaceErrorFactor`.

Only used when `Tileset3D.skipLevelOfDetail` is `true`.

### skipLevels

Default: 1

Constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped.
For example, if a tile is level 1, no tiles will be loaded unless they are at level greater than 2.

Only used when `Tileset3D.skipLevelOfDetail` is `true`.

### immediatelyLoadDesiredLevelOfDetail : false

When true, only tiles that meet the maximum screen space error will ever be downloaded.
Skipping factors are ignored and just the desired tiles are loaded.

Only used when `Tileset3D.skipLevelOfDetail` is `true`.

### loadSiblings: false

Determines whether siblings of visible tiles are always downloaded during traversal.
This may be useful for ensuring that tiles are already available when the viewer turns left/right.

Only used when `Tileset3D.skipLevelOfDetail` is `true`.
