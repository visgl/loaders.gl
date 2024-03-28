// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

import type {Availability, Tile3DBoundingVolume, Subtree} from '../../../types';
import {Tile3DSubtreeLoader} from '../../../tile-3d-subtree-loader';
import {load} from '@loaders.gl/core';
import {default as log} from '@probe.gl/log';

import {getS2CellIdFromToken, getS2ChildCellId, getS2TokenFromCellId} from '../../utils/s2/index';
import type {S2VolumeInfo} from '../../utils/obb/s2-corners-to-obb';
import {convertS2BoundingVolumetoOBB} from '../../utils/obb/s2-corners-to-obb';
import Long from 'long';
import {Tiles3DLoaderOptions} from '../../../tiles-3d-loader';
import {ImplicitOptions} from '../parse-3d-tile-header';

const QUADTREE_DIVISION_COUNT = 4;
const OCTREE_DIVISION_COUNT = 8;

const SUBDIVISION_COUNT_MAP = {
  QUADTREE: QUADTREE_DIVISION_COUNT,
  OCTREE: OCTREE_DIVISION_COUNT
};

/**
 *  S2VolumeBox is an extention of BoundingVolume of type "box"
 */
export type S2VolumeBox = {
  /** BoundingVolume of type "box" has the "box" field. S2VolumeBox contains it as well. */
  box: number[];
  /** s2VolumeInfo provides additional info about the box - specifically the token, min and max height */
  s2VolumeInfo: S2VolumeInfo;
};

function getChildS2VolumeBox(
  s2VolumeBox: S2VolumeBox | undefined,
  index: number,
  subdivisionScheme: string
): S2VolumeBox | undefined {
  if (s2VolumeBox?.box) {
    // Check if the BoundingVolume is of type "box"
    const cellId: Long = getS2CellIdFromToken(s2VolumeBox.s2VolumeInfo.token);
    const childCellId = getS2ChildCellId(cellId, index);
    const childToken = getS2TokenFromCellId(childCellId);

    // Clone object. Note, s2VolumeInfo is a plain object that doesn't contain any nested object.
    // So, we can use the Spread Operator to make a shallow copy of the object.
    const s2ChildVolumeInfo: S2VolumeInfo = {...s2VolumeBox.s2VolumeInfo};
    s2ChildVolumeInfo.token = childToken; // replace the token with the child's one

    // In case of QUADTREE the sizeZ should NOT be changed!
    // https://portal.ogc.org/files/102132
    // A quadtree divides space only on the x and y dimensions.
    // It divides each tile into 4 smaller tiles where the x and y dimensions are halved.
    // The quadtree z minimum and maximum remain unchanged.
    switch (subdivisionScheme) {
      case 'OCTREE':
        const s2VolumeInfo: S2VolumeInfo = s2VolumeBox.s2VolumeInfo;
        const delta = s2VolumeInfo.maximumHeight - s2VolumeInfo.minimumHeight;
        const sizeZ: number = delta / 2.0; // It's a next level (a child)
        const midZ: number = s2VolumeInfo.minimumHeight + delta / 2.0;
        s2VolumeInfo.minimumHeight = midZ - sizeZ;
        s2VolumeInfo.maximumHeight = midZ + sizeZ;
        break;
      default:
        break;
    }
    const box = convertS2BoundingVolumetoOBB(s2ChildVolumeInfo);
    const childS2VolumeBox: S2VolumeBox = {
      box,
      s2VolumeInfo: s2ChildVolumeInfo
    };
    return childS2VolumeBox;
  }
  return undefined;
}

/**
 * Recursively parse implicit tiles tree
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling
 * TODO Check out do we able to use Tile3D class as return type here.
 * @param subtree
 * @param lodMetricValue
 * @param options
 * @param parentData
 * @param childIndex
 * @param level
 * @param globalData
 */
