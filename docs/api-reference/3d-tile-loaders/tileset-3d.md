# Tileset3D (Experimental)

> The 3D tiles loaders are still under development. If you are interested in early access, please open an issue.

A [3D Tiles tileset](https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification), used for streaming massive heterogeneous 3D geospatial datasets.

## Usage

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';
const tileset = new Tileset3D({
  url: 'http://localhost:8002/tilesets/Seattle/tileset.json'
});
```

Common setting for the skipLevelOfDetail optimization

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';
const tileset = new Tileset3D({
  url: 'http://localhost:8002/tilesets/Seattle/tileset.json',
  skipLevelOfDetail: true,
  baseScreenSpaceError: 1024,
  skipScreenSpaceErrorFactor: 16,
  skipLevels: 1,
  immediatelyLoadDesiredLevelOfDetail: false,
  loadSiblings: false,
  cullWithChildrenBounds: true
});
```

Common settings for the dynamicScreenSpaceError optimization

```js
import {Tileset3D} from '@loaders.gl/3d-tiles';
const tileset = new Tileset3D({
  url: 'http://localhost:8002/tilesets/Seattle/tileset.json',
  dynamicScreenSpaceError: true,
  dynamicScreenSpaceErrorDensity: 0.00278,
  dynamicScreenSpaceErrorFactor: 4.0,
  dynamicScreenSpaceErrorHeightFalloff: 0.25
});
```

## Methods

### constructor(options)

Notes: The tileset must be 3D Tiles version 0.0 or 1.0.

`options` Object with the following properties:

- `options.url` (`Resource|String|Promise<Resource>|Promise<String>`) The url to a tileset JSON file.
- `options.show`=`true` (`Boolean`) - Determines if the tileset will be shown.
- `options.modelMatrix`=`Matrix4.IDENTITY` (`Matrix4`) - A 4x4 transformation matrix that transforms the tileset's root tile.
- `options.maximumScreenSpaceError`=`16`] (`Number`) - The maximum screen space error used to drive level of detail refinement.
- `options.maximumMemoryUsage`=`512`] (`Number`) - The maximum amount of memory in MB that can be used by the tileset.
- `options.cullWithChildrenBounds`=`true`] (`Boolean`) - Optimization option. Whether to cull tiles using the union of their children bounding volumes.
- `options.dynamicScreenSpaceError`=`false`] (`Boolean`) - Optimization option. Reduce the screen space error for tiles that are further away from the camera.
- `options.dynamicScreenSpaceErrorDensity`=`0.00278`] (`Number`) - Density used to adjust the dynamic screen space error, similar to fog density.
- `options.dynamicScreenSpaceErrorFactor`=`4.0`] (`Number`) - A factor used to increase the computed dynamic screen space error.
- `options.dynamicScreenSpaceErrorHeightFalloff`=`0.25` (`Number`) - A ratio of the tileset's height at which the density starts to falloff.
- `options.skipLevelOfDetail`=`true` (`Boolean`) - Optimization option. Determines if level of detail skipping should be applied during the traversal.
- `options.baseScreenSpaceError`=`1024` (`Number`) - When <code>skipLevelOfDetail</code> is <code>true</code>, the screen space error that must be reached before skipping levels of detail.
- `options.skipScreenSpaceErrorFactor`=`16` (`Number`) - When <code>skipLevelOfDetail</code> is <code>true</code>, a multiplier defining the minimum screen space error to skip. Used in conjunction with <code>skipLevels</code> to determine which tiles to load.
- `options.skipLevels`=`1` (`Number`) - When <code>skipLevelOfDetail</code> is <code>true</code>, a constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped. Used in conjunction with <code>skipScreenSpaceErrorFactor</code> to determine which tiles to load.
- `options.immediatelyLoadDesiredLevelOfDetail`=`false` (`Boolean`) - When <code>skipLevelOfDetail</code> is <code>true</code>, only tiles that meet the maximum screen space error will ever be downloaded. Skipping factors are ignored and just the desired tiles are loaded.
- `options.loadSiblings`=`false` (`Boolean`) - When <code>skipLevelOfDetail</code> is <code>true</code>, determines whether siblings of visible tiles are always downloaded during traversal.

Rendering Options:

- `options.shadows`=`ShadowMode.ENABLED`] (`ShadowMode`) - Determines whether the tileset casts or receives shadows from each light source.
- `options.clippingPlanes`= (`ClippingPlaneCollection`) The (`@link ClippingPlaneCollection`) used to selectively disable rendering the tileset.
- `options.classificationType` (`ClassificationType`) - Determines whether terrain, 3D Tiles or both will be classified by this tileset. See (`@link Tileset3D#classificationType`) for details about restrictions and limitations.
- `options.ellipsoid`=`Ellipsoid.WGS84` (`Ellipsoid`) - The ellipsoid determining the size and shape of the globe.
- `options.pointCloudShading`] (`Object`) - Options for constructing a (`@link PointCloudShading`) object to control point attenuation based on geometric error and lighting.
- `options.imageBasedLightingFactor`=`[1.0, 1.0]` - Scales the diffuse and specular image-based lighting from the earth, sky, atmosphere and star skybox.
- `options.lightColor`= (Number[3]) - The color and intensity of the sunlight used to shade models.
- (`Number`) `options.luminanceAtZenith`=`0`. - 5] The sun's luminance at the zenith in kilo candela per meter squared to use for this model's procedural environment map.
- (`Cartesian3[]`) `options.sphericalHarmonicCoefficients`] The third order spherical harmonic coefficients used for the diffuse color of image-based lighting.
- (`String`) `options.specularEnvironmentMaps`] A URL to a KTX file that contains a cube map of the specular lighting and the convoluted specular mipmaps.

