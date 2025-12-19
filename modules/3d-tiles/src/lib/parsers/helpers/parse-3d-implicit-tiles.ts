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
 *
 * @param subtree - the current subtree. Subtrees contain availability data for <implicitOptions.subtreeLevels>.
 *     Once we go deeper than that many levels, we will need load a child subtree to get further availability data.
 * @param subtreeData - the coordinates of the current subtree, relative to the root of this implicit tiles tree.
 * @param parentData - the coordinates of the parent tile, relative to the current subtree.
 *     The overall coordinates of the current tile can be found by combining the coordinates of the current subtree, the parent tile,
 *     and tje single-bit coordinates that can be calculated from the childIndex.
 * @param childIndex - which child the current tile is of its parent. In the range 0-7 for OCTREE, 0-3 for QUADTREE.
 * @param implicitOptions - options specified at the root of this implicit tile tree - numbers of levels, URL templates.
 * @param loaderOptions - see Tiles3DLoaderOptions.
 */
// eslint-disable-next-line max-statements, complexity
export async function parseImplicitTiles(params: {
  subtree: Subtree;
  subtreeData?: {level: number; x: number; y: number; z: number};
  parentData?: {
    mortonIndex: number;
    localLevel: number;
    localX: number;
    localY: number;
    localZ: number;
  };
  childIndex?: number;
  implicitOptions: ImplicitOptions;
  loaderOptions: Tiles3DLoaderOptions;
  s2VolumeBox?: S2VolumeBox;
}) {
  const {
    subtree,
    subtreeData = {
      level: 0,
      x: 0,
      y: 0,
      z: 0
    },
    parentData = {
      mortonIndex: 0,
      localLevel: -1,
      localX: 0,
      localY: 0,
      localZ: 0
    },
    childIndex = 0,
    implicitOptions,
    loaderOptions,
    s2VolumeBox
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
    log.once(
      `Missing 'maximumLevel' or 'availableLevels' property. The subtree ${contentUrlTemplate} won't be loaded...`
    );
    return tile;
  }

  // Local tile level - relative to the current subtree.
  const localLevel = parentData.localLevel + 1;
  // Global tile level - relative to the root tile of this implicit subdivision scheme.
  const level = subtreeData.level + localLevel;

  if (level > maximumLevel) {
    return tile;
  }

  const childrenPerTile = SUBDIVISION_COUNT_MAP[subdivisionScheme];
  const bitsPerTile = Math.log2(childrenPerTile);

  // childIndex is in range 0...3 for quadtrees and 0...7 for octrees
  const lastBitX = childIndex & 0b01; // Get first bit for X
  const lastBitY = (childIndex >> 1) & 0b01; // Get second bit for Y
  const lastBitZ = (childIndex >> 2) & 0b01; // Get third bit for Z

  // Local tile coordinates - relative to the current subtree root.
  const localX = concatBits(parentData.localX, lastBitX, 1);
  const localY = concatBits(parentData.localY, lastBitY, 1);
  const localZ = concatBits(parentData.localZ, lastBitZ, 1);

  // Global tile coordinates - relative to the implicit-tile-tree root.
  // Found by combining the local coordinates which are relative to the current subtree, with the subtree coordinates.
  const x = concatBits(subtreeData.x, localX, localLevel);
  const y = concatBits(subtreeData.y, localY, localLevel);
  const z = concatBits(subtreeData.z, localZ, localLevel);

  const mortonIndex = concatBits(parentData.mortonIndex, childIndex, bitsPerTile);

  const isChildSubtreeAvailable =
    localLevel === subtreeLevels &&
    getAvailabilityResult(subtree.childSubtreeAvailability, mortonIndex);

  // Context to provide the next recursive call.
  // This context is set up differently depending on whether its time to start a new subtree or not.
  let nextSubtree;
  let nextSubtreeData;
  let nextParentData;
  let tileAvailabilityIndex;

  if (isChildSubtreeAvailable) {
    const subtreePath = `${basePath}/${subtreesUriTemplate}`;
    const childSubtreeUrl = replaceContentUrlTemplate(subtreePath, level, x, y, z);
    const childSubtree = await load(childSubtreeUrl, Tile3DSubtreeLoader, loaderOptions);

    // The next subtree is the newly-loaded child subtree.
    nextSubtree = childSubtree;
    // The current tile is actually the root tile in the next subtree, so it has a tileAvailabilityIndex of 0.
    tileAvailabilityIndex = 0;
    // The next subtree starts HERE - at the current tile.
    nextSubtreeData = {level, x, y, z};
    // The next parent is also the current tile - so it has local coordinates of 0 relative to the next subtree.
    nextParentData = {mortonIndex: 0, localLevel: 0, localX: 0, localY: 0, localZ: 0};
  } else {
    // Continue on with the same subtree as we're using currently.
    nextSubtree = subtree;
    // Calculate a tileAvailabilityIndex for the current tile within the current subtree.
    const levelOffset = (childrenPerTile ** localLevel - 1) / (childrenPerTile - 1);
    tileAvailabilityIndex = levelOffset + mortonIndex;
    // The next subtree is the same as the current subtree.
    nextSubtreeData = subtreeData;
    // The next parent is the current tile: it has the local coordinates we already calculated.
    nextParentData = {mortonIndex, localLevel, localX, localY, localZ};
  }

  const isTileAvailable = getAvailabilityResult(
    nextSubtree.tileAvailability,
    tileAvailabilityIndex
  );
  if (!isTileAvailable) {
    return tile;
  }

  const isContentAvailable = getAvailabilityResult(
    nextSubtree.contentAvailability,
    tileAvailabilityIndex
  );
  if (isContentAvailable) {
    tile.contentUrl = replaceContentUrlTemplate(contentUrlTemplate, level, x, y, z);
  }

  for (let index = 0; index < childrenPerTile; index++) {
    const childS2VolumeBox: S2VolumeBox | undefined = getChildS2VolumeBox(
      s2VolumeBox,
      index,
      subdivisionScheme
    );

    // Recursive calling...
    const childTile = await parseImplicitTiles({
      subtree: nextSubtree,
      subtreeData: nextSubtreeData,
      parentData: nextParentData,
      childIndex: index,
      implicitOptions,
      loaderOptions,
      s2VolumeBox: childS2VolumeBox
    });

    if (childTile.contentUrl || childTile.children.length) {
      // @ts-ignore
      tile.children.push(childTile);
    }
  }

  if (tile.contentUrl || tile.children.length) {
    const coordinates = {level, x, y, z};
    const formattedTile = formatTileData(tile, coordinates, implicitOptions, s2VolumeBox);
    return formattedTile;
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
 *
 * @param tile - tile data to format.
 * @param coordinates - global tile coordinates (relative to the root of the implicit tile tree).
 * @param options - options specified at the root of this implicit tile tree - numbers of levels, URL templates.
 * @param s2VolumeBox - the S2VolumeBox for this particular child, if available.
 * @returns
 */
function formatTileData(
  tile,
  coordinates: {level: number; x: number; y: number; z: number},
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
  const lodMetricValue = rootLodMetricValue / 2 ** coordinates.level;

  const boundingVolume: Tile3DBoundingVolume = s2VolumeBox?.box
    ? {box: s2VolumeBox.box}
    : rootBoundingVolume;

  const boundingVolumeForChildTile = calculateBoundingVolumeForChildTile(
    boundingVolume,
    coordinates,
    options.subdivisionScheme
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
 * @param rootBoundingVolume
 * @param coordinates
 * @param subdivisionScheme
 */
function calculateBoundingVolumeForChildTile(
  rootBoundingVolume: Tile3DBoundingVolume,
  coordinates: {level: number; x: number; y: number; z: number},
  subdivisionScheme: string
): Tile3DBoundingVolume {
  if (rootBoundingVolume.region) {
    const {level, x, y, z} = coordinates;
    const [west, south, east, north, minimumHeight, maximumHeight] = rootBoundingVolume.region;
    const boundingVolumesCount = 2 ** level;

    const sizeX = (east - west) / boundingVolumesCount;
    const [childWest, childEast] = [west + sizeX * x, west + sizeX * (x + 1)];

    const sizeY = (north - south) / boundingVolumesCount;
    const [childSouth, childNorth] = [south + sizeY * y, south + sizeY * (y + 1)];

    // In case of QUADTREE the sizeZ should NOT be changed!
    // https://portal.ogc.org/files/102132
    // A quadtree divides space only on the x and y dimensions.
    // It divides each tile into 4 smaller tiles where the x and y dimensions are halved.
    // The quadtree z minimum and maximum remain unchanged.

    let childMinimumHeight: number;
    let childMaximumHeight: number;
    if (subdivisionScheme === 'OCTREE') {
      const sizeZ = (maximumHeight - minimumHeight) / boundingVolumesCount;
      [childMinimumHeight, childMaximumHeight] = [
        minimumHeight + sizeZ * z,
        minimumHeight + sizeZ * (z + 1)
      ];
    } else {
      [childMinimumHeight, childMaximumHeight] = [minimumHeight, maximumHeight];
    }

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