// eslint-disable-next-line max-statements
export async function parseImplicitTiles(params: {
  subtree: Subtree;
  implicitOptions: ImplicitOptions;
  parentData?: {mortonIndex: number; x: number; y: number; z: number};
  childIndex?: number;
  level?: number;
  globalData?: {level: number; mortonIndex: number; x: number; y: number; z: number};
  s2VolumeBox?: S2VolumeBox;
  loaderOptions: Tiles3DLoaderOptions;
}) {
  const {
    implicitOptions,
    parentData = {
      mortonIndex: 0,
      x: 0,
      y: 0,
      z: 0
    },
    childIndex = 0,
    s2VolumeBox,
    loaderOptions
  } = params;
  let {
    subtree,
    level = 0,
    globalData = {
      level: 0,
      mortonIndex: 0,
      x: 0,
      y: 0,
      z: 0
    }
  } = params;
  const {
    subdivisionScheme,
    subtreeLevels,
    maximumLevel,
    contentUrlTemplate,
    subtreesUriTemplate,
    basePath
  } = implicitOptions;
  const tile = {children: [], lodMetricValue: 0, contentUrl: ''};

  if (!maximumLevel) {
    // eslint-disable-next-line no-console
    log.once(
      `Missing 'maximumLevel' or 'availableLevels' property. The subtree ${contentUrlTemplate} won't be loaded...`
    );
    return tile;
  }

  const lev = level + globalData.level;
  if (lev > maximumLevel) {
    return tile;
  }

  const childrenPerTile = SUBDIVISION_COUNT_MAP[subdivisionScheme];
  const bitsPerTile = Math.log2(childrenPerTile);

  // childIndex is in range [0,4] for quadtrees and [0, 7] for octrees
  const childX = childIndex & 0b01; // Get first bit for X
  const childY = (childIndex >> 1) & 0b01; // Get second bit for Y
  const childZ = (childIndex >> 2) & 0b01; // Get third bit for Z

  const levelOffset = (childrenPerTile ** level - 1) / (childrenPerTile - 1);
  let childTileMortonIndex = concatBits(parentData.mortonIndex, childIndex, bitsPerTile);
  let tileAvailabilityIndex = levelOffset + childTileMortonIndex;

  // Local tile coordinates
  let childTileX = concatBits(parentData.x, childX, 1);
  let childTileY = concatBits(parentData.y, childY, 1);
  let childTileZ = concatBits(parentData.z, childZ, 1);

  let isChildSubtreeAvailable = false;

  if (level >= subtreeLevels) {
    isChildSubtreeAvailable = getAvailabilityResult(
      subtree.childSubtreeAvailability,
      childTileMortonIndex
    );
  }

  const x = concatBits(globalData.x, childTileX, level);
  const y = concatBits(globalData.y, childTileY, level);
  const z = concatBits(globalData.z, childTileZ, level);

  if (isChildSubtreeAvailable) {
    const subtreePath = `${basePath}/${subtreesUriTemplate}`;
    const childSubtreeUrl = replaceContentUrlTemplate(subtreePath, lev, x, y, z);
    const childSubtree = await load(childSubtreeUrl, Tile3DSubtreeLoader, loaderOptions);

    subtree = childSubtree;

    globalData = {
      mortonIndex: childTileMortonIndex,
      x: childTileX,
      y: childTileY,
      z: childTileZ,
      level
    };

    childTileMortonIndex = 0;
    tileAvailabilityIndex = 0;
    childTileX = 0;
    childTileY = 0;
    childTileZ = 0;
    level = 0;
  }

  const isTileAvailable = getAvailabilityResult(subtree.tileAvailability, tileAvailabilityIndex);

  if (!isTileAvailable) {
    return tile;
  }

  const isContentAvailable = getAvailabilityResult(
    subtree.contentAvailability,
    tileAvailabilityIndex
  );

  if (isContentAvailable) {
    tile.contentUrl = replaceContentUrlTemplate(contentUrlTemplate, lev, x, y, z);
  }

  const childTileLevel = level + 1;
  const pData = {mortonIndex: childTileMortonIndex, x: childTileX, y: childTileY, z: childTileZ};

  for (let index = 0; index < childrenPerTile; index++) {
    const childS2VolumeBox: S2VolumeBox | undefined = getChildS2VolumeBox(
      s2VolumeBox,
      index,
      subdivisionScheme
    );

    // Recursive calling...
    const childTileParsed = await parseImplicitTiles({
      subtree,
      implicitOptions,
      loaderOptions,
      parentData: pData,
      childIndex: index,
      level: childTileLevel,
      globalData: {...globalData},
      s2VolumeBox: childS2VolumeBox
    });

    if (childTileParsed.contentUrl || childTileParsed.children.length) {
      const globalLevel = lev + 1;
      const childCoordinates = {childTileX, childTileY, childTileZ};
      const formattedTile = formatTileData(
        childTileParsed,
        globalLevel,
        childCoordinates,
        implicitOptions,
        s2VolumeBox
      );
      // @ts-ignore
      tile.children.push(formattedTile);
    }
  }

  return tile;
}

/**
 * Check tile availability in the bitstream array
 * @param availabilityData - tileAvailability / contentAvailability / childSubtreeAvailability object
 * @param index - index in the bitstream array
 * @returns
 */
function getAvailabilityResult(
  availabilityData: Availability | Availability[],
  index: number
): boolean {
  let availabilityObject: Availability;
  if (Array.isArray(availabilityData)) {
    /** TODO: we don't support `3DTILES_multiple_contents` extension at the moment.
     * https://github.com/CesiumGS/3d-tiles/blob/main/extensions/3DTILES_implicit_tiling/README.md#multiple-contents
     * Take first item in the array
     */
    availabilityObject = availabilityData[0];
    if (availabilityData.length > 1) {
      // eslint-disable-next-line no-console
      log.once('Not supported extension "3DTILES_multiple_contents" has been detected');
    }
  } else {
    availabilityObject = availabilityData;
  }

  if ('constant' in availabilityObject) {
    return Boolean(availabilityObject.constant);
  }

  if (availabilityObject.explicitBitstream) {
    return getBooleanValueFromBitstream(index, availabilityObject.explicitBitstream);
  }

  return false;
}

/**
 * Do formatting of implicit tile data.
 * TODO Check out do we able to use Tile3D class as type here.
 * @param tile
 * @param lodMetricValue
 * @param options
 * @returns
 */