Debug Options:

- `options.debugFreezeFrame`=`false` (`Boolean`) - For debugging only. Determines if only the tiles from last frame should be used for rendering.
- `options.debugColorizeTiles`=`false` (`Boolean`) - For debugging only. When true, assigns a random color to each tile.
- `options.debugWireframe`=`false` (`Boolean`) - For debugging only. When true, render's each tile's content as a wireframe.
- `options.debugShowBoundingVolume`=`false`](`Boolean`) - For debugging only. When true, renders the bounding volume for each tile.
- `options.debugShowContentBoundingVolume`=`false` (`Boolean`) - For debugging only. When true, renders the bounding volume for each tile's content.
- `options.debugShowViewerRequestVolume`=`false` (`Boolean`) - For debugging only. When true, renders the viewer request volume for each tile.
- `options.debugShowGeometricError`=`false` (`Boolean`) - For debugging only. When true, draws labels to indicate the geometric error of each tile.
- `options.debugShowRenderingStatistics`=`false` (`Boolean`) - For debugging only. When true, draws labels to indicate the number of commands, points, triangles and features for each tile.
- `options.debugShowMemoryUsage`=`false` (`Boolean`) - For debugging only. When true, draws labels to indicate the texture and geometry memory in megabytes used by each tile.
- `options.debugShowUrl`=`false` (`Boolean`) - For debugging only. When true, draws labels to indicate the url of each tile.

### hasExtension(extensionName : String) : Boolean

<code>true</code> if the tileset JSON file lists the extension in extensionsUsed; otherwise, <code>false</code>.
@param {String} extensionName The name of the extension to check. \*
@returns {Boolean} <code>true</code> if the tileset JSON file lists the extension in extensionsUsed; otherwise, <code>false</code>.


## Option

### dynamicScreenSpaceError

=`false`

Optimization option. Whether the tileset should refine based on a dynamic screen space error. Tiles that are further away will be rendered with lower detail than closer tiles. This improves performance by rendering fewer tiles and making less requests, but may result in a slight drop in visual quality for tiles in the distance.

The algorithm is biased towards "street views" where the camera is close to the ground plane of the tileset and looking at the horizon. In addition results are more accurate for tightly fitting bounding volumes like box and region.

### dynamicScreenSpaceErrorDensity

=`0.00278`

A scalar that determines the density used to adjust the dynamic screen space error (similar to "fog"). Increasing this value has the effect of increasing the maximum screen space error for all tiles, but in a non-linear fashion.

The error starts at 0.0 and increases exponentially until a midpoint is reached, and then approaches 1.0 asymptotically. This has the effect of keeping high detail in the closer tiles and lower detail in the further tiles, with all tiles beyond a certain distance all roughly having an error of 1.0.

<p>
The dynamic error is in the range [0.0, 1.0) and is multiplied by <code>dynamicScreenSpaceErrorFactor</code> to produce the
final dynamic error. This dynamic error is then subtracted from the tile's actual screen space error.
</p>
<p>
Increasing <code>dynamicScreenSpaceErrorDensity</code> has the effect of moving the error midpoint closer to the camera.
It is analogous to moving fog closer to the camera.
</p>

### dynamicScreenSpaceErrorFactor

= 4.0;

A factor used to increase the screen space error of tiles for dynamic screen space error. As this value increases less tiles
are requested for rendering and tiles in the distance will have lower detail. If set to zero, the feature will be disabled.

### dynamicScreenSpaceErrorHeightFalloff

= 0.25;

A ratio of the tileset's height at which the density starts to falloff. If the camera is below this height the
full computed density is applied, otherwise the density falls off. This has the effect of higher density at
street level views.

