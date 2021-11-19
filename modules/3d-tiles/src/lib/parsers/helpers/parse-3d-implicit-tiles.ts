import type {Availability, Subtree} from '../../../types';
import {Tile3DSubtreeLoader} from '../../../tile-3d-subtree-loader';
import {load} from '@loaders.gl/core';

const QUADTREE_DEVISION_COUNT = 4;
const OCTREE_DEVISION_COUNT = 8;

const SUBDIVISION_COUNT_MAP = {
  QUADTREE: QUADTREE_DEVISION_COUNT,
  OCTREE: OCTREE_DEVISION_COUNT
};

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
// eslint-disable-next-line max-params
// eslint-disable-next-line max-statements
export async function parseImplicitTiles(
  subtree: Subtree,
  options: any,
  parentData: {mortonIndex: number; x: number; y: number; z: number} = {
    mortonIndex: 0,
    x: 0,
    y: 0,
    z: 0
  },
  childIndex: number = 0,
  level: number = 0,
  globalData: {level: number; mortonIndex: number; x: number; y: number; z: number} = {
    level: 0,
    mortonIndex: 0,
    x: 0,
    y: 0,
    z: 0
  }
) {
  const {
    subdivisionScheme,
    subtreeLevels,
    maximumLevel,
    contentUrlTemplate,
    subtreesUriTemplate,
    basePath
  } = options;

  const tile = {children: [], lodMetricValue: 0, contentUrl: ''};

  const childrenPerTile = SUBDIVISION_COUNT_MAP[subdivisionScheme];

  const childX = childIndex & 0b01;
  const childY = (childIndex >> 1) & 0b01;
  const childZ = (childIndex >> 2) & 0b01;

  const levelOffset = (childrenPerTile ** level - 1) / (childrenPerTile - 1);
  let childTileMortonIndex = concatBits(parentData.mortonIndex, childIndex);
  let tileAvailabilityIndex = levelOffset + childTileMortonIndex;

  // Local tile coordinates
  let childTileX = concatBits(parentData.x, childX);
  let childTileY = concatBits(parentData.y, childY);
  let childTileZ = concatBits(parentData.z, childZ);

  // TODO Remove after real implicit tileset will be tested.
  // Degug data
  // tile.level = level + globalData.level;
  // tile.x = concatBits(globalData.x, childTileX);
  // tile.y = concatBits(globalData.y, childTileY);
  // tile.z = concatBits(globalData.z, childTileZ);
  // tile.mortonIndex = childTileMortonIndex;
  // End of debug data

  let isChildSubtreeAvailable = false;

  if (level + 1 > subtreeLevels) {
    isChildSubtreeAvailable = getAvailabilityResult(
      subtree.childSubtreeAvailability,
      childTileMortonIndex
    );
  }

  const x = concatBits(globalData.x, childTileX);
  const y = concatBits(globalData.y, childTileY);
  const z = concatBits(globalData.z, childTileZ);
  const lev = level + globalData.level;

  if (isChildSubtreeAvailable) {
    const subtreePath = `${basePath}/${subtreesUriTemplate}`;
    const childSubtreeUrl = replaceContentUrlTemplate(subtreePath, lev, x, y, z);
    const childSubtree = await load(childSubtreeUrl, Tile3DSubtreeLoader);

    subtree = childSubtree;

    globalData.mortonIndex = childTileMortonIndex;
    globalData.x = childTileX;
    globalData.y = childTileY;
    globalData.z = childTileZ;
    globalData.level = level;

    childTileMortonIndex = 0;
    tileAvailabilityIndex = 0;
    childTileX = 0;
    childTileY = 0;
    childTileZ = 0;
    level = 0;
  }

  const isTileAvailable = getAvailabilityResult(subtree.tileAvailability, tileAvailabilityIndex);

  if (!isTileAvailable || level > maximumLevel) {
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
    const currentTile = await parseImplicitTiles(
      subtree,
      options,
      pData,
      index,
      childTileLevel,
      globalData
    );

    if (currentTile.contentUrl || currentTile.children.length) {
      const globalLevel = lev + 1;
      const formattedTile = formatTileData(currentTile, globalLevel, options);
      // @ts-ignore
      tile.children.push(formattedTile);
    }
  }

  return tile;
}

function getAvailabilityResult(availabilityData: Availability, index: number): boolean {
  if ('constant' in availabilityData) {
    return Boolean(availabilityData.constant);
  }

  if (availabilityData.explicitBitstream) {
    return getBooleanValueFromBitstream(index, availabilityData.explicitBitstream);
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
function formatTileData(tile, level: number, options: any) {
  const {basePath, refine, getRefine, lodMetricType, getTileType, rootLodMetricValue} = options;
  const uri = tile.contentUrl && tile.contentUrl.replace(`${basePath}/`, '');
  const lodMetricValue = rootLodMetricValue / 2 ** level;
  // TODO handle bounding volume
  return {
    children: tile.children,
    contentUrl: tile.contentUrl,
    content: {uri},
    id: tile.contentUrl,
    refine: getRefine(refine),
    type: getTileType(tile),
    lodMetricType,
    lodMetricValue
    // Temp debug values. Remove when real implicit tileset will be tested.
    // x: tile.x,
    // y: tile.y,
    // z: tile.z,
    // level: tile.level
  };
}

/**
 * Do binary concatenation
 * @param first
 * @param second
 */
function concatBits(first: number, second: number): number {
  return parseInt(first.toString(2) + second.toString(2), 2);
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
