import {Vector3} from '@math.gl/core';
import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {PolygonLayer} from '@deck.gl/layers';
import {getTileColor} from './coloring-utils';

const LINE_WIDTH = 3;
const BG_OPACITY = 20;

export function getObbLayer(tile, options) {
  const data = [
    {
      ...getObbBounds(tile.boundingVolume),
      ...getObbColors(tile, options)
    }
  ];

  return new PolygonLayer({
    id: `obb-debug-${tile.id}`,
    data,
    extruded: true,
    filled: true,
    getPolygon: d => d.boundaries,
    getLineWidth: LINE_WIDTH,
    lineWidthMinPixels: LINE_WIDTH,
    getFillColor: d => d.fillColor,
    getLineColor: d => d.lineColor,
    getElevation: d => d.elevation,
    pickable: false,
    stroked: true,
    wireframe: true
  });
}

function getObbColors(tile, options) {
  const lineColor = getTileColor(tile, options);
  const fillColor = [...lineColor, BG_OPACITY];

  return {fillColor, lineColor};
}

function getObbBounds(boundingVolume) {
  let center;
  let halfSize;
  let radius;

  if (boundingVolume instanceof OrientedBoundingBox) {
    halfSize = boundingVolume.halfSize;
    radius = new Vector3(halfSize[0], halfSize[1], halfSize[2]).len();
    center = boundingVolume.center;
  } else {
    radius = boundingVolume.radius;
    center = boundingVolume.center;
    halfSize = [radius, radius, radius];
  }

  const rightTop = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] + radius, center[1] + radius, center[2]),
    new Vector3()
  );

  const rightBottom = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] + radius, center[1] - radius, center[2]),
    new Vector3()
  );

  const leftTop = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] - radius, center[1] + radius, center[2]),
    new Vector3()
  );

  const leftBottom = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0] - radius, center[1] - radius, center[2]),
    new Vector3()
  );

  const bottomElevation = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0], center[1], center[2]),
    new Vector3()
  );

  const topElevation = Ellipsoid.WGS84.cartesianToCartographic(
    new Vector3(center[0], center[1], center[2] + halfSize[2]),
    new Vector3()
  );

  const elevation = topElevation[2] - bottomElevation[2];
  const boundaries = [
    [
      [leftTop[0], leftTop[1]],
      [rightTop[0], rightTop[1]],
      [rightBottom[0], rightBottom[1]],
      [leftBottom[0], leftBottom[1]],
      [leftTop[0], leftTop[1]]
    ]
  ];

  return {boundaries, elevation};
}