<p>
Valid values are between 0.0 and 1.0.
</p>

    /**
    The event fired to indicate progress of loading new tiles.  This event is fired when a new tile
    is requested, when a requested tile is finished downloading, and when a downloaded tile has been
    processed and is ready to render.
    <p>
    The number of pending tile requests, <code>numberOfPendingRequests</code>, and number of tiles
    processing, <code>numberOfTilesProcessing</code> are passed to the event listener.
    </p>
    <p>
    This event is fired at the end of the frame after the scene is rendered.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.loadProgress.addEventListener(function(numberOfPendingRequests, numberOfTilesProcessing) {
        if ((numberOfPendingRequests === 0) && (numberOfTilesProcessing === 0)) {
            console.log('Stopped loading');
            return;
        }
     *
        console.log('Loading: requests: ' + numberOfPendingRequests + ', processing: ' + numberOfTilesProcessing);
    });
     */
    this.loadProgress = new Event();

    /**
    The event fired to indicate that all tiles that meet the screen space error this frame are loaded. The tileset
    is completely loaded for this view.
    <p>
    This event is fired at the end of the frame after the scene is rendered.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.allTilesLoaded.addEventListener(function() {
        console.log('All tiles are loaded');
    });
     *
    @see Tileset3D#tilesLoaded
     */
    this.allTilesLoaded = new Event();

    /**
    The event fired to indicate that all tiles that meet the screen space error this frame are loaded. This event
    is fired once when all tiles in the initial view are loaded.
    <p>
    This event is fired at the end of the frame after the scene is rendered.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.initialTilesLoaded.addEventListener(function() {
        console.log('Initial tiles are loaded');
    });
     *
    @see Tileset3D#allTilesLoaded
     */
    this.initialTilesLoaded = new Event();

    /**
    The event fired to indicate that a tile's content was loaded.
    <p>
    The loaded {@link Cesium3DTile} is passed to the event listener.
    </p>
    <p>
    This event is fired during the tileset traversal while the frame is being rendered
    so that updates to the tile take effect in the same frame.  Do not create or modify
    Cesium entities or primitives during the event listener.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.tileLoad.addEventListener(function(tile) {
        console.log('A tile was loaded.');
    });
     */
    this.tileLoad = new Event();

    /**
    The event fired to indicate that a tile's content was unloaded.
    <p>
    The unloaded {@link Cesium3DTile} is passed to the event listener.
    </p>
    <p>
    This event is fired immediately before the tile's content is unloaded while the frame is being
    rendered so that the event listener has access to the tile's content.  Do not create
    or modify Cesium entities or primitives during the event listener.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.tileUnload.addEventListener(function(tile) {
        console.log('A tile was unloaded from the cache.');
    });
     *
    @see Tileset3D#maximumMemoryUsage
    @see Tileset3D#trimLoadedTiles
     */
    this.tileUnload = new Event();

    /**
    The event fired to indicate that a tile's content failed to load.
    <p>
    If there are no event listeners, error messages will be logged to the console.
    </p>
    <p>
    The error object passed to the listener contains two properties:
    <ul>
    <li><code>url</code>: the url of the failed tile.</li>
    <li><code>message</code>: the error message.</li>
    </ul>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.tileFailed.addEventListener(function(error) {
        console.log('An error occurred loading tile: ' + error.url);
        console.log('Error: ' + error.message);
    });
     */
    this.tileFailed = new Event();

    /**
    This event fires once for each visible tile in a frame.  This can be used to manually
    style a tileset.
    <p>
    The visible {@link Cesium3DTile} is passed to the event listener.
    </p>
    <p>
    This event is fired during the tileset traversal while the frame is being rendered
    so that updates to the tile take effect in the same frame.  Do not create or modify
    Cesium entities or primitives during the event listener.
    </p>
     *
    @type {Event}
    @default new Event()
     *
    @example
    tileset.tileVisible.addEventListener(function(tile) {
        if (tile.content instanceof Cesium.Batched3DModel3DTileContent) {
            console.log('A Batched 3D Model tile is visible.');
        }
    });
     *
    @example
    // Apply a red style and then manually set random colors for every other feature when the tile becomes visible.
    tileset.style = new Cesium.Cesium3DTileStyle({
        color : 'color("red")'
    });
    tileset.tileVisible.addEventListener(function(tile) {
        var content = tile.content;
        var featuresLength = content.featuresLength;
        for (var i = 0; i < featuresLength; i+=2) {
            content.getFeature(i).color = Cesium.Color.fromRandom();
        }
    });
     */
    this.tileVisible = new Event();

    this.skipLevelOfDetail = defaultValue(options.skipLevelOfDetail, true);
    /**
    Optimization option. Determines if level of detail skipping should be applied during the traversal.
    <p>
    The common strategy for replacement-refinement traversal is to store all levels of the tree in memory and require
    all children to be loaded before the parent can refine. With this optimization levels of the tree can be skipped
    entirely and children can be rendered alongside their parents. The tileset requires significantly less memory when
    using this optimization.
    </p>
     *
    @type {Boolean}
    @default true
     */
    this._skipLevelOfDetail = this.skipLevelOfDetail;
    this._disableSkipLevelOfDetail = false;

    this.baseScreenSpaceError = defaultValue(options.baseScreenSpaceError, 1024);
    /**
    The screen space error that must be reached before skipping levels of detail.
    <p>
    Only used when {@link Tileset3D#skipLevelOfDetail} is <code>true</code>.
    </p>
     *
    @type {Number}
    @default 1024
     */

    this.skipScreenSpaceErrorFactor = defaultValue(options.skipScreenSpaceErrorFactor, 16);
    /**
    Multiplier defining the minimum screen space error to skip.
    For example, if a tile has screen space error of 100, no tiles will be loaded unless they
    are leaves or have a screen space error <code><= 100 / skipScreenSpaceErrorFactor</code>.
    <p>
    Only used when {@link Tileset3D#skipLevelOfDetail} is <code>true</code>.
    </p>
     *
    @type {Number}
    @default 16
     */

    this.skipLevels = defaultValue(options.skipLevels, 1);
    /**
    Constant defining the minimum number of levels to skip when loading tiles. When it is 0, no levels are skipped.
    For example, if a tile is level 1, no tiles will be loaded unless they are at level greater than 2.
    <p>
    Only used when {@link Tileset3D#skipLevelOfDetail} is <code>true</code>.
    </p>
     *
    @type {Number}
    @default 1
     */

    this.immediatelyLoadDesiredLevelOfDetail = defaultValue(options.immediatelyLoadDesiredLevelOfDetail, false);
    /**
    When true, only tiles that meet the maximum screen space error will ever be downloaded.
    Skipping factors are ignored and just the desired tiles are loaded.
    <p>
    Only used when {@link Tileset3D#skipLevelOfDetail} is <code>true</code>.
    </p>
     *
    @type {Boolean}
    @default false
     */

    /**
    Determines whether siblings of visible tiles are always downloaded during traversal.
    This may be useful for ensuring that tiles are already available when the viewer turns left/right.
    <p>
    Only used when {@link Tileset3D#skipLevelOfDetail} is <code>true</code>.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.loadSiblings = defaultValue(options.loadSiblings, false);

    this._clippingPlanes = undefined;
    this.clippingPlanes = options.clippingPlanes;

    this._imageBasedLightingFactor = new Cartesian2(1.0, 1.0);
    Cartesian2.clone(options.imageBasedLightingFactor, this._imageBasedLightingFactor);


    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    Determines if only the tiles from last frame should be used for rendering.  This
    effectively "freezes" the tileset to the previous frame so it is possible to zoom
    out and see what was rendered.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugFreezeFrame = defaultValue(options.debugFreezeFrame, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, assigns a random color to each tile.  This is useful for visualizing
    what features belong to what tiles, especially with additive refinement where features
    from parent tiles may be interleaved with features from child tiles.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugColorizeTiles = defaultValue(options.debugColorizeTiles, false);

/\*\*
Gets the tileset's asset object property, which contains metadata about the tileset.

  <p>
  See the {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-asset|asset schema reference}
  in the 3D Tiles spec for the full set of properties.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Object}
  @readonly
   *
  @exception {DeveloperError} The tileset is not loaded.  Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.
   */
  get asset() {
    //>>includeStart('debug', pragmas.debug);
    if (!this.ready) {
      throw new DeveloperError('The tileset is not loaded.  Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.');
    }
    //>>includeEnd('debug');

    return this._asset;

}

