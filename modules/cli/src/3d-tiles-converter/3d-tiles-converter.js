import {join} from 'path';
import transform from 'json-map-transform';
import {load} from '@loaders.gl/core';
import {I3SLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';

import {i3sObbTo3dTilesObb} from './helpers/i3s-obb-to-3d-tiles-obb';
import {convertScreenThresholdToGeometricError} from '../lib/utils/lod-conversion-utils';
import {writeFile, removeDir} from '../lib/utils/file-utils';
import {TILESET as tilesetTemplate} from './json-templates/tileset';
import B3dmConverter from './helpers/b3dm-converter';

const I3S = 'I3S';

export default class Tiles3DConverter {
  constructor() {
    this.options = {};
    this.tilesetPath = '';
  }
  async convert({inputUrl, outputPath, tilesetName, maxDepth}) {
    this.options = {maxDepth};
    const sourceTilesetJson = await load(inputUrl, I3SLoader, {});
    this.sourceTileset = new Tileset3D(sourceTilesetJson, {});

    this.tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(this.tilesetPath);
    } catch (e) {
      // do nothing
    }

    const rootTile = {
      boundingVolume: {box: i3sObbTo3dTilesObb(this.sourceTileset.root.header.obb)},
      geometricError: convertScreenThresholdToGeometricError(this.sourceTileset.root),
      children: []
    };

    await this._addChildren(this.sourceTileset.root, rootTile, 1);

    const tileset = transform({root: rootTile}, tilesetTemplate);
    await writeFile(this.tilesetPath, JSON.stringify(tileset), 'tileset.json');

    this._finishConversion();
  }

  async _addChildren(parentSourceNode, parentNode, level) {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const childNodeInfo of parentSourceNode.header.children || []) {
      const sourceChild = await this._loadChildNode(parentSourceNode, childNodeInfo);
      parentSourceNode.children.push(sourceChild);
      await this.sourceTileset._loadTile(sourceChild);

      const boundingVolume = {box: i3sObbTo3dTilesObb(sourceChild.header.obb)};
      const child = {
        boundingVolume,
        geometricError: convertScreenThresholdToGeometricError(sourceChild),
        children: []
      };

      const b3dm = await new B3dmConverter().convert(sourceChild.content);
      child.content = {
        uri: `${sourceChild.id}.b3dm`,
        boundingVolume
      };
      await writeFile(this.tilesetPath, new Uint8Array(b3dm), `${sourceChild.id}.b3dm`);
      parentNode.children.push(child);

      sourceChild.unloadContent();
      await this._addChildren(sourceChild, child, level + 1);
    }
  }

  async _loadChildNode(parentNode, childNodeInfo) {
    let header;
    if (this.sourceTileset.tileset.nodePages) {
      console.log(`Node conversion: ${childNodeInfo.id}`); // eslint-disable-line no-console,no-undef
      header = await this.sourceTileset.tileset.nodePagesTile.formTileFromNodePages(
        childNodeInfo.id
      );
    } else {
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
      header = await load(nodeUrl, loader, options);
    }
    return new Tile3D(this.sourceTileset, header, parentNode);
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
