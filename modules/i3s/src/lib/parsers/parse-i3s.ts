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
  Node3DIndexDocument,
  SceneLayer3D
} from '../../types';
import type {LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import { I3SLoader } from '../../i3s-loader';

export function normalizeTileData(tile : Node3DIndexDocument, context: LoaderContext): I3STileHeader {
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

  const children = tile.children || [];

  return normalizeTileNonUrlData({
    ...tile,
    children,
    url,
    contentUrl,
    textureUrl,
    textureFormat: 'jpg', // `jpg` format will cause `ImageLoader` usage that will be able to handle `png` as well
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
  const type = TILE_TYPE.MESH;
  /**
   * I3S specification supports only REPLACE
   */
  const refine = TILE_REFINEMENT.REPLACE;

  return {...tile, mbs, boundingVolume, lodMetricType, lodMetricValue, type, refine};
}

export async function normalizeTilesetData(tileset : SceneLayer3D, options : LoaderOptions, context: LoaderContext): Promise<I3STileHeader | I3STilesetHeader> {
  const url = context.url;
  let nodePagesTile: I3SNodePagesTiles | undefined;
  let root: I3STileHeader | I3STilesetHeader;
  if (tileset.nodePages) {
    nodePagesTile = new I3SNodePagesTiles(tileset, url, options);
    root = await nodePagesTile.formTileFromNodePages(0);
  } else {
    // @ts-expect-error options is not properly typed
    const rootNodeUrl = getUrlWithToken(`${url}/nodes/root`, options.i3s?.token);
    // eslint-disable-next-line no-use-before-define
    root = await load(rootNodeUrl, I3SLoader, {
      ...options,
      i3s: {
        // @ts-expect-error options is not properly typed
        ...options.i3s,
        loadContent: false, isTileHeader: true, isTileset: false}
    });
  }

  return {
    ...tileset,
    loader: I3SLoader,
    url,
    basePath: url,
    type: TILESET_TYPE.I3S,
    nodePagesTile,
    // @ts-expect-error
    root,
    lodMetricType: root.lodMetricType,
    lodMetricValue: root.lodMetricValue
  }
}