/\*_
The {@link ClippingPlaneCollection} used to selectively disable rendering the tileset.
_
@memberof Tileset3D.prototype
_
@type {ClippingPlaneCollection}
_/
get clippingPlanes() {
return this.\_clippingPlanes;
},
set clippingPlanes(value) {
ClippingPlaneCollection.setOwner(value, this, '\_clippingPlanes');
},

/\*\*
Gets the tileset's properties dictionary object, which contains metadata about per-feature properties.

  <p>
  See the {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#reference-properties|properties schema reference}
  in the 3D Tiles spec for the full set of properties.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Object}
  @readonly
   *
  @exception {DeveloperError} The tileset is not loaded.  Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.
   *
  @example
  console.log('Maximum building height: ' + tileset.properties.height.maximum);
  console.log('Minimum building height: ' + tileset.properties.height.minimum);
   *
  @see Cesium3DTileFeature#getProperty
  @see Cesium3DTileFeature#setProperty
   */
  get properties() {
    //>>includeStart('debug', pragmas.debug);
    if (!this.ready) {
      throw new DeveloperError('The tileset is not loaded.  Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.');
    }
    //>>includeEnd('debug');

    return this._properties;

}

/\*_
When <code>true</code>, the tileset's root tile is loaded and the tileset is ready to render.
This is set to <code>true</code> right before {@link Tileset3D#readyPromise} is resolved.
_
@memberof Tileset3D.prototype
_
@type {Boolean}
@readonly
_
@default false
\*/
get ready() {
return defined(this.\_root);
}

/\*\*
Gets the promise that will be resolved when the tileset's root tile is loaded and the tileset is ready to render.

  <p>
  This promise is resolved at the end of the frame before the first frame the tileset is rendered in.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Promise.<Tileset3D>}
  @readonly
   *
  @example
  tileset.readyPromise.then(function(tileset) {
      // tile.properties is not defined until readyPromise resolves.
      var properties = tileset.properties;
      if (Cesium.defined(properties)) {
          for (var name in properties) {
              console.log(properties[name]);
          }
      }
  });
   */
  get readyPromise() {
    return this._readyPromise.promise;
  }

/\*_
When <code>true</code>, all tiles that meet the screen space error this frame are loaded. The tileset is
completely loaded for this view.
_
@memberof Tileset3D.prototype
_
@type {Boolean}
@readonly
_
@default false
_
@see Tileset3D#allTilesLoaded
_/
get tilesLoaded() {
return this.\_tilesLoaded;
}

/\*_
The url to a tileset JSON file.
_
@memberof Tileset3D.prototype
_
@type {String}
@readonly
_/
get url() {
return this.\_url;
}

/\*_
The base path that non-absolute paths in tileset JSON file are relative to.
_
@memberof Tileset3D.prototype
_
@type {String}
@readonly
@deprecated
_/
get basePath() {
deprecationWarning('Tileset3D.basePath', 'Tileset3D.basePath has been deprecated. All tiles are relative to the url of the tileset JSON file that contains them. Use the url property instead.');
return this.\_basePath;
}

/\*\*
The maximum screen space error used to drive level of detail refinement. This value helps determine when a tile
refines to its descendants, and therefore plays a major role in balancing performance with visual quality.

  <p>
  A tile's screen space error is roughly equivalent to the number of pixels wide that would be drawn if a sphere with a
  radius equal to the tile's <b>geometric error</b> were rendered at the tile's position. If this value exceeds
  <code>maximumScreenSpaceError</code> the tile refines to its descendants.
  </p>
  <p>
  Depending on the tileset, <code>maximumScreenSpaceError</code> may need to be tweaked to achieve the right balance.
  Higher values provide better performance but lower visual quality.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Number}
  @default 16
   *
  @exception {DeveloperError} <code>maximumScreenSpaceError</code> must be greater than or equal to zero.
   */
  get maximumScreenSpaceError() {
    return this._maximumScreenSpaceError;
  }

set maximumScreenSpaceError(value) {
//>>includeStart('debug', pragmas.debug);
Check.typeOf.number.greaterThanOrEquals('maximumScreenSpaceError', value, 0);
//>>includeEnd('debug');
this.\_maximumScreenSpaceError = value;
}

