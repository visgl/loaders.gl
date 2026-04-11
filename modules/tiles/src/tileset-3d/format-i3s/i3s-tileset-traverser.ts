import {TilesetTraverser} from '../common/tileset-traverser';

import {getLodStatus} from '../helpers/i3s-lod';
import {Tile3D} from '../common/tile-3d';
import {I3STileManager} from './i3s-tile-manager';
import {FrameState} from '../helpers/frame-state';

export class I3STilesetTraverser extends TilesetTraverser {
  private _tileManager: I3STileManager;

  constructor(options) {
    super(options);
    this._tileManager = new I3STileManager();
  }

  /**
   * Check if there are no penging tile header requests,
   * that means the traversal is finished and we can call
   * following-up callbacks.
   */
  traversalFinished(frameState: FrameState): boolean {
    return !this._tileManager.hasPendingTiles(frameState.viewport.id, this._frameNumber || 0);
  }

  shouldRefine(tile, frameState: FrameState) {
    tile._lodJudge = getLodStatus(tile, frameState);
    return tile._lodJudge === 'DIG';
  }

  updateChildTiles(tile, frameState: FrameState): boolean {
    const children = tile.header.children || [];
    // children which are already fetched and constructed as Tile3D instances
    const childTiles = tile.children;
    for (const child of children) {
      const extendedId = `${child.id}-${frameState.viewport.id}`;
      // if child tile is not fetched
      const childTile = childTiles && childTiles.find(t => t.id === extendedId);
      if (!childTile) {
        const request = () => this._loadTile(tile, child.id, frameState);
        const cachedRequest = this._tileManager.find(extendedId);
        if (!cachedRequest) {
          this._tileManager.add(
            request,
            extendedId,
            header => this._onTileLoad(header, tile, extendedId),
            frameState
          );
        } else {
          // update frameNumber since it is still needed in current frame
          this._tileManager.update(extendedId, frameState);
        }
      } else if (childTile) {
        // if child tile is fetched and available
        this.updateTile(childTile, frameState);
      }
    }
    return false;
  }

  async _loadTile(tile, nodeId, frameState) {
    if (!tile.tileset.source.loadChildTileHeader) {
      throw new Error('I3S source does not support child tile header loading');
    }

    return await tile.tileset.source.loadChildTileHeader(tile, nodeId, frameState);
  }

  /**
   * The callback to init Tile3D instance after loading the tile JSON
   * @param {Object} header - the tile JSON from a dataset
   * @param {Tile3D} tile - the parent Tile3D instance
   * @param {string} extendedId - optional ID to separate copies of a tile for different viewports.
   *                              const extendedId = `${tile.id}-${frameState.viewport.id}`;
   * @return {void}
   */
  _onTileLoad(header, tile, extendedId) {
    if (header instanceof Error) {
      tile.tileset._onSourceError(header, tile);
      return;
    }

    // after child tile is fetched
    const childTile = new Tile3D(tile.tileset, header, tile, extendedId);
    tile.children.push(childTile);
    const frameState = this._tileManager.find(childTile.id).frameState;
    this.updateTile(childTile, frameState);

    // after tile fetched, resume traversal if still in current update/traversal frame
    if (
      this._frameNumber === frameState.frameNumber &&
      (this.traversalFinished(frameState) ||
        new Date().getTime() - this.lastUpdate > this.updateDebounceTime)
    ) {
      this.executeTraversal(childTile, frameState);
    }
  }
}
