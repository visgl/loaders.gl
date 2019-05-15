export default class Tile3DRender {
  // Gets or sets the tile's highlight color.
  // @memberof Tile3D.prototype
  // @type {Color}
  // @default {@link Color.WHITE}
  get color() {
    if (!defined(this._color)) {
      this._color = new Color();
    }
    return Color.clone(this._color);
  }

  set color(value) {
    this._color = Color.clone(value, this._color);
    this._colorDirty = true;
  }

  // Returns the number of draw commands used by this tile.
  get commandsLength() {
    return this._commandsLength;
  }

}


// eslint-disable-next-line max-statements, complexity
function applyDebugSettings(tile, tileset, frameState) {
  if (!frameState.passes.render) {
    return;
  }

  const hasContentBoundingVolume = defined(tile._header.content) && defined(tile._header.content.boundingVolume);
  const empty = tile.hasEmptyContent || tile.hasTilesetContent;

  const showVolume = tileset.debugShowBoundingVolume || (tileset.debugShowContentBoundingVolume && !hasContentBoundingVolume);
  if (showVolume) {
    let color;
    if (!tile._finalResolution) {
      color = Color.YELLOW;
    } else if (empty) {
      color = Color.DARKGRAY;
    } else {
      color = Color.WHITE;
    }
    if (!defined(tile._debugBoundingVolume)) {
      tile._debugBoundingVolume = tile._boundingVolume.createDebugVolume(color);
    }
    tile._debugBoundingVolume.update(frameState);
    const attributes = tile._debugBoundingVolume.getGeometryInstanceAttributes('outline');
    attributes.color = ColorGeometryInstanceAttribute.toValue(color, attributes.color);
  } else if (!showVolume && defined(tile._debugBoundingVolume)) {
    tile._debugBoundingVolume = tile._debugBoundingVolume.destroy();
  }

  if (tileset.debugShowContentBoundingVolume && hasContentBoundingVolume) {
    if (!defined(tile._debugContentBoundingVolume)) {
      tile._debugContentBoundingVolume = tile._contentBoundingVolume.createDebugVolume(Color.BLUE);
    }
    tile._debugContentBoundingVolume.update(frameState);
  } else if (!tileset.debugShowContentBoundingVolume && defined(tile._debugContentBoundingVolume)) {
    tile._debugContentBoundingVolume = tile._debugContentBoundingVolume.destroy();
  }

  if (tileset.debugShowViewerRequestVolume && defined(tile._viewerRequestVolume)) {
    if (!defined(tile._debugViewerRequestVolume)) {
      tile._debugViewerRequestVolume = tile._viewerRequestVolume.createDebugVolume(Color.YELLOW);
    }
    tile._debugViewerRequestVolume.update(frameState);
  } else if (!tileset.debugShowViewerRequestVolume && defined(tile._debugViewerRequestVolume)) {
    tile._debugViewerRequestVolume = tile._debugViewerRequestVolume.destroy();
  }

  const debugColorizeTilesOn = tileset.debugColorizeTiles && !tile._debugColorizeTiles;
  const debugColorizeTilesOff = !tileset.debugColorizeTiles && tile._debugColorizeTiles;

  if (debugColorizeTilesOn) {
    tile._debugColorizeTiles = true;
    tile.color = tile._debugColor;
  } else if (debugColorizeTilesOff) {
    tile._debugColorizeTiles = false;
    tile.color = Color.WHITE;
  }

  if (tile._colorDirty) {
    tile._colorDirty = false;
    tile._content.applyDebugSettings(true, tile._color);
  }

  if (debugColorizeTilesOff) {
    tileset.makeStyleDirty(); // Re-apply style now that colorize is switched off
  }
}

function updateClippingPlanes(tile, tileset) {
  // Compute and compare ClippingPlanes state:
  // - enabled-ness - are clipping planes enabled? is this tile clipped?
  // - clipping plane count
  // - clipping function (union v. intersection)
  const clippingPlanes = tileset.clippingPlanes;
  const currentClippingPlanesState = 0;
  if (defined(clippingPlanes) && tile._isClipped && clippingPlanes.enabled) {
    currentClippingPlanesState = clippingPlanes.clippingPlanesState;
  }
  // If clippingPlaneState for tile changed, mark clippingPlanesDirty so content can update
  if (currentClippingPlanesState !== tile._clippingPlanesState) {
    tile._clippingPlanesState = currentClippingPlanesState;
    tile.clippingPlanesDirty = true;
  }
}


// 2d support?

function getBoundingVolume(tile, frameState) {
  if (frameState.mode !== SceneMode.SCENE3D && !defined(tile._boundingVolume2D)) {
    const boundingSphere = tile._boundingVolume.boundingSphere;
    const sphere = BoundingSphere.projectTo2D(boundingSphere, frameState.mapProjection, scratchProjectedBoundingSphere);
    tile._boundingVolume2D = new TileBoundingSphere(sphere.center, sphere.radius);
  }

  return frameState.mode !== SceneMode.SCENE3D ? tile._boundingVolume2D : tile._boundingVolume;
}

function getContentBoundingVolume(tile, frameState) {
  if (frameState.mode !== SceneMode.SCENE3D && !defined(tile._contentBoundingVolume2D)) {
    const boundingSphere = tile._contentBoundingVolume.boundingSphere;
    const sphere = BoundingSphere.projectTo2D(boundingSphere, frameState.mapProjection, scratchProjectedBoundingSphere);
    tile._contentBoundingVolume2D = new TileBoundingSphere(sphere.center, sphere.radius);
  }
  return frameState.mode !== SceneMode.SCENE3D ? tile._contentBoundingVolume2D : tile._contentBoundingVolume;
}

