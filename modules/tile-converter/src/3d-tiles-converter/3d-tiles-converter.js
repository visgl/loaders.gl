import {join} from 'path';
import process from 'process';
import transform from 'json-map-transform';
import {load} from '@loaders.gl/core';
import {I3SLoader, I3SAttributeLoader} from '@loaders.gl/i3s';
import {Tileset3D, Tile3D} from '@loaders.gl/tiles';

import {PGMLoader} from '../pgm-loader';
import {i3sObbTo3dTilesObb} from './helpers/i3s-obb-to-3d-tiles-obb';
import {convertScreenThresholdToGeometricError} from '../lib/utils/lod-conversion-utils';
import {writeFile, removeDir} from '../lib/utils/file-utils';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utills';
import {TILESET as tilesetTemplate} from './json-templates/tileset';
import B3dmConverter from './helpers/b3dm-converter';
import {createObbFromMbs} from '../i3s-converter/helpers/coordinate-converter';

const I3S = 'I3S';

export default class Tiles3DConverter {
  constructor() {
    this.options = {};
    this.tilesetPath = '';
    this.vertexCounter = 0;
  }
  async convert({inputUrl, outputPath, tilesetName, maxDepth, egmFilePath}) {
    this.conversionStartTime = process.hrtime();
    this.options = {maxDepth};

    console.log('Loading egm file...'); // eslint-disable-line
    this.geoidHeightModel = await load(egmFilePath, PGMLoader);
    console.log('Loading egm file completed!'); // eslint-disable-line

    const sourceTilesetJson = await load(inputUrl, I3SLoader, {});
    this.sourceTileset = new Tileset3D(sourceTilesetJson, {});

    if (!this.sourceTileset.root.header.obb) {
      this.sourceTileset.root.header.obb = createObbFromMbs(this.sourceTileset.root.header.mbs);
    }

    this.tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    this.attributeStorageInfo = sourceTilesetJson.attributeStorageInfo;
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(this.tilesetPath);
    } catch (e) {
      // do nothing
    }

    const rootTile = {
      boundingVolume: {
        box: i3sObbTo3dTilesObb(this.sourceTileset.root.header.obb, this.geoidHeightModel)
      },
      geometricError: convertScreenThresholdToGeometricError(this.sourceTileset.root),
      children: []
    };

    await this._addChildren(this.sourceTileset.root, rootTile, 1);

    const tileset = transform({root: rootTile}, tilesetTemplate);
    await writeFile(this.tilesetPath, JSON.stringify(tileset), 'tileset.json');

    this._finishConversion({slpk: false, outputPath, tilesetName});
  }

  async _addChildren(parentSourceNode, parentNode, level) {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const childNodeInfo of parentSourceNode.header.children || []) {
      const sourceChild = await this._loadChildNode(parentSourceNode, childNodeInfo);
      parentSourceNode.children.push(sourceChild);
      if (sourceChild.contentUrl) {
        await this.sourceTileset._loadTile(sourceChild);
        this.vertexCounter += sourceChild.content.vertexCount;

        let attributes = null;
        if (this.attributeStorageInfo) {
          attributes = await this._loadChildAttributes(sourceChild, this.attributeStorageInfo);
        }

        if (!sourceChild.header.obb) {
          sourceChild.header.obb = createObbFromMbs(sourceChild.header.mbs);
        }

        const boundingVolume = {
          box: i3sObbTo3dTilesObb(sourceChild.header.obb, this.geoidHeightModel)
        };
        const child = {
          boundingVolume,
          geometricError: convertScreenThresholdToGeometricError(sourceChild),
          children: []
        };

        const b3dm = await new B3dmConverter().convert(sourceChild, attributes);
        child.content = {
          uri: `${sourceChild.id}.b3dm`,
          boundingVolume
        };
        await writeFile(this.tilesetPath, new Uint8Array(b3dm), `${sourceChild.id}.b3dm`);
        parentNode.children.push(child);

        sourceChild.unloadContent();
        await this._addChildren(sourceChild, child, level + 1);
      } else {
        await this._addChildren(sourceChild, parentNode, level + 1);
      }
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

  /**
   * Do loading all attributes related to particular node.
   * @param {Object} sourceChild
   * @param {Object} attributeStorageInfo
   * @returns {Promise<Object>} - Promise of attributes object.
   */
  async _loadChildAttributes(sourceChild, attributeStorageInfo) {
    const promises = [];
    const {attributeUrls} = sourceChild.header;

    for (let index = 0; index < attributeUrls.length; index++) {
      const inputUrl = attributeUrls[index];
      const attribute = attributeStorageInfo[index];
      const options = {
        attributeName: attribute.name,
        attributeType: this._getAttributeType(attribute)
      };

      promises.push(load(inputUrl, I3SAttributeLoader, options));
    }
    const attributesList = await Promise.all(promises);
    this._replaceNestedArrays(attributesList);
    return Object.assign({}, ...attributesList);
  }

  /**
   * Returns attribute type for loading attributes
   * @param {Object} attribute
   * Workaround for I3S v1.6. There is no attribute.attributeValues.valueType field in attribute.
   * There is an 'Oid32' type if attribute has objectIds property.
   * Doc: https://github.com/Esri/i3s-spec/blob/master/docs/1.6/attributeStorageInfo.cmn.md
   */
  _getAttributeType(attribute) {
    if (attribute.attributeValues) {
      return attribute.attributeValues.valueType;
    } else if (attribute.objectIds) {
      return 'Oid32';
    }
    return '';
  }

  /**
   * Make simple arrays from attribute typed arrays.
   * @param {Object} attributesList
   * @returns {void}
   */
  _replaceNestedArrays(attributesList) {
    for (let index = 0; index < attributesList.length; index++) {
      const attributeObject = attributesList[index];

      for (const key in attributeObject) {
        attributeObject[key] = Array.from(attributeObject[key]);
      }
    }
  }

  async _finishConversion(params) {
    const filesSize = await calculateFilesSize(params);
    const diff = process.hrtime(this.conversionStartTime);
    const conversionTime = timeConverter(diff);

    console.log(`------------------------------------------------`); // eslint-disable-line
    console.log(`Finish conversion of ${I3S}`); // eslint-disable-line
    console.log(`Total conversion time: ${conversionTime}`); // eslint-disable-line
    console.log(`Vertex count: `, this.vertexCounter); // eslint-disable-line
    console.log(`File(s) size: `, filesSize, ' bytes'); // eslint-disable-line
    console.log(`------------------------------------------------`); // eslint-disable-line
  }
}
