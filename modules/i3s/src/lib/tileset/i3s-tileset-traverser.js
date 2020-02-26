/* global fetch */
import {TilesetTraverser} from '@loaders.gl/tiles';

import {lodJudge} from '../utils/lod';
import I3STileHeader from './i3s-tile-header';
import I3STileManager from './i3s-tile-manager';

export default class I3STilesetTraverser extends TilesetTraverser {
  constructor(options) {
    super(options);
    this._tileManager = new I3STileManager();
  }

  shouldRefine(tile, frameState) {
    // TODO refactor loaJudge
    tile._loadJudge = lodJudge(tile, frameState);
    return tile._loadJudge === 'DIG';
  }

  // eslint-disable-next-line complexity
  updateChildTiles(tile, frameState) {
    const {basePath} = this.options;
    const children = tile._header.children || [];
    const childTiles = tile.children;

    for (const child of children) {
      // if child tile is not requested or fetched
      const childTile = childTiles && childTiles.find(t => t.id === child.id);
      if (!childTile) {
        const request = () => fetchTileNode(basePath, child.id);
        const cachedRequest = this._tileManager.find(child.id);
        if (!cachedRequest) {
          this._tileManager.add(
            request,
            child.id,
            header => this._onTileLoad(header, tile, frameState),
            {frameNumber: frameState.frameNumber}
          );
        } else {
          // update frameNumber since it is still needed in current frame
          this._tileManager.update(child.id, {frameNumber: frameState.frameNumber});
        }
      } else if (childTile) {
        // if child tile is fetched and available
        this.updateTile(childTile, frameState);
      }
    }
  }

  _onTileLoad(header, tile, frameState) {
    const basePath = this.options.basePath;
    // after child tile is fetched
    const childTile = new I3STileHeader(tile.tileset, header, tile, basePath);
    tile.children.push(childTile);
    this.updateTile(childTile, frameState);

    // after tile fetcher, resume traversal if still in current update/traversal frame
    if (this._frameNumber === frameState.frameNumber) {
      this.executeTraversal(childTile, frameState);
    }
  }
}

async function fetchTileNode(basePath, nodeId) {
  const nodeUrl = `${basePath}/nodes/${nodeId}`;
  return await fetch(nodeUrl).then(resp => resp.json());
}
