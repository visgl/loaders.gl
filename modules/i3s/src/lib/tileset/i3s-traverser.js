import I3STileTree, {TILE3D_CONTENT_STATE} from './i3s-tile-tree';
import {lodJudge} from './utils';
import {fetchTileNode} from './i3s-tileset';

export default class I3STraverser {
  constructor(options) {
    this.baseUrl = options.baseUrl;
    this._tree = new I3STileTree(options);

    this._tileMap = {};

    this.results = {
      selectedTiles: {}
    };
  }

  async _traverse(root, frameState, options = {}) {
    let tileNode = this._tree.appendNode(root);
    if (tileNode.metricType == 'maxScreenThreshold') {
      let lodStatus = lodJudge(frameState, tileNode);

      switch (lodStatus) {
      case 'OUT':
        this._tree.unloadSubTree(tileNode, options.onTileUnload);
        break;
      case 'DIG':
        const children = tileNode.content.children;
        this._tree.unloadNodeByObject(tileNode, options.onTileUnload);
        for (let i = 0; i < children.length; i++) {
          const childId = tileNode.content.children[i].id;
          let tileset = this._tileMap[childId];
          if (!tileset) {
            tileset = await fetchTileNode(this.baseUrl, childId);
            this._tileMap[childId] = tileset;
          }

          if (tileset.lodSelection) {
            await this._traverse(tileset, frameState, options);
          }
        }
        break;
      case 'DRAW':
        tileNode._isVisible = true;
        this.results.selectedTiles[tileNode.id] = tileNode;
        break;
      }
    }
  }

  async startTraverse(root, frameState, options = {}) {
    this.results.selectedTiles = {};
    await this._traverse(root, frameState, options);
  }
}
