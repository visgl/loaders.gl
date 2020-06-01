import {load} from '@loaders.gl/core';
import TilesetTraverser from './tileset-traverser';

import {lodJudge} from '../helpers/i3s-lod';
import TileHeader from '../tile-3d';
import I3STileManager from './i3s-tile-manager';

export default class I3STilesetTraverser extends TilesetTraverser {
  constructor(options) {
    super(options);
    this._tileManager = new I3STileManager();
  }

  shouldRefine(tile, frameState) {
    // TODO refactor loaJudge
    tile._lodJudge = lodJudge(tile, frameState);
    return tile._lodJudge === 'DIG';
  }

  // eslint-disable-next-line complexity
  updateChildTiles(tile, frameState) {
    const children = tile.header.children || [];
    // children which are already fetched and constructed as Tile3D instances
    const childTiles = tile.children;
    const tileset = tile.tileset;

    for (const child of children) {
      // if child tile is not fetched
      const childTile = childTiles && childTiles.find(t => t.id === child.id);
      if (!childTile) {
        const request = () => this._loadTile(child.id, tileset);
        const cachedRequest = this._tileManager.find(child.id);
        if (!cachedRequest) {
          this._tileManager.add(
            request,
            child.id,
            header => this._onTileLoad(header, tile),
            frameState
          );
        } else {
          // update frameNumber since it is still needed in current frame
          this._tileManager.update(child.id, frameState);
        }
      } else if (childTile) {
        // if child tile is fetched and available
        this.updateTile(childTile, frameState);
      }
    }
  }

  async _loadTile(nodeId, tileset) {
    const {loader} = tileset;
    const nodeUrl = tileset.getTileUrl(`${tileset.url}/nodes/${nodeId}`);
    // load metadata
    const options = {
      i3s: {
        ...tileset.fetchOptions,
        isHeader: true,
        loadContent: false
      }
    };
    return await load(nodeUrl, loader, options);
  }

  _onTileLoad(header, tile) {
    const basePath = this.options.basePath;
    // after child tile is fetched
    const childTile = new TileHeader(tile.tileset, header, tile, basePath);
    tile.children.push(childTile);
    const frameState = this._tileManager.find(childTile.id).frameState;
    this.updateTile(childTile, frameState);

    // after tile fetched, resume traversal if still in current update/traversal frame
    if (this._frameNumber === frameState.frameNumber) {
      this.executeTraversal(childTile, frameState);
    }
  }
}
