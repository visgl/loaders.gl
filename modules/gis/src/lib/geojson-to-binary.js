/* eslint-disable no-var */

// var features = require('../../test/data/roads.json').features;
// var features = require("../../test/data/vancouver-blocks.json").features;

// TODO: add data type to options to customize whether positions data type is float 32 or float 64
export function featuresToBinary(features, options = {}) {
  var options = firstPass(features);
  return secondPass(features, options);
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
  var polygonPositions = 0;
  var polygonObjects = 0;
  var polygonRings = 0;
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
        polygonObjects++;
        polygonRings += geometry.coordinates.length;
        polygonPositions += geometry.coordinates.flat(1).length;
        break;
      case 'MultiPolygon':
        for (const polygon of geometry.coordinates) {
          polygonObjects++;
          polygonRings += polygon.length;
          polygonPositions += polygon.flat(1).length;
        }
        break;
      default:
        throw new Error(`Unsupported geometry type: ${geometry.type}`);
    }
  }

  return {
    pointPositions,
    linePositions,
    linePaths,
    coordLength: maxCoordLength,
    polygonPositions,
    polygonObjects,
    polygonRings
  };
}

function secondPass(features, options) {
  var {
    pointPositions,
    linePositions,
    linePaths,
    coordLength,
    polygonPositions,
    polygonObjects,
    polygonRings
  } = options;
  var points = {
    positions: new Float32Array(pointPositions * coordLength),
    objectIds: new Uint32Array(pointPositions)
  };
  var lines = {
    pathIndices: new Uint32Array(linePaths),
    positions: new Float32Array(linePositions * coordLength),
    objectIds: new Uint32Array(linePositions)
  };
  var polygons = {
    polygonIndices: new Uint32Array(polygonObjects),
    primitivePolygonIndices: new Uint32Array(polygonRings),
    positions: new Float32Array(polygonPositions * coordLength),
    objectIds: new Uint32Array(polygonPositions)
  };

  var index = {
    pointPosition: 0,
    linePosition: 0,
    linePath: 0,
    polygonPosition: 0,
    polygonObject: 0,
    polygonRing: 0,
    feature: 0
  };

  for (var feature of features) {
    var geometry = feature.geometry;

    switch (geometry.type) {
      case 'Point':
        handlePoint({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'MultiPoint':
        handleMultiPoint({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'LineString':
        handleLineString({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'MultiLineString':
        handleMultiLineString({coords: geometry.coordinates, lines, index, coordLength});
        break;
      case 'Polygon':
        handlePolygon({coords: geometry.coordinates, polygons, index, coordLength});
        break;
      case 'MultiPolygon':
        handleMultiPolygon({coords: geometry.coordinates, polygons, index, coordLength});
        break;
      default:
        throw new Error('Invalid geometry type');
    }

    index.feature++;
  }

  return {
    points,
    lines,
    polygons
  };
}

function handlePoint({coords, points, index, coordLength}) {
  points.positions.set(coords, index.pointPosition * coordLength);
  points.objectIds[index.pointPosition] = index.feature;
  index.pointPosition++;
}

function handleMultiPoint({coords, points, index, coordLength}) {
  for (var point of coords) {
    handlePoint({coords: point, points, index, coordLength});
  }
}

// NOTE: Functions are impure
function handleLineString({coords, lines, index, coordLength}) {
  lines.pathIndices[index.linePath] = index.linePosition * coordLength;
  index.linePath++;

  // TODO: if coordLength is 3, check length of each geometry.coordinates array, filling
  // 3rd value if necessary?
  lines.positions.set(coords.flat(), index.linePosition * coordLength);

  var nPositions = coords.length;
  lines.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.linePosition);
  index.linePosition += nPositions;
}

function handleMultiLineString({coords, lines, index, coordLength}) {
  for (var line of coords) {
    handleLineString({coords: line, lines, index, coordLength});
  }
}

function handlePolygon({coords, polygons, index, coordLength}) {
  // index within polygon positions array of where each polygon starts
  polygons.polygonIndices[index.polygonObject] = index.polygonPosition * coordLength;
  index.polygonObject++;

  for (var ring of coords) {
    polygons.primitivePolygonIndices[index.polygonRing] = index.polygonPosition * coordLength;
    index.polygonRing++;
  }

  polygons.positions.set(coords.flat(2), index.polygonPosition * coordLength);

  var nPositions = coords.flat(1).length;
  polygons.objectIds.set(new Uint32Array(nPositions).fill(index.feature), index.polygonPosition);
  index.polygonPosition += nPositions;
}

function handleMultiPolygon({coords, lines, index, coordLength}) {
  for (var polygon of coords) {
    handleLineString({coords: polygon, lines, index, coordLength});
  }
}