/\*\*
The maximum amount of GPU memory (in MB) that may be used to cache tiles. This value is estimated from
geometry, textures, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.

  <p>
  Tiles not in view are unloaded to enforce this.
  </p>
  <p>
  If decreasing this value results in unloading tiles, the tiles are unloaded the next frame.
  </p>
  <p>
  If tiles sized more than <code>maximumMemoryUsage</code> are needed
  to meet the desired screen space error, determined by {@link Tileset3D#maximumScreenSpaceError},
  for the current view, then the memory usage of the tiles loaded will exceed
  <code>maximumMemoryUsage</code>.  For example, if the maximum is 256 MB, but
  300 MB of tiles are needed to meet the screen space error, then 300 MB of tiles may be loaded.  When
  these tiles go out of view, they will be unloaded.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Number}
  @default 512
   *
  @exception {DeveloperError} <code>maximumMemoryUsage</code> must be greater than or equal to zero.
  @see Tileset3D#totalMemoryUsageInBytes
   */
  get maximumMemoryUsage() {
    return this._maximumMemoryUsage;
  },
  set maximumMemoryUsage(value) {
    Check.typeOf.number.greaterThanOrEquals('value', value, 0);
    this._maximumMemoryUsage = value;
  }

/\*_
The root tile.
_
@memberOf Tileset3D.prototype
_
@type {Cesium3DTile}
@readonly
_
@exception {DeveloperError} The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.
\*/
get root() {
//>>includeStart('debug', pragmas.debug);
if (!this.ready) {
throw new DeveloperError('The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.');
}
//>>includeEnd('debug');

    return this._root;

}

/\*_
The tileset's bounding sphere.
_
@memberof Tileset3D.prototype
_
@type {BoundingSphere}
@readonly
_
@exception {DeveloperError} The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.
_
@example
var tileset = viewer.scene.primitives.add(new Cesium.Tileset3D({
url : 'http://localhost:8002/tilesets/Seattle/tileset.json'
}));
_
tileset.readyPromise.then(function(tileset) {
// Set the camera to view the newly added tileset
viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.5, 0));
});
\*/
get boundingSphere() {
//>>includeStart('debug', pragmas.debug);
if (!this.ready) {
throw new DeveloperError('The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.');
}
//>>includeEnd('debug');

    this._root.updateTransform(this._modelMatrix);
    return this._root.boundingSphere;

}

/\*_
A 4x4 transformation matrix that transforms the entire tileset.
_
@memberof Tileset3D.prototype
_
@type {Matrix4}
@default Matrix4.IDENTITY
_
@example
// Adjust a tileset's height from the globe's surface.
var heightOffset = 20.0;
var boundingSphere = tileset.boundingSphere;
var cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);
var surface = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, 0.0);
var offset = Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, heightOffset);
var translation = Cesium.Cartesian3.subtract(offset, surface, new Cesium.Cartesian3());
tileset.modelMatrix = Cesium.Matrix4.fromTranslation(translation);
\*/
get modelMatrix() {
return this.\_modelMatrix;
}

set modelMatrix(value) {
this.\_modelMatrix = Matrix4.clone(value, this.\_modelMatrix);
}

/\*_
Returns the time, in milliseconds, since the tileset was loaded and first updated.
_
@memberof Tileset3D.prototype
_
@type {Number}
@readonly
_/
get timeSinceLoad() {
return this.\_timeSinceLoad;
}
},

/\*_
The total amount of GPU memory in bytes used by the tileset. This value is estimated from
geometry, texture, and batch table textures of loaded tiles. For point clouds, this value also
includes per-point metadata.
_
@memberof Tileset3D.prototype
_
@type {Number}
@readonly
_
@see Tileset3D#maximumMemoryUsage
\*/
get totalMemoryUsageInBytes() {
var statistics = this.\_statistics;
return statistics.texturesByteLength + statistics.geometryByteLength + statistics.batchTableByteLength;
}
},

/\*_
@private
_/
get clippingPlanesOriginMatrix() {
if (!defined(this.\_clippingPlanesOriginMatrix)) {
return Matrix4.IDENTITY;
}

      if (this._clippingPlanesOriginMatrixDirty) {
        Matrix4.multiply(this.root.computedTransform, this._initialClippingPlanesOriginMatrix, this._clippingPlanesOriginMatrix);
        this._clippingPlanesOriginMatrixDirty = false;
      }

      return this._clippingPlanesOriginMatrix;
    }

},

/\*_
@private
_/
get styleEngine() {
return this.\_styleEngine;
}
},

/\*_
@private
_/
get statistics() {
return this.\_statistics;
}
},

/\*\*
Determines whether terrain, 3D Tiles or both will be classified by this tileset.

  <p>
  This option is only applied to tilesets containing batched 3D models, geometry data, or vector data. Even when undefined, vector data and geometry data
  must render as classifications and will default to rendering on both terrain and other 3D Tiles tilesets.
  </p>
  <p>
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
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {ClassificationType}
  @default undefined
   *
  @experimental This feature is using part of the 3D Tiles spec that is not final and is subject to change without Cesium's standard deprecation policy.
  @readonly
   */
  get classificationType() {
    return this._classificationType;
  }
},

/\*_
Gets an ellipsoid describing the shape of the globe.
_
@memberof Tileset3D.prototype
_
@type {Ellipsoid}
@readonly
_/
get ellipsoid() {
return this.\_ellipsoid;
}
},

/\*_
Returns the <code>extras</code> property at the top-level of the tileset JSON, which contains application specific metadata.
Returns <code>undefined</code> if <code>extras</code> does not exist.
_
@memberof Tileset3D.prototype
_
@exception {DeveloperError} The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.
_
@type {_}
@readonly
_
@see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#specifying-extensions-and-application-specific-extras|Extras in the 3D Tiles specification.}
\*/
get extras() {
//>>includeStart('debug', pragmas.debug);
if (!this.ready) {
throw new DeveloperError('The tileset is not loaded. Use Tileset3D.readyPromise or wait for Tileset3D.ready to be true.');
}
//>>includeEnd('debug');

      return this._extras;
    }

},

