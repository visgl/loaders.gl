import {_BaseTilesetTraverser as BaseTilesetTraverser} from '@loaders.gl/3d-tiles';

import {lodJudge} from '../utils/lod';
/* global fetch */
import I3STileHeader from './i3s-tile-header';

export default class I3STilesetTraverser extends BaseTilesetTraverser {
  constructor(options) {
    super(options);

    // persist fetched tile headers
    this._tileHeaderMap = {};
  }

  shouldRefine(tile, frameState) {
    // TODO refactor loaJudge
    tile._loadJudge = lodJudge(tile, frameState);
    return tile._loadJudge === 'DIG';
  }

  // eslint-disable-next-line complexity
  async updateChildTiles(tile, frameState) {
    const {basePath} = this.options;
    const children = tile._header.children || [];

    for (const child of children) {
      if (frameState.frameNumber !== this._frameNumber) {
        return false;
      }

      let childTile = this._tileHeaderMap[child.id];

      // if child tile is not requested or fetched
      if (!childTile) {
        this._tileHeaderMap[child.id] = {};
        const header = await fetchTileNode(basePath, child.id);

        // after child tile is fetched
        childTile = new I3STileHeader(tile.tileset, header, tile, basePath);
        tile.children.push(childTile);
        this._tileHeaderMap[child.id] = childTile;
      }

      // if child tile is fetched and available
      if (childTile._header) {
        this.updateTile(childTile, frameState);
      }
    }

    return true;
  }
}

async function fetchTileNode(basePath, nodeId) {
  const nodeUrl = `${basePath}/nodes/${nodeId}`;
  return await fetch(nodeUrl).then(resp => resp.json());
}
