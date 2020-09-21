import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';

const I3S = 'I3S';

export default class Tiles3DConverter {
  constructor() {
    this.options = {};
  }
  async convert({inputUrl, outputPath, tilesetName, maxDepth}) {
    this.options = {maxDepth};
    const sourceTilesetJson = await load(inputUrl, I3SLoader, {});
    this.sourceTileset = new Tileset3D(sourceTilesetJson, {});

    await this._addChildren(this.sourceTileset.root, 1);

    this._finishConversion();
  }

  async _addChildren(parentNode, level) {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const childNodeInfo of parentNode.header.children || []) {
      const child = await this._loadChildNode(parentNode, childNodeInfo);
      parentNode.children.push(child);
      await this.sourceTileset._loadTile(child);

      // TODO: convert node here

      child.unloadContent();
      await this._addChildren(child, level + 1);
    }
  }

  async _loadChildNode(parentNode, childNodeInfo) {
    const {loader} = this.sourceTileset;
    const nodeUrl = this._relativeUrlToFullUrl(parentNode.url, childNodeInfo.href);
    // load metadata
    const options = {
      i3s: {
        ...this.sourceTileset.fetchOptions,
        isTileHeader: true,
        loadContent: false
      }
    };

    console.log(`Node conversion: ${nodeUrl}`); // eslint-disable-line no-console,no-undef
    const header = await load(nodeUrl, loader, options);
    return new Tile3D(this.sourceTileset, header, parentNode, options.basePath);
  }

  _relativeUrlToFullUrl(baseUrl, relativeUrl) {
    let resultArray = baseUrl.split('/');
    const relativeUrlArray = relativeUrl.split('/');
    for (const folder of relativeUrlArray) {
      switch (folder) {
        case '.':
          continue; // eslint-disable-line no-continue
        case '..':
          resultArray = resultArray.slice(0, -1);
          break;
        default:
          resultArray.push(folder);
      }
    }
    return resultArray.join('/');
  }

  // TODO fill this method with stats when conversion is implemented
  async _finishConversion() {
    console.log(`------------------------------------------------`); // eslint-disable-line
    console.log(`Finish conversion of ${I3S}`); // eslint-disable-line
    console.log(`------------------------------------------------`); // eslint-disable-line
  }
}
