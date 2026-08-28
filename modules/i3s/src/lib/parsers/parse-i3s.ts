// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {OrientedBoundingBox} from '@math.gl/culling';
import {Ellipsoid} from '@math.gl/geospatial';
import {load} from '@loaders.gl/core';
import {TILE_TYPE, TILE_REFINEMENT, TILESET_TYPE} from '@loaders.gl/tiles';
import I3SNodePagesTiles from '../helpers/i3s-nodepages-tiles';
import {generateTileAttributeUrls, getUrlWithToken, getUrlWithoutParams} from '../utils/url-utils';
import {
  I3STilesetHeader,
  I3STileHeader,
  Mbs,
  I3SMinimalNodeData,
  Node3DIndexDocument,
  SceneLayer3D,
  I3SParseOptions,
  I3SMaterialDefinition,
  I3STextureFormat,
  SharedResources
} from '../../types';
import type {LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import {I3SLoaderWithParser} from '../../i3s-loader-with-parser';
import {getI3SSpatialReference} from '@loaders.gl/tiles';

export async function normalizeTileData(
  tile: Node3DIndexDocument,
  context: LoaderContext
): Promise<I3STileHeader> {
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

  const sharedResources = await loadSharedResources(tile, context);
  const sharedMaterial = getLegacyMaterialDefinition(sharedResources);
  const sharedTextureFormat = getLegacyTextureFormat(sharedResources);

  return normalizeTileNonUrlData({
    ...tile,
    children,
    url,
    contentUrl,
    textureUrl,
    textureFormat: sharedTextureFormat || 'jpg', // `jpg` format selects bitmap image loading that can also handle `png`
    attributeUrls,
    materialDefinition: sharedMaterial,
    sharedResources,
    isDracoGeometry: false
  });
}

/**
 * Load the legacy shared-resource bundle referenced by a 1.6 node document.
 * @param tile - legacy node document
 * @param context - loader context used for relative resource access
 * @returns decoded shared resources, or undefined when the optional resource is unavailable
 */
async function loadSharedResources(
  tile: Node3DIndexDocument,
  context: LoaderContext
): Promise<SharedResources | undefined> {
  const sharedResource = tile.sharedResource;
  if (!sharedResource?.href || !context.fetch) {
    return undefined;
  }

  const nodeUrl = getUrlWithoutParams(context.url || context.baseUrl || '');
  const sharedResourceUrl = resolveRelativeResourceUrl(nodeUrl, sharedResource.href);
  const requestUrl = `${sharedResourceUrl}${context.queryString || ''}`;

  try {
    const response = await context.fetch(requestUrl);
    if (!response.ok) {
      return undefined;
    }
    return (await response.json()) as SharedResources;
  } catch (_error) {
    // Shared resources are optional in some 1.6 services. Keep loading the node
    // when the service does not expose the optional material bundle.
    return undefined;
  }
}

/**
 * Resolve a resource href relative to the node document's directory.
 * @param baseUrl - node document directory
 * @param href - resource href from the node document
 * @returns resolved resource URL
 */
function resolveRelativeResourceUrl(baseUrl: string, href: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith('data:') || href.startsWith('blob:')) {
    return href;
  }
  return `${baseUrl.replace(/\/$/, '')}/${href.replace(/^\.\//, '')}`;
}

/**
 * Convert the first legacy material definition into the PBR shape used by the renderer.
 * @param sharedResources - legacy shared-resource bundle
 * @returns normalized material definition
 */