/\*_
Provides a hook to override the method used to request the tileset json
useful when fetching tilesets from remote servers
@param {Resource|String} tilesetUrl The url of the json file to be fetched
@returns {Promise.<Object>} A promise that resolves with the fetched json data
_/
Tileset3D.loadJson = function(tilesetUrl) {
var resource = Resource.createIfNeeded(tilesetUrl);
return resource.fetchJson();
};

/\*_
Marks the tileset's {@link Tileset3D#style} as dirty, which forces all
features to re-evaluate the style in the next frame each is visible.
_/
Tileset3D.prototype.makeStyleDirty = function() {
this.\_styleEngine.makeDirty();
};

/\*_
Loads the main tileset JSON file or a tileset JSON file referenced from a tile.
_
@private
\*/
Tileset3D.prototype.loadTileset = function(resource, tilesetJson, parentTile) {
var asset = tilesetJson.asset;
if (!defined(asset)) {
throw new RuntimeError('Tileset must have an asset property.');
}
if (asset.version !== '0.0' && asset.version !== '1.0') {
throw new RuntimeError('The tileset must be 3D Tiles version 0.0 or 1.0.');
}

var statistics = this.\_statistics;

var tilesetVersion = asset.tilesetVersion;
if (defined(tilesetVersion)) {
// Append the tileset version to the resource
this.\_basePath += '?v=' + tilesetVersion;
resource.setQueryParameters({ v: tilesetVersion });
} else {
delete resource.queryParameters.v;
}

// A tileset JSON file referenced from a tile may exist in a different directory than the root tileset.
// Get the basePath relative to the external tileset.
var rootTile = new Cesium3DTile(this, resource, tilesetJson.root, parentTile);

// If there is a parentTile, add the root of the currently loading tileset
// to parentTile's children, and update its \_depth.
if (defined(parentTile)) {
parentTile.children.push(rootTile);
rootTile.\_depth = parentTile.\_depth + 1;
}

var stack = [];
stack.push(rootTile);

while (stack.length > 0) {
var tile = stack.pop();
++statistics.numberOfTilesTotal;
this.\_allTilesAdditive = this.\_allTilesAdditive && (tile.refine === Cesium3DTileRefine.ADD);
var children = tile.\_header.children;
if (defined(children)) {
var length = children.length;
for (var i = 0; i < length; ++i) {
var childHeader = children[i];
var childTile = new Cesium3DTile(this, resource, childHeader, tile);
tile.children.push(childTile);
childTile.\_depth = tile.\_depth + 1;
stack.push(childTile);
}
}

    if (this._cullWithChildrenBounds) {
      Cesium3DTileOptimizations.checkChildrenWithinParent(tile);
    }

}

return rootTile;
};

var scratchPositionNormal = new Cartesian3();
var scratchCartographic = new Cartographic();
var scratchMatrix = new Matrix4();
var scratchCenter = new Cartesian3();
var scratchPosition = new Cartesian3();
var scratchDirection = new Cartesian3();

function updateDynamicScreenSpaceError(tileset, frameState) {
var up;
var direction;
var height;
var minimumHeight;
var maximumHeight;

var camera = frameState.camera;
var root = tileset.\_root;
var tileBoundingVolume = root.contentBoundingVolume;

if (tileBoundingVolume instanceof TileBoundingRegion) {
up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
direction = camera.directionWC;
height = camera.positionCartographic.height;
minimumHeight = tileBoundingVolume.minimumHeight;
maximumHeight = tileBoundingVolume.maximumHeight;
} else {
// Transform camera position and direction into the local coordinate system of the tileset
var transformLocal = Matrix4.inverseTransformation(root.computedTransform, scratchMatrix);
var ellipsoid = frameState.mapProjection.ellipsoid;
var boundingVolume = tileBoundingVolume.boundingVolume;
var centerLocal = Matrix4.multiplyByPoint(transformLocal, boundingVolume.center, scratchCenter);
if (Cartesian3.magnitude(centerLocal) > ellipsoid.minimumRadius) {
// The tileset is defined in WGS84. Approximate the minimum and maximum height.
var centerCartographic = Cartographic.fromCartesian(centerLocal, ellipsoid, scratchCartographic);
up = Cartesian3.normalize(camera.positionWC, scratchPositionNormal);
direction = camera.directionWC;
height = camera.positionCartographic.height;
minimumHeight = 0.0;
maximumHeight = centerCartographic.height2.0;
} else {
// The tileset is defined in local coordinates (z-up)
var positionLocal = Matrix4.multiplyByPoint(transformLocal, camera.positionWC, scratchPosition);
up = Cartesian3.UNIT_Z;
direction = Matrix4.multiplyByPointAsVector(transformLocal, camera.directionWC, scratchDirection);
direction = Cartesian3.normalize(direction, direction);
height = positionLocal.z;
if (tileBoundingVolume instanceof TileOrientedBoundingBox) {
// Assuming z-up, the last component stores the half-height of the box
var boxHeight = root.\_header.boundingVolume.box[11];
minimumHeight = centerLocal.z - boxHeight;
maximumHeight = centerLocal.z + boxHeight;
} else if (tileBoundingVolume instanceof TileBoundingSphere) {
var radius = boundingVolume.radius;
minimumHeight = centerLocal.z - radius;
maximumHeight = centerLocal.z + radius;
}
}
}

// The range where the density starts to lessen. Start at the quarter height of the tileset.
var heightFalloff = tileset.dynamicScreenSpaceErrorHeightFalloff;
var heightClose = minimumHeight + (maximumHeight - minimumHeight)heightFalloff;
var heightFar = maximumHeight;

var t = CesiumMath.clamp((height - heightClose) / (heightFar - heightClose), 0.0, 1.0);

// Increase density as the camera tilts towards the horizon
var dot = Math.abs(Cartesian3.dot(direction, up));
var horizonFactor = 1.0 - dot;

// Weaken the horizon factor as the camera height increases, implying the camera is further away from the tileset.
// The goal is to increase density for the "street view", not when viewing the tileset from a distance.
horizonFactor = horizonFactor(1.0 - t);

var density = tileset.dynamicScreenSpaceErrorDensity;
density \*= horizonFactor;

tileset.\_dynamicScreenSpaceErrorComputedDensity = density;
}

