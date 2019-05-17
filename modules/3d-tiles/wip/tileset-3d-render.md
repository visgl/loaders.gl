# Tileset3DRenderer



    this.show = defaultValue(options.show, true);
    /**
    Determines if the tileset will be shown.
     *
    @type {Boolean}
    @default true
     */

    /**
     * Determines whether the tileset casts or receives shadows from each light source.
     * <p>
     * Enabling shadows has a performance impact. A tileset that casts shadows must be rendered twice, once from the camera and again from the light's point of view.
     * </p>
     * <p>
     * Shadows are rendered only when {@link Viewer#shadows} is <code>true</code>.
     * </p>
     *
     * @type {ShadowMode}
     * @default ShadowMode.ENABLED
     */
    this.shadows = defaultValue(options.shadows, ShadowMode.ENABLED);


    this.colorBlendMode = Cesium3DTileColorBlendMode.HIGHLIGHT;
    /**
    Defines how per-feature colors set from the Cesium API or declarative styling blend with the source colors from
    the original feature, e.g. glTF material or per-point color in the tile.
     *
    @type {Cesium3DTileColorBlendMode}
    @default Cesium3DTileColorBlendMode.HIGHLIGHT
     */

    this.colorBlendAmount = 0.5;
    /**
    Defines the value used to linearly interpolate between the source color and feature color when the {@link Tileset3D#colorBlendMode} is <code>MIX</code>.
    A value of 0.0 results in the source color while a value of 1.0 results in the feature color, with any value in-between
    resulting in a mix of the source color and feature color.
     *
    @type {Number}
    @default 0.5
     */

    this.pointCloudShading = new PointCloudShading(options.pointCloudShading);
    this._pointCloudEyeDomeLighting = new PointCloudEyeDomeLighting();
    /**
    Options for controlling point size based on geometric error and eye dome lighting.
    @type {PointCloudShading}
     */


    /**
    The color and intensity of the sunlight used to shade a model.
    <p>
    For example, disabling additional light sources by setting <code>model.imageBasedLightingFactor = new Cartesian2(0.0, 0.0)</code> will make the
    model much darker. Here, increasing the intensity of the light source will make the model brighter.
    </p>
     *
    @type {Cartesian3}
    @default undefined
     */
    this.lightColor = options.lightColor;

    /**
    The sun's luminance at the zenith in kilo candela per meter squared to use for this model's procedural environment map.
    This is used when {@link Tileset3D#specularEnvironmentMaps} and {@link Tileset3D#sphericalHarmonicCoefficients} are not defined.
     *
    @type Number
     *
    @default 0.5
     *
     */
    this.luminanceAtZenith = defaultValue(options.luminanceAtZenith, 0.5);

    /**
    The third order spherical harmonic coefficients used for the diffuse color of image-based lighting. When <code>undefined</code>, a diffuse irradiance
    computed from the atmosphere color is used.
    <p>
    There are nine <code>Cartesian3</code> coefficients.
    The order of the coefficients is: L<sub>00</sub>, L<sub>1-1</sub>, L<sub>10</sub>, L<sub>11</sub>, L<sub>2-2</sub>, L<sub>2-1</sub>, L<sub>20</sub>, L<sub>21</sub>, L<sub>22</sub>
    </p>
     *
    These values can be obtained by preprocessing the environment map using the <code>cmgen</code> tool of
    {@link https://github.com/google/filament/releases | Google's Filament project}. This will also generate a KTX file that can be
    supplied to {@link Tileset3D#specularEnvironmentMaps}.
     *
    @type {Cartesian3[]}
    @demo {@link https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
    @see {@link https://graphics.stanford.edu/papers/envmap/envmap.pdf|An Efficient Representation for Irradiance Environment Maps}
     */
    this.sphericalHarmonicCoefficients = options.sphericalHarmonicCoefficients;

    /**
    A URL to a KTX file that contains a cube map of the specular lighting and the convoluted specular mipmaps.
     *
    @demo {@link https://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Image-Based Lighting.html|Sandcastle Image Based Lighting Demo}
    @type {String}
    @see Tileset3D#sphericalHarmonicCoefficients
     */
    this.specularEnvironmentMaps = options.specularEnvironmentMaps;

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, renders each tile's content as a wireframe.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugWireframe = defaultValue(options.debugWireframe, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, renders the bounding volume for each visible tile.  The bounding volume is
    white if the tile has a content bounding volume or is empty; otherwise, it is red.  Tiles that don't meet the
    screen space error and are still refining to their descendants are yellow.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowBoundingVolume = defaultValue(options.debugShowBoundingVolume, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, renders the bounding volume for each visible tile's content. The bounding volume is
    blue if the tile has a content bounding volume; otherwise it is red.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowContentBoundingVolume = defaultValue(options.debugShowContentBoundingVolume, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, renders the viewer request volume for each tile.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowViewerRequestVolume = defaultValue(options.debugShowViewerRequestVolume, false);

    this._tileDebugLabels = undefined;
    this.debugPickedTileLabelOnly = false;
    this.debugPickedTile = undefined;
    this.debugPickPosition = undefined;

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, draws labels to indicate the geometric error of each tile.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowGeometricError = defaultValue(options.debugShowGeometricError, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, draws labels to indicate the number of commands, points, triangles and features of each tile.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowRenderingStatistics = defaultValue(options.debugShowRenderingStatistics, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, draws labels to indicate the geometry and texture memory usage of each tile.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowMemoryUsage = defaultValue(options.debugShowMemoryUsage, false);

    /**
    This property is for debugging only; it is not optimized for production use.
    <p>
    When true, draws labels to indicate the url of each tile.
    </p>
     *
    @type {Boolean}
    @default false
     */
    this.debugShowUrl = defaultValue(options.debugShowUrl, false);

    var that = this;
    var resource;
    when(options.url)
      .then(function(url) {
        var basePath;
        resource = Resource.createIfNeeded(url);

        // ion resources have a credits property we can use for additional attribution.
        that._credits = resource.credits;

        if (resource.extension === 'json') {
          basePath = resource.getBaseUri(true);
        } else if (resource.isDataUri) {
          basePath = '';
        }

        that._url = resource.url;
        that._basePath = basePath;

        return Tileset3D.loadJson(resource);
      })
      .then(function(tilesetJson) {
        that._root = that.loadTileset(resource, tilesetJson);
        var gltfUpAxis = defined(tilesetJson.asset.gltfUpAxis) ? Axis.fromName(tilesetJson.asset.gltfUpAxis) : Axis.Y;
        var asset = tilesetJson.asset;
        that._asset = asset;
        that._properties = tilesetJson.properties;
        that._geometricError = tilesetJson.geometricError;
        that._extensionsUsed = tilesetJson.extensionsUsed;
        that._gltfUpAxis = gltfUpAxis;
        that._extras = tilesetJson.extras;

        var extras = asset.extras;
        if (defined(extras) && defined(extras.cesium) && defined(extras.cesium.credits)) {
          var extraCredits = extras.cesium.credits;
          var credits = that._credits;
          if (!defined(credits)) {
            credits = [];
            that._credits = credits;
          }
          for (var i = 0; i < extraCredits.length; i++) {
            var credit = extraCredits[i];
            credits.push(new Credit(credit.html, credit.showOnScreen));
          }
        }

        // Save the original, untransformed bounding volume position so we can apply
        // the tile transform and model matrix at run time
        var boundingVolume = that._root.createBoundingVolume(tilesetJson.root.boundingVolume, Matrix4.IDENTITY);
        var clippingPlanesOrigin = boundingVolume.boundingSphere.center;
        // If this origin is above the surface of the earth
        // we want to apply an ENU orientation as our best guess of orientation.
        // Otherwise, we assume it gets its position/orientation completely from the
        // root tile transform and the tileset's model matrix
        var originCartographic = that._ellipsoid.cartesianToCartographic(clippingPlanesOrigin);
        if (defined(originCartographic) && (originCartographic.height > ApproximateTerrainHeights._defaultMinTerrainHeight)) {
          that._initialClippingPlanesOriginMatrix = Transforms.eastNorthUpToFixedFrame(clippingPlanesOrigin);
        }
        that._clippingPlanesOriginMatrix = Matrix4.clone(that._initialClippingPlanesOriginMatrix);
        that._readyPromise.resolve(that);
      }).otherwise(function(error) {
        that._readyPromise.reject(error);
      });
  }

  /**
  The style, defined using the
  {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language},
  applied to each feature in the tileset.
  <p>
  Assign <code>undefined</code> to remove the style, which will restore the visual
  appearance of the tileset to its default when no style was applied.
  </p>
  <p>
  The style is applied to a tile before the {@link Tileset3D#tileVisible}
  event is raised, so code in <code>tileVisible</code> can manually set a feature's
  properties (e.g. color and show) after the style is applied. When
  a new style is assigned any manually set properties are overwritten.
  </p>
   *
  @memberof Tileset3D.prototype
   *
  @type {Cesium3DTileStyle}
   *
  @default undefined
   *
  @example
  tileset.style = new Cesium.Cesium3DTileStyle({
     color : {
         conditions : [
             ['${Height} >= 100', 'color("purple", 0.5)'],
             ['${Height} >= 50', 'color("red")'],
             ['true', 'color("blue")']
         ]
     },
     show : '${Height} > 0',
     meta : {
         description : '"Building id ${id} has height ${Height}."'
     }
  });
   *
  @see {@link https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification/Styling|3D Tiles Styling language}
   */
  get style() {
    return this._styleEngine.style;
  }

  set style(value) {
    this._styleEngine.style = value;
  }


  /**
  Cesium adds lighting from the earth, sky, atmosphere, and star skybox. This cartesian is used to scale the final
  diffuse and specular lighting contribution from those sources to the final color. A value of 0.0 will disable those light sources.
   *
  @type {Cartesian2}
  @default Cartesian2(1.0, 1.0)
   */
  get imageBasedLightingFactor() {
    return this._imageBasedLightingFactor;
  },
  set : function(value) {
      //>>includeStart('debug', pragmas.debug);
      Check.typeOf.object('imageBasedLightingFactor', value);
      Check.typeOf.number.greaterThanOrEquals('imageBasedLightingFactor.x', value.x, 0.0);
      Check.typeOf.number.lessThanOrEquals('imageBasedLightingFactor.x', value.x, 1.0);
      Check.typeOf.number.greaterThanOrEquals('imageBasedLightingFactor.y', value.y, 0.0);
      Check.typeOf.number.lessThanOrEquals('imageBasedLightingFactor.y', value.y, 1.0);
      //>>includeEnd('debug');
      Cartesian2.clone(value, this._imageBasedLightingFactor);
    }
  }
});

