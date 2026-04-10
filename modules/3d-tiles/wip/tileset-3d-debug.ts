// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

function computeTileLabelPosition(tile) {
  var boundingVolume = tile.boundingVolume.boundingVolume;
  var halfAxes = boundingVolume.halfAxes;
  var radius = boundingVolume.radius;

  var position = Cartesian3.clone(boundingVolume.center, scratchCartesian);
  if (defined(halfAxes)) {
    position.x += 0.75 * (halfAxes[0] + halfAxes[3] + halfAxes[6]);
    position.y += 0.75 * (halfAxes[1] + halfAxes[4] + halfAxes[7]);
    position.z += 0.75 * (halfAxes[2] + halfAxes[5] + halfAxes[8]);
  } else if (defined(radius)) {
    var normal = Cartesian3.normalize(boundingVolume.center, scratchCartesian);
    normal = Cartesian3.multiplyByScalar(normal, 0.75 * radius, scratchCartesian);
    position = Cartesian3.add(normal, boundingVolume.center, scratchCartesian);
  }
  return position;
}

function addTileDebugLabel(tile, tileset, position) {
  var labelString = '';
  var attributes = 0;

  if (tileset.debugShowGeometricError) {
    labelString += '\nGeometric error: ' + tile.geometricError;
    attributes++;
  }

  if (tileset.debugShowRenderingStatistics) {
    labelString += '\nCommands: ' + tile.commandsLength;
    attributes++;

    // Don't display number of points or triangles if 0.
    var numberOfPoints = tile.content.pointsLength;
    if (numberOfPoints > 0) {
      labelString += '\nPoints: ' + tile.content.pointsLength;
      attributes++;
    }

    var numberOfTriangles = tile.content.trianglesLength;
    if (numberOfTriangles > 0) {
      labelString += '\nTriangles: ' + tile.content.trianglesLength;
      attributes++;
    }

    labelString += '\nFeatures: ' + tile.content.featuresLength;
    attributes ++;
  }

  if (tileset.debugShowMemoryUsage) {
    labelString += '\nTexture Memory: ' + formatMemoryString(tile.content.texturesByteLength);
    labelString += '\nGeometry Memory: ' + formatMemoryString(tile.content.geometryByteLength);
    attributes += 2;
  }

  if (tileset.debugShowUrl) {
    labelString += '\nUrl: ' + tile._header.content.uri;
    attributes++;
  }

  var newLabel = {
    text : labelString.substring(1),
    position : position,
    font : (19-attributes) + 'px sans-serif',
    showBackground : true,
    disableDepthTestDistance : Number.POSITIVE_INFINITY
  };

  return tileset._tileDebugLabels.add(newLabel);
}

function updateTileDebugLabels(tileset, frameState) {
  var i;
  var tile;
  var selectedTiles = tileset._selectedTiles;
  var selectedLength = selectedTiles.length;
  var emptyTiles = tileset._emptyTiles;
  var emptyLength = emptyTiles.length;
  tileset._tileDebugLabels.removeAll();

  if (tileset.debugPickedTileLabelOnly) {
    if (defined(tileset.debugPickedTile)) {
      var position = (defined(tileset.debugPickPosition)) ? tileset.debugPickPosition : computeTileLabelPosition(tileset.debugPickedTile);
      var label = addTileDebugLabel(tileset.debugPickedTile, tileset, position);
      label.pixelOffset = new Cartesian2(15, -15); // Offset to avoid picking the label.
    }
  } else {
    for (i = 0; i < selectedLength; ++i) {
      tile = selectedTiles[i];
      addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
    }
    for (i = 0; i < emptyLength; ++i) {
      tile = emptyTiles[i];
      if (tile.hasTilesetContent) {
        addTileDebugLabel(tile, tileset, computeTileLabelPosition(tile));
      }
    }
  }
  tileset._tileDebugLabels.update(frameState);
}