///////////////////////////////////////////////////////////////////////////

function requestContent(tileset, tile) {
if (tile.hasEmptyContent) {
return;
}

var statistics = tileset.\_statistics;
var expired = tile.contentExpired;
var requested = tile.requestContent();

if (!requested) {
++statistics.numberOfAttemptedRequests;
return;
}

if (expired) {
if (tile.hasTilesetContent) {
destroySubtree(tileset, tile);
} else {
statistics.decrementLoadCounts(tile.content);
--statistics.numberOfTilesWithContentReady;
}
}

++statistics.numberOfPendingRequests;

tile.contentReadyToProcessPromise.then(addToProcessingQueue(tileset, tile));
tile.contentReadyPromise.then(handleTileSuccess(tileset, tile)).otherwise(handleTileFailure(tileset, tile));
}

function sortRequestByPriority(a, b) {
return a.\_priority - b.\_priority;
}

function requestTiles(tileset) {
// Sort requests by priority before making any requests.
// This makes it less likely that requests will be cancelled after being issued.
var requestedTiles = tileset.\_requestedTiles;
var length = requestedTiles.length;
requestedTiles.sort(sortRequestByPriority);
for (var i = 0; i < length; ++i) {
requestContent(tileset, requestedTiles[i]);
}
}

function addToProcessingQueue(tileset, tile) {
return function() {
tileset.\_processingQueue.push(tile);

    --tileset._statistics.numberOfPendingRequests;
    ++tileset._statistics.numberOfTilesProcessing;

};
}

function handleTileFailure(tileset, tile) {
return function(error) {
if (tileset.\_processingQueue.indexOf(tile) >= 0) {
// Failed during processing
--tileset.\_statistics.numberOfTilesProcessing;
} else {
// Failed when making request
--tileset.\_statistics.numberOfPendingRequests;
}

    var url = tile._contentResource.url;
    var message = defined(error.message) ? error.message : error.toString();
    if (tileset.tileFailed.numberOfListeners > 0) {
      tileset.tileFailed.raiseEvent({
        url : url,
        message : message
      });
    } else {
      console.log('A 3D tile failed to load: ' + url);
      console.log('Error: ' + message);
    }

};
}

function handleTileSuccess(tileset, tile) {
return function() {
--tileset.\_statistics.numberOfTilesProcessing;

    if (!tile.hasTilesetContent) {
      // RESEARCH_IDEA: ability to unload tiles (without content) for an
      // external tileset when all the tiles are unloaded.
      tileset._statistics.incrementLoadCounts(tile.content);
      ++tileset._statistics.numberOfTilesWithContentReady;

      // Add to the tile cache. Previously expired tiles are already in the cache and won't get re-added.
      tileset._cache.add(tile);
    }

    tileset.tileLoad.raiseEvent(tile);

};
}

function filterProcessingQueue(tileset) {
var tiles = tileset.\_processingQueue;
var length = tiles.length;

var removeCount = 0;
for (var i = 0; i < length; ++i) {
var tile = tiles[i];
if (tile.\_contentState !== Cesium3DTileContentState.PROCESSING) {
++removeCount;
continue;
}
if (removeCount > 0) {
tiles[i - removeCount] = tile;
}
}
tiles.length -= removeCount;
}

function processTiles(tileset, frameState) {
filterProcessingQueue(tileset);
var tiles = tileset.\_processingQueue;
var length = tiles.length;
// Process tiles in the PROCESSING state so they will eventually move to the READY state.
for (var i = 0; i < length; ++i) {
tiles[i].process(tileset, frameState);
}
}

///////////////////////////////////////////////////////////////////////////

var stringOptions = {
maximumFractionDigits : 3
};

function formatMemoryString(memorySizeInBytes) {
var memoryInMegabytes = memorySizeInBytes / 1048576;
if (memoryInMegabytes < 1.0) {
return memoryInMegabytes.toLocaleString(undefined, stringOptions);
}
return Math.round(memoryInMegabytes).toLocaleString();
}

