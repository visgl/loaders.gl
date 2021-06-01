// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md
// import {Vector3, Matrix4} from '@math.gl/core';
// import {CullingVolume} from '@math.gl/culling';
// import {TILE_REFINEMENT, TILE_CONTENT_STATE, TILESET_TYPE} from '../constants';


/**
 * @param tileset - Tileset3D instance
 * @param header - tile header - JSON loaded from a dataset
 * @param parentHeader - parent TileHeader instance
 * @param basePath - base path / url of the tile
 * @param extendedId - optional ID to separate copies of a tile for different viewports.
 *                              const extendedId = `${tile.id}-${frameState.viewport.id}`;
 */
export type TileHeaderProps = {
  tileset: Tileset3D;
  header: Object;
  parentHeader: TileHeader;
  basePath: string;
  extendedId: string;
}

/**
 * A Tile3DHeader represents a tile as Tileset3D. When a tile is first created, its content is not loaded;
 * the content is loaded on-demand when needed based on the view.
 * Do not construct this directly, instead access tiles through {@link Tileset3D#tileVisible}.
 */
export default class TileHeader {
  /**
   * @constructs
   * Create a TileHeader instance
   * @param {Tileset3D} tileset - Tileset3D instance
   * @param {Object} header - tile header - JSON loaded from a dataset
   * @param {TileHeader} parentHeader - parent TileHeader instance
   * @param {string} basePath - base path / url of the tile
   * @param {string} extendedId - optional ID to separate copies of a tile for different viewports.
   *                              const extendedId = `${tile.id}-${frameState.viewport.id}`;
   */
  constructor(tileset, header, parentHeader, basePath, extendedId);

  destroy(): void;

  isDestroyed(): boolean;

  get selected(): boolean;

  get isVisible(): boolean;

  get isVisibleAndInRequestVolume(): boolean;

  /** Returns true if tile is not an empty tile and not an external tileset */
  get hasRenderContent(): true;

  get hasChildren(): boolean;

  /**
   * Determines if the tile's content is ready. This is automatically `true` for
   * tile's with empty content.
   */
  get contentReady(): boolean;

  /**
   * Determines if the tile has available content to render.  `true` if the tile's
   * content is ready or if it has expired content this renders while new content loads; otherwise,
   */
  get contentAvailable(): boolean;

  /** Returns true if tile has renderable content but it's unloaded */
  get hasUnloadedContent(): boolean;

  /**
   * Determines if the tile's content has not be requested. `true` if tile's
   * content has not be requested; otherwise, `false`.
   */ 
  get contentUnloaded(): boolean;

  /**
   * Determines if the tile's content is expired. `true` if tile's
   * content is expired; otherwise, `false`.
   */
  get contentExpired(): boolean;

  /**
   * Determines if the tile's content failed to load.  `true` if the tile's
   * content failed to load; otherwise, `false`.
   */
  get contentFailed(): boolean;

  /** Get the tile's screen space error. */
  getScreenSpaceError(frameState, useParentLodMetric): number;

  /**
   *  Requests the tile's content.
   * The request may not be made if the Request Scheduler can't prioritize it.
   */
  async loadContent(): boolean; 

  /** Unloads the tile's content. */
  unloadContent(): boolean;

  /**
   * Update the tile's visibility
   * @param {Object} frameState - frame state for tile culling
   * @param {string[]} viewportIds - a list of viewport ids that show this tile
   * @return {void}
   */
  updateVisibility(frameState, viewportIds): void;

  /**
   * Determines whether the tile's bounding volume intersects the culling volume.
   * @param frameState 
   * @param parentVisibilityPlaneMask 
   * @returns 
   */
  visibility(frameState, parentVisibilityPlaneMask): boolean;

  /**
   * Assuming the tile's bounding volume intersects the culling volume, determines
   * whether the tile's content's bounding volume intersects the culling volume.
   * @param frameState The frame state.
   * @returns {Intersect} The result of the intersection: the tile's content is completely outside, completely inside, or intersecting the culling volume.
   */
  contentVisibility(frameState: FrameState);

  /**
   * Computes the (potentially approximate) distance from the closest point of the tile's bounding volume to the camera.
   * @param {FrameState} frameState The frame state.
   * @returns {Number} The distance, in meters, or zero if the camera is inside the bounding volume.
   */
  distanceToTile(frameState: FrameState): number;

  /**
   * Computes the tile's camera-space z-depth.
   * @param frameState The frame state.
   * @returns The distance, in meters.
   */
  cameraSpaceZDepth({camera}): number;

  /**
   * Checks if the camera is inside the viewer request volume.
   * @param frameState The frame state.
   * @returns  Whether the camera is inside the volume.
   */
  insideViewerRequestVolume(frameState: FrameState): boolean;


  // TODO Cesium specific
  // Update whether the tile has expired.
  updateExpiration(): void;

  get extras();
}
