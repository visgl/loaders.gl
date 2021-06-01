import {OrientedBoundingBox, BoundingSphere} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {load} from '@loaders.gl/core';
import {TILE_TYPE, TILE_REFINEMENT, TILESET_TYPE} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../../helpers/i3s-nodepages-tiles';
import {generateTileAttributeUrls, getUrlWithToken} from './url-utils';

export function normalizeTileData(tile, options, context) {
  tile.url = context.url;

  if (tile.featureData) {
    tile.featureUrl = `${tile.url}/${tile.featureData[0].href}`;
  }

  if (tile.geometryData) {
    tile.contentUrl = `${tile.url}/${tile.geometryData[0].href}`;
  }

  if (tile.textureData) {
    tile.textureUrl = `${tile.url}/${tile.textureData[0].href}`;
  }

  if (tile.attributeData) {
    tile.attributeUrls = generateTileAttributeUrls(tile);
  }

  return normalizeTileNonUrlData(tile);
}

function createBox(box) {
  const center = box.slice(0, 3);
  const halfSize = box.slice(3, 6);
  const quaternion = box.slice(6, 11);
  return new OrientedBoundingBox().fromCenterHalfSizeQuaternion(center, halfSize, quaternion);
}

function createSphere(sphere) {
  const center = sphere.slice(0, 3);
  const radius = sphere[3];
  return new BoundingSphere(center, radius);
}

export function normalizeTileNonUrlData(tile) {
  const [x, y, z, radius] = tile.obb
    ? [
        ...tile.obb.center,
        Math.sqrt(tile.obb.halfSize[0] ** 2 + tile.obb.halfSize[1] ** 2 + tile.obb.halfSize[2] ** 2)
      ]
    : tile.mbs;
  const cartesianCenter = Ellipsoid.WGS84.cartographicToCartesian([x, y, z]);
  const cartesianCenterMbs =
    tile.obb && tile.mbs
      ? Ellipsoid.WGS84.cartographicToCartesian(tile.mbs.slice(0, 3))
      : cartesianCenter;
  const radiusMbs = tile.obb && tile.mbs ? tile.mbs[3] : radius;
  tile.mbs = tile.mbs ? tile.mbs : [x, y, z, radius];

  const box =
    tile.obb &&
    createBox([
      ...cartesianCenter, // cartesian center of box
      ...tile.obb.halfSize, // halfSize
      ...tile.obb.quaternion // quaternion
    ]);
  const sphere = createSphere([
    ...cartesianCenterMbs, // cartesian center of sphere
    radiusMbs // radius of sphere
  ]);

  tile.boundingVolume = {
    sphere,
    box
  };
  tile.lodMetricType = tile.lodSelection[0].metricType;
  tile.lodMetricValue = tile.lodSelection[0].maxError;
  tile.transformMatrix = tile.transform;
  tile.type = TILE_TYPE.MESH;
  // TODO only support replacement for now
  tile.refine = TILE_REFINEMENT.REPLACE;
  return tile;
}

export async function normalizeTilesetData(tileset, options, context) {
  tileset.url = context.url;

  if (tileset.nodePages) {
    tileset.nodePagesTile = new I3SNodePagesTiles(tileset, options);
    tileset.root = await tileset.nodePagesTile.formTileFromNodePages(0);
  } else {
    const rootNodeUrl = getUrlWithToken(`${tileset.url}/nodes/root`, options.token);
    // eslint-disable-next-line no-use-before-define
    tileset.root = await load(rootNodeUrl, tileset.loader, {
      i3s: {loadContent: false, isTileHeader: true, isTileset: false}
    });
  }

  // base path that non-absolute paths in tileset are relative to.
  tileset.basePath = tileset.url;
  tileset.type = TILESET_TYPE.I3S;

  // populate from root node
  tileset.lodMetricType = tileset.root.lodMetricType;
  tileset.lodMetricValue = tileset.root.lodMetricValue;
}
