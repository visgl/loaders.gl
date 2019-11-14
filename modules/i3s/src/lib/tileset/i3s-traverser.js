/* global setTimeout */
import I3STileTree from './i3s-tile-tree';
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

  /* eslint-disable max-depth */
  async _traverse(root, frameState, options = {}) {
    const tileNode = this._tree.appendNode(root);
    if (tileNode.metricType === 'maxScreenThreshold') {
      const lodStatus = lodJudge(frameState, tileNode);

      switch (lodStatus) {
        case 'OUT':
          setTimeout(() => {
            this._tree.unloadSubTree(tileNode, options.onTileUnload);
          }, 1000);
          break;
        case 'DIG':
          const children = tileNode.content.children;
          for (let i = 0; i < children.length; i++) {
            const childId = tileNode.content.children[i].id;
            let tileset = this._tileMap[childId];
            if (!tileset) {
              this._tileMap[childId] = {};
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

        default:
      }
    }
  }
  /* eslint-enable max-depth */

  async startTraverse(root, frameState, options = {}) {
    this.results.selectedTiles = {};
    await this._traverse(root, frameState, options);
  }
}
