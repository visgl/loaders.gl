/* eslint-disable no-var */

// var features = require('../../test/data/roads.json').features;
// var features = require("../../test/data/vancouver-blocks.json").features;

// TODO: add data type to options to customize whether positions data type is float 32 or float 64
export function featuresToBinary(features, options = {}) {
  var options = firstPass(features);
  return secondPass(features, firstPassObject);
}


// detecting if any 3D coordinates are present
// detecting which properties are present so that you can add columns for these (may not be in all features)
// counting the lengths of various arrays so you can allocate the typed arrays up front instead of building up temporary JS arrays.
// etc...

function firstPass(features, options = {}) {
  var {} = options;

  // Counts the number of _positions_, so [x, y, z] counts as one
  var pointPositions = 0;
  var linePositions = 0;
  var linePaths = 0;
  var maxCoordLength = 2;

  for (var feature of features) {
    var geometry = feature.geometry;

    switch (geometry.type) {
      case 'Point':
        pointPositions++;
        if (geometry.coordinates.length === 3) maxCoordLength = 3;
        break;
      case 'MultiPoint':
        pointPositions += geometry.coordinates.length;

        break;
      case 'LineString':
        linePositions += geometry.coordinates.length;
        linePaths++;
        break;
      case 'MultiLineString':
        for (const line of geometry.coordinates) {
          linePositions += line.length;
          linePaths++;
        }
        break;
      case 'Polygon':
        break;
      case 'MultiPolygon':
        break;
      default:
        throw new Error('Invalid geometry type');
    }
  }

  return {pointPositions, linePositions, linePaths, maxCoordLength};
}

function secondPass(features, options) {
  var {pointPositions, linePositions, linePaths, maxCoordLength} = options;
  var points = {
    positions: new Float32Array(pointPositions * maxCoordLength),
    objectIds: new Uint32Array(pointPositions)
  };
  var lines = {
    // NOTE: does pathIndices need to be linePathsCounter + 1?
    pathIndices: new Uint32Array(linePaths),
    positions: new Float32Array(linePositions * maxCoordLength),
    objectIds: new Uint32Array(linePositions)
  };
  var polygons = {
    polygonIndices: [0],
    primitivePolygonIndices: [0],
    positions: [],
    objectIds: []
  };

  var index = {
    pointPosition: 0,
    linePosition: 0,
    linePath: 0,
    feature: 0,
  }

  for (var feature of features) {
    var geometry = feature.geometry;

    switch (geometry.type) {
      case 'Point':

        break;
      case 'MultiPoint':

        break;
      case 'LineString':
        // coords = geometry.coordinates
        handleLineString({coords: geometry.coordinates, lines, index, maxCoordLength})
        break;
      case 'MultiLineString':
        handleMultiLineString({coords: geometry.coordinates, lines, index, maxCoordLength})
        break;
      case 'Polygon':
        break;
      case 'MultiPolygon':
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    index.feature++
  }

  return {
    points,
    lines,
    polygons
  };
}

// NOTE: Functions are impure

function handleLineString({coords, lines, index, maxCoordLength}) {
  lines.pathIndices[index.linePath] = index.linePosition * maxCoordLength
  index.linePath++

  // TODO: if maxCoordLength is 3, check length of each geometry.coordinates array, filling
  // 3rd value if necessary?
  lines.positions.set(coords.flat(), index.linePosition * maxCoordLength)

  var nCoords = coords.length;
  lines.objectIds.set(new Uint32Array(nCoords).fill(index.feature), index.linePosition)
  index.linePosition += nCoords
}

function handleMultiLineString({coords, lines, index, maxCoordLength}) {
  for (var line of coords) {
    handleLineString({coords: line, lines, index, maxCoordLength})
  }
}

