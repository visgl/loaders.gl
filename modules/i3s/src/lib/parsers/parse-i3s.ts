import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {load} from '@loaders.gl/core';
import {TILE_TYPE, TILE_REFINEMENT, TILESET_TYPE} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../helpers/i3s-nodepages-tiles';
import {generateTileAttributeUrls, getUrlWithToken} from '../utils/url-utils';
import {
  I3sTilesetHeader,
  I3sTileHeader,
  Mbs
} from '../../types';
import type {LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';

export function normalizeTileData(tile : I3sTileHeader, options : LoaderOptions, context: LoaderContext) {
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

export function normalizeTileNonUrlData(tile : I3sTileHeader) {
  const box = tile.obb
    ? [
      ...Ellipsoid.WGS84.cartographicToCartesian(tile.obb.center), // cartesian center of box
      ...tile.obb.halfSize, // halfSize
      ...tile.obb.quaternion // quaternion
    ]
    : undefined;
  let sphere : Mbs;
  if (tile.mbs) {
    sphere = [
      ...Ellipsoid.WGS84.cartographicToCartesian(tile.mbs.slice(0, 3)), // cartesian center of sphere
      tile.mbs[3] // radius of sphere
    ] as Mbs;
  } else if (box) {
    const obb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
      box.slice(0, 3),
      tile.obb.halfSize,
      tile.obb.quaternion
    );
    const boundingSphere = obb.getBoundingSphere();
    sphere = [...boundingSphere.center , boundingSphere.radius] as Mbs;
    tile.mbs = [...tile.obb.center, boundingSphere.radius] as Mbs;
  }

  tile.boundingVolume = {
    // @ts-ignore
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

export async function normalizeTilesetData(tileset : I3sTilesetHeader, options : LoaderOptions, context: LoaderContext) {
  tileset.url = context.url;

  if (tileset.nodePages) {
    tileset.nodePagesTile = new I3SNodePagesTiles(tileset, options);
    tileset.root = await tileset.nodePagesTile.formTileFromNodePages(0);
  } else {
    const rootNodeUrl = getUrlWithToken(`${tileset.url}/nodes/root`, options.i3s?.token);
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