function updateTiles(tileset, frameState) {
tileset.\_styleEngine.applyStyle(tileset, frameState);

var statistics = tileset.\_statistics;
var passes = frameState.passes;
var isRender = passes.render;
var commandList = frameState.commandList;
var numberOfInitialCommands = commandList.length;
var selectedTiles = tileset.\_selectedTiles;
var selectedLength = selectedTiles.length;
var emptyTiles = tileset.\_emptyTiles;
var emptyLength = emptyTiles.length;
var tileVisible = tileset.tileVisible;
var i;
var tile;

var bivariateVisibilityTest = tileset.\_skipLevelOfDetail && tileset.\_hasMixedContent && frameState.context.stencilBuffer && selectedLength > 0;

tileset.\_backfaceCommands.length = 0;

if (bivariateVisibilityTest) {
if (!defined(tileset.\_stencilClearCommand)) {
tileset.\_stencilClearCommand = new ClearCommand({
stencil : 0,
pass : Pass.CESIUM_3D_TILE,
renderState : RenderState.fromCache({
stencilMask : StencilConstants.SKIP_LOD_MASK
})
});
}
commandList.push(tileset.\_stencilClearCommand);
}

var lengthBeforeUpdate = commandList.length;
for (i = 0; i < selectedLength; ++i) {
tile = selectedTiles[i];
// Raise the tileVisible event before update in case the tileVisible event
// handler makes changes that update needs to apply to WebGL resources
if (isRender) {
tileVisible.raiseEvent(tile);
}
tile.update(tileset, frameState);
statistics.incrementSelectionCounts(tile.content);
++statistics.selected;
}
for (i = 0; i < emptyLength; ++i) {
tile = emptyTiles[i];
tile.update(tileset, frameState);
}

var addedCommandsLength = commandList.length - lengthBeforeUpdate;

tileset.\_backfaceCommands.trim();

if (bivariateVisibilityTest) {
/\*_
Consider 'effective leaf' tiles as selected tiles that have no selected descendants. They may have children,
but they are currently our effective leaves because they do not have selected descendants. These tiles
are those where with tile.\_finalResolution === true.
Let 'unresolved' tiles be those with tile.\_finalResolution === false.
_ 1. Render just the backfaces of unresolved tiles in order to lay down z 2. Render all frontfaces wherever tile.\_selectionDepth > stencilBuffer.
Replace stencilBuffer with tile.\_selectionDepth, when passing the z test.
Because children are always drawn before ancestors {@link Tileset3DTraversal#traverseAndSelect},
this effectively draws children first and does not draw ancestors if a descendant has already
been drawn at that pixel.
Step 1 prevents child tiles from appearing on top when they are truly behind ancestor content.
If they are behind the backfaces of the ancestor, then they will not be drawn.
_
NOTE: Step 2 sometimes causes visual artifacts when backfacing child content has some faces that
partially face the camera and are inside of the ancestor content. Because they are inside, they will
not be culled by the depth writes in Step 1, and because they partially face the camera, the stencil tests
will draw them on top of the ancestor content.
_
NOTE: Because we always render backfaces of unresolved tiles, if the camera is looking at the backfaces
of an object, they will always be drawn while loading, even if backface culling is enabled.
\*/

    var backfaceCommands = tileset._backfaceCommands.values;
    var backfaceCommandsLength = backfaceCommands.length;

    commandList.length += backfaceCommandsLength;

    // copy commands to the back of the commandList
    for (i = addedCommandsLength - 1; i >= 0; --i) {
      commandList[lengthBeforeUpdate + backfaceCommandsLength + i] = commandList[lengthBeforeUpdate + i];
    }

    // move backface commands to the front of the commandList
    for (i = 0; i < backfaceCommandsLength; ++i) {
      commandList[lengthBeforeUpdate + i] = backfaceCommands[i];
    }

}

// Number of commands added by each update above
addedCommandsLength = commandList.length - numberOfInitialCommands;
statistics.numberOfCommands = addedCommandsLength;

// Only run EDL if simple attenuation is on
if (isRender &&
tileset.pointCloudShading.attenuation &&
tileset.pointCloudShading.eyeDomeLighting &&
(addedCommandsLength > 0)) {
tileset.\_pointCloudEyeDomeLighting.update(frameState, numberOfInitialCommands, tileset.pointCloudShading);
}

if (isRender) {
if (tileset.debugShowGeometricError || tileset.debugShowRenderingStatistics || tileset.debugShowMemoryUsage || tileset.debugShowUrl) {
if (!defined(tileset.\_tileDebugLabels)) {
tileset.\_tileDebugLabels = new LabelCollection();
}
updateTileDebugLabels(tileset, frameState);
} else {
tileset.\_tileDebugLabels = tileset.\_tileDebugLabels && tileset.\_tileDebugLabels.destroy();
}
}
}

/\*\*
Unloads all tiles that weren't selected the previous frame. This can be used to
explicitly manage the tile cache and reduce the total number of tiles loaded below
{@link Tileset3D#maximumMemoryUsage}.

<p>
Tile unloads occur at the next frame to keep all the WebGL delete calls
within the render loop.
</p>
 */
Tileset3D.prototype.trimLoadedTiles = function() {
  this._cache.trim();
};

/\*_
@private
_/
Tileset3D.prototype.update = function(frameState) {
update(this, frameState);
};

/\*_
@private
_/
Tileset3D.prototype.updateAsync = function(frameState) {
return update(this, frameState);
};

/\*_
Returns true if this object was destroyed; otherwise, false.
<br /><br />
If this object was destroyed, it should not be used; calling any function other than
<code>isDestroyed</code> will result in a {@link DeveloperError} exception.
_
@returns {Boolean} <code>true</code> if this object was destroyed; otherwise, <code>false</code>.
_
@see Tileset3D#destroy
_/
Tileset3D.prototype.isDestroyed = function() {
return false;
};

/\*_
Destroys the WebGL resources held by this object. Destroying an object allows for deterministic
release of WebGL resources, instead of relying on the garbage collector to destroy this object.
<br /><br />
Once an object is destroyed, it should not be used; calling any function other than
<code>isDestroyed</code> will result in a {@link DeveloperError} exception. Therefore,
assign the return value (<code>undefined</code>) to the object as done in the example.
_
@exception {DeveloperError} This object was destroyed, i.e., destroy() was called.
_
@example
tileset = tileset && tileset.destroy();
_
@see Tileset3D#isDestroyed
\*/
Tileset3D.prototype.destroy = function() {