export function getLegacyMaterialDefinition(
  sharedResources?: SharedResources
): I3SMaterialDefinition | undefined {
  const materialDefinitions = sharedResources?.materialDefinitions;
  const materialDefinition = materialDefinitions
    ? materialDefinitions[Object.keys(materialDefinitions)[0]]
    : undefined;
  if (!materialDefinition) {
    return undefined;
  }

  const params = materialDefinition.params;
  const diffuse = params.diffuse || [];
  const color: [number, number, number] = [
    normalizeLegacyColorComponent(diffuse[0]),
    normalizeLegacyColorComponent(diffuse[1]),
    normalizeLegacyColorComponent(diffuse[2])
  ];
  const transparency = Math.max(0, Math.min(1, params.transparency || 0));
  const textureDefinitions = sharedResources?.textureDefinitions;
  const textureDefinitionId = textureDefinitions ? Object.keys(textureDefinitions)[0] : undefined;
  const textureDefinition = textureDefinitionId
    ? textureDefinitions?.[textureDefinitionId]
    : undefined;
  const wrap = textureDefinition?.wrap || [];

  return {
    pbrMetallicRoughness: {
      baseColorFactor: [color[0], color[1], color[2], (1 - transparency) * 255],
      metallicFactor: 0,
      roughnessFactor: params.shininess === undefined ? 1 : 1 - Math.min(1, params.shininess / 128),
      ...(textureDefinitionId !== undefined
        ? {
            baseColorTexture: {
              textureSetDefinitionId: Number(textureDefinitionId) || 0,
              ...(normalizeLegacyWrap(wrap[0]) ? {wrapS: normalizeLegacyWrap(wrap[0])} : {}),
              ...(normalizeLegacyWrap(wrap[1]) ? {wrapT: normalizeLegacyWrap(wrap[1])} : {})
            }
          }
        : {})
    },
    alphaMode: transparency > 0 ? 'blend' : 'opaque',
    doubleSided: params.cullFace === 'none',
    cullFace: params.cullFace as I3SMaterialDefinition['cullFace'] | undefined
  };
}

/**
 * Normalize a legacy texture wrap value while preserving unknown values as unset.
 * @param value - legacy wrap value
 * @returns supported wrap mode
 */
function normalizeLegacyWrap(value: string | undefined): 'none' | 'repeat' | 'mirror' | undefined {
  return value === 'none' || value === 'repeat' || value === 'mirror' ? value : undefined;
}

/**
 * Normalize a legacy diffuse-color component to the byte range used by the PBR material path.
 * @param value - legacy color component
 * @returns color component in the range 0..255
 */
function normalizeLegacyColorComponent(value: number | undefined): number {
  if (value === undefined) {
    return 255;
  }
  return value <= 1 ? value * 255 : value;
}

/**
 * Select the first texture encoding advertised by a legacy shared-resource bundle.
 * @param sharedResources - legacy shared-resource bundle
 * @returns loaders.gl texture format
 */
function getLegacyTextureFormat(sharedResources?: SharedResources): I3STextureFormat | undefined {
  const encoding = Object.values(sharedResources?.textureDefinitions || {})[0]?.encoding?.[0];
  switch (encoding) {
    case 'image/png':
      return 'png';
    case 'image/vnd-ms.dds':
      return 'dds';
    case 'image/ktx2':
      return 'ktx2';
    case 'image/ktx':
      return 'ktx-etc2';
    case 'image/jpeg':
      return 'jpg';
    default:
      return undefined;
  }
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
  const url = getUrlWithoutParams(context.url || '');
  let nodePagesTile: I3SNodePagesTiles | undefined;
  let root: I3STileHeader | I3STilesetHeader;
  if (tileset.nodePages) {
    nodePagesTile = new I3SNodePagesTiles(tileset, url, options);
    root = await nodePagesTile.formTileFromNodePages(0);
  } else {
    const parseOptions =
      (options.i3s && typeof options.i3s === 'object' ? options.i3s : {}) as I3SParseOptions;
    const rootNodeUrl = getUrlWithToken(`${url}/nodes/root`, parseOptions.token);
    // eslint-disable-next-line no-use-before-define
    root = (await load(rootNodeUrl, I3SLoaderWithParser, {
      ...options,
      i3s: {
        ...parseOptions,
        loadContent: false,
        isTileHeader: true,
        isTileset: false
      }
    })) as I3STileHeader | I3STilesetHeader;
  }

  return {
    ...tileset,
    loader: I3SLoaderWithParser,
    url,
    basePath: url,
    type: TILESET_TYPE.I3S,
    spatialMetadata: getI3SSpatialReference(tileset),
    nodePagesTile,
    // @ts-expect-error
    root,
    lodMetricType: root.lodMetricType,
    lodMetricValue: root.lodMetricValue
  }
}
