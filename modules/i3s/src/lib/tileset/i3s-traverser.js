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

  async traverse(root, frameState, options) {
    let tileNode = this._tree.appendNode(root);
    if (tileNode.metricType == 'maxScreenThreshold') {
      let lodStatus = lodJudge(frameState, tileNode);

      switch (lodStatus) {
        case 'OUT':
          this._tree.unloadSubTree(tileNode);
          break;
        case 'DIG':
          this._tree.unloadNodeByObject(tileNode);
          for (let i = 0; i < tileNode.content.children.length; i++) {
            const childId = tileNode.content.children[i].id;
            let tileset = this._tileMap[childId];
            if (!tileset) {
              tileset = await fetchTileNode(this.baseUrl, childId);
              this._tileMap[tileNode.id] = tileset;
            }
            await this.traverse(tileset, frameState, options);
          }
          break;
        case 'DRAW':
          this.results.selectedTiles[tileNode.id] = tileNode;
          break;
      }
    }
  }
}
