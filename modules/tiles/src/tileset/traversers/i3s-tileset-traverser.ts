import {load} from '@loaders.gl/core';
import TilesetTraverser from './tileset-traverser';

import {lodJudge} from '../helpers/i3s-lod';
import TileHeader from '../tile-3d';
import I3STileManager from './i3s-tile-manager';

export default class I3STilesetTraverser extends TilesetTraverser {
  private _tileManager: I3STileManager;

  constructor(options) {
    super(options);
    this._tileManager = new I3STileManager();
  }

  shouldRefine(tile, frameState) {
    // TODO refactor loaJudge
    tile._lodJudge = lodJudge(tile, frameState);
    return tile._lodJudge === 'DIG';
  }

  updateChildTiles(tile, frameState): boolean {
    const children = tile.header.children || [];
    // children which are already fetched and constructed as Tile3D instances
    const childTiles = tile.children;
    const tileset = tile.tileset;

    for (const child of children) {
      const extendedId = `${child.id}-${frameState.viewport.id}`;
      // if child tile is not fetched
      const childTile = childTiles && childTiles.find((t) => t.id === extendedId);
      if (!childTile) {
        let request = () => this._loadTile(child.id, tileset);
        const cachedRequest = this._tileManager.find(extendedId);
        if (!cachedRequest) {
          // eslint-disable-next-line max-depth
          if (tileset.tileset.nodePages) {
            request = () => tileset.tileset.nodePagesTile.formTileFromNodePages(child.id);
          }
          this._tileManager.add(
            request,
            extendedId,
            (header) => this._onTileLoad(header, tile, extendedId),
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

  async _loadTile(nodeId, tileset) {
    const {loader} = tileset;
    const nodeUrl = tileset.getTileUrl(`${tileset.url}/nodes/${nodeId}`);
    // load metadata
    const options = {
      i3s: {
        ...tileset.fetchOptions,
        isTileHeader: true,
        loadContent: false
      }
    };

    return await load(nodeUrl, loader, options);
  }

  /**
   * The callback to init TileHeader instance after loading the tile JSON
   * @param {Object} header - the tile JSON from a dataset
   * @param {TileHeader} tile - the parent TileHeader instance
   * @param {string} extendedId - optional ID to separate copies of a tile for different viewports.
   *                              const extendedId = `${tile.id}-${frameState.viewport.id}`;
   * @return {void}
   */
  _onTileLoad(header, tile, extendedId) {
    const basePath = this.options.basePath;
    // after child tile is fetched
    const childTile = new TileHeader(tile.tileset, header, tile, basePath, extendedId);
    tile.children.push(childTile);
    const frameState = this._tileManager.find(childTile.id).frameState;
    this.updateTile(childTile, frameState);

    // after tile fetched, resume traversal if still in current update/traversal frame
    if (this._frameNumber === frameState.frameNumber) {
      this.executeTraversal(childTile, frameState);
    }
  }
}