function formatTileData(
  tile,
  level: number,
  childCoordinates: {childTileX: number; childTileY: number; childTileZ: number},
  options: ImplicitOptions,
  s2VolumeBox?: S2VolumeBox
) {
  const {
    basePath,
    refine,
    getRefine,
    lodMetricType,
    getTileType,
    rootLodMetricValue,
    rootBoundingVolume
  } = options;
  const uri = tile.contentUrl && tile.contentUrl.replace(`${basePath}/`, '');
  const lodMetricValue = rootLodMetricValue / 2 ** level;

  const boundingVolume: Tile3DBoundingVolume = s2VolumeBox?.box
    ? {box: s2VolumeBox.box}
    : rootBoundingVolume;

  const boundingVolumeForChildTile = calculateBoundingVolumeForChildTile(
    level,
    boundingVolume,
    childCoordinates
  );

  return {
    children: tile.children,
    contentUrl: tile.contentUrl,
    content: {uri},
    id: tile.contentUrl,
    refine: getRefine(refine),
    type: getTileType(tile),
    lodMetricType,
    lodMetricValue,
    geometricError: lodMetricValue,
    transform: tile.transform,
    boundingVolume: boundingVolumeForChildTile
  };
}

/**
 * Calculate child bounding volume.
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/main/extensions/3DTILES_implicit_tiling#subdivision-rules
 * @param level
 * @param rootBoundingVolume
 * @param childCoordinates
 */
function calculateBoundingVolumeForChildTile(
  level: number,
  rootBoundingVolume: Tile3DBoundingVolume,
  childCoordinates: {childTileX: number; childTileY: number; childTileZ: number}
): Tile3DBoundingVolume {
  if (rootBoundingVolume.region) {
    const {childTileX, childTileY, childTileZ} = childCoordinates;
    const [west, south, east, north, minimumHeight, maximumHeight] = rootBoundingVolume.region;
    const boundingVolumesCount = 2 ** level;

    const sizeX = (east - west) / boundingVolumesCount;
    const sizeY = (north - south) / boundingVolumesCount;

    // TODO : Why is the subdivisionScheme not being checked here?

    // In case of QUADTREE the sizeZ should NOT be changed!
    // https://portal.ogc.org/files/102132
    // A quadtree divides space only on the x and y dimensions. It divides each tile into 4 smaller tiles where the x and y dimensions are halved. The quadtree z minimum and maximum remain unchanged.

    const sizeZ = (maximumHeight - minimumHeight) / boundingVolumesCount;

    const [childWest, childEast] = [west + sizeX * childTileX, west + sizeX * (childTileX + 1)];
    const [childSouth, childNorth] = [south + sizeY * childTileY, south + sizeY * (childTileY + 1)];
    const [childMinimumHeight, childMaximumHeight] = [
      minimumHeight + sizeZ * childTileZ,
      minimumHeight + sizeZ * (childTileZ + 1)
    ];

    return {
      region: [childWest, childSouth, childEast, childNorth, childMinimumHeight, childMaximumHeight]
    };
  }

  if (rootBoundingVolume.box) {
    return rootBoundingVolume;
  }

  throw new Error(`Unsupported bounding volume type ${JSON.stringify(rootBoundingVolume)}`);
}

/**
 * Do binary concatenation
 * @param higher - number to put to higher part of result
 * @param lower - number to put to lower part of result
 * @param shift - number of bits to shift lower number
 */
function concatBits(higher: number, lower: number, shift: number): number {
  return (higher << shift) + lower;
}

/**
 * Replace implicit tile content url with real coordinates.
 * @param templateUrl
 * @param level
 * @param x
 * @param y
 * @param z
 */
export function replaceContentUrlTemplate(
  templateUrl: string,
  level: number,
  x: number,
  y: number,
  z: number
): string {
  const mapUrl = generateMapUrl({level, x, y, z});
  return templateUrl.replace(/{level}|{x}|{y}|{z}/gi, (matched) => mapUrl[matched]);
}

/**
 * Get Map object for content url generation
 * @param items
 */
function generateMapUrl(items: {[key: string]: number}): {[key: string]: string} {
  const mapUrl = {};

  for (const key in items) {
    mapUrl[`{${key}}`] = items[key];
  }
  return mapUrl;
}

/**
 * Get boolean value from bistream by index
 * A boolean value is encoded as a single bit, either 0 (false) or 1 (true).
 * Multiple boolean values are packed tightly in the same buffer.
 * These buffers of tightly-packed bits are sometimes referred to as bitstreams.
 * Spec - https://github.com/CesiumGS/3d-tiles/tree/implicit-revisions/specification/Metadata#booleans
 * @param availabilitiIndex
 */
function getBooleanValueFromBitstream(
  availabilityIndex: number,
  availabilityBuffer: Uint8Array
): boolean {
  const byteIndex = Math.floor(availabilityIndex / 8);
  const bitIndex = availabilityIndex % 8;
  const bitValue = (availabilityBuffer[byteIndex] >> bitIndex) & 1;

  return bitValue === 1;
}
