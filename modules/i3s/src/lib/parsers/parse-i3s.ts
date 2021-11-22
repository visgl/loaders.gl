import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {load} from '@loaders.gl/core';
import {TILE_TYPE, TILE_REFINEMENT, TILESET_TYPE} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../helpers/i3s-nodepages-tiles';
import {generateTileAttributeUrls, getUrlWithToken} from '../utils/url-utils';
import {
  I3STilesetHeader,
  I3STileHeader,
  Mbs,
  I3SMinimalNodeData,
  Node3DIndexDocument
} from '../../types';
import type {LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';

export function normalizeTileData(tile : Node3DIndexDocument, options : LoaderOptions, context: LoaderContext): I3STileHeader {
  const url: string = context.url || '';
  let contentUrl: string | undefined;
  if (tile.geometryData) {
    contentUrl = `${url}/${tile.geometryData[0].href}`;
  }

  let textureUrl: string | undefined;
  if (tile.textureData) {
    textureUrl = `${url}/${tile.textureData[0].href}`;
  }

  let attributeUrls: string[] | undefined;
  if (tile.attributeData) {
    attributeUrls = generateTileAttributeUrls(url, tile);
  }

  return normalizeTileNonUrlData({
    ...tile,
    url,
    contentUrl,
    textureUrl,
    attributeUrls,
    isDracoGeometry: false
  });
}

export function normalizeTileNonUrlData(tile : I3SMinimalNodeData): I3STileHeader {
  const boundingVolume: {box?: number[]; sphere?: number[]} = {};
  let mbs: Mbs = [0, 0, 0, 1];
  if (tile.mbs) {
    mbs = tile.mbs;
    boundingVolume.sphere = [
      ...Ellipsoid.WGS84.cartographicToCartesian(tile.mbs.slice(0, 3)), // cartesian center of sphere
      tile.mbs[3] // radius of sphere
    ] as Mbs;
  } else if (tile.obb) {
    boundingVolume.box = [
      ...Ellipsoid.WGS84.cartographicToCartesian(tile.obb.center), // cartesian center of box
      ...tile.obb.halfSize, // halfSize
      ...tile.obb.quaternion // quaternion
    ];
    const obb = new OrientedBoundingBox().fromCenterHalfSizeQuaternion(
      boundingVolume.box.slice(0, 3),
      tile.obb.halfSize,
      tile.obb.quaternion
    );
    const boundingSphere = obb.getBoundingSphere();
    boundingVolume.sphere = [...boundingSphere.center , boundingSphere.radius] as Mbs;
    mbs = [...tile.obb.center, boundingSphere.radius] as Mbs;
  }

  const lodMetricType = tile.lodSelection?.[0].metricType;
  const lodMetricValue = tile.lodSelection?.[0].maxError;
  const transformMatrix = tile.transform;
  const type = TILE_TYPE.MESH;
  /**
   * I3S specification supports only REPLACE
   */
  const refine = TILE_REFINEMENT.REPLACE;

  return {...tile, mbs, boundingVolume, lodMetricType, lodMetricValue, transformMatrix, type, refine};
}

export async function normalizeTilesetData(tileset : I3STilesetHeader, options : LoaderOptions, context: LoaderContext) {
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
