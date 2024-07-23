import type {
  AttributeStorageInfo,
  FeatureAttribute,
  NodeReference,
  I3STilesetHeader
} from '@loaders.gl/i3s';
import type {Tile3DBoundingVolume, Tiles3DTileJSON} from '@loaders.gl/3d-tiles';

import {join} from 'path';
import process from 'process';
import transform from 'json-map-transform';
import {load, isBrowser} from '@loaders.gl/core';
import {I3SLoader, I3SAttributeLoader, COORDINATE_SYSTEM} from '@loaders.gl/i3s';
import {Geoid} from '@math.gl/geoid';

import {PGMLoader} from '../pgm-loader';
import {i3sObbTo3dTilesObb} from './helpers/i3s-obb-to-3d-tiles-obb';
import {convertScreenThresholdToGeometricError} from '../lib/utils/lod-conversion-utils';
import {writeFile, removeDir} from '../lib/utils/file-utils';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utills';
import {TILESET as tilesetTemplate} from './json-templates/tileset';
import {createObbFromMbs} from '../i3s-converter/helpers/coordinate-converter';
import {WorkerFarm} from '@loaders.gl/worker-utils';
import {BROWSER_ERROR_MESSAGE} from '../constants';
import B3dmConverter, {I3SAttributesData} from './helpers/b3dm-converter';
import {I3STileHeader} from '@loaders.gl/i3s/src/types';
import {getNodeCount, loadFromArchive, loadI3SContent, openSLPK} from './helpers/load-i3s';
import {I3SLoaderOptions} from '@loaders.gl/i3s/src/i3s-loader';
import {ZipFileSystem} from '../../../zip/src';
import {ConversionDump, ConversionDumpOptions} from '../lib/utils/conversion-dump';
import {Progress} from '../i3s-converter/helpers/progress';
import {PromptModule} from 'inquirer';

const I3S = 'I3S';

/**
 * Converter from i3s to 3d-tiles
 */
export default class Tiles3DConverter {
  options: any;
  tilesetPath: string;
  vertexCounter: number;
  conversionStartTime: [number, number];
  geoidHeightModel: Geoid | null;
  sourceTileset: I3STilesetHeader | null;
  attributeStorageInfo?: AttributeStorageInfo[] | null;
  workerSource: {[key: string]: string} = {};
  slpkFilesystem: ZipFileSystem | null = null;
  loaderOptions: I3SLoaderOptions = {
    _nodeWorkers: true,
    reuseWorkers: true,
    // TODO: converter freezes in the end because of i3s-content-worker
    worker: false,
    i3s: {coordinateSystem: COORDINATE_SYSTEM.LNGLAT_OFFSETS, decodeTextures: false},
    // We need to load local fs workers because nodejs can't load workers from the Internet
    'i3s-content': {
      workerUrl: './modules/i3s/dist/i3s-content-worker-node.js'
    }
  };
  conversionDump: ConversionDump;
  progress: Progress;

  constructor() {
    this.options = {};
    this.tilesetPath = '';
    this.vertexCounter = 0;
    this.conversionStartTime = [0, 0];
    this.geoidHeightModel = null;
    this.sourceTileset = null;
    this.attributeStorageInfo = null;
    this.workerSource = {};
    this.conversionDump = new ConversionDump();
    this.progress = new Progress();
  }

  /**
   * Convert i3s format data to 3dTiles
   * @param options
   * @param options.inputUrl the url to read the tileset from
   * @param options.outputPath the output filename
   * @param options.tilesetName the output name of the tileset
   * @param options.egmFilePath location of *.pgm file to convert heights from ellipsoidal to gravity-related format
   * @param options.maxDepth The max tree depth of conversion
   */
  // eslint-disable-next-line complexity, max-statements
  public async convert(options: {
    inputUrl: string;
    outputPath: string;
    tilesetName: string;
    maxDepth?: number;
    egmFilePath: string;
    inquirer?: {prompt: PromptModule};
    analyze?: boolean;
  }): Promise<string | undefined> {
    if (isBrowser) {
      console.log(BROWSER_ERROR_MESSAGE); // eslint-disable-line no-console
      return BROWSER_ERROR_MESSAGE;
    }
    const {inputUrl, outputPath, tilesetName, maxDepth, egmFilePath, inquirer, analyze} = options;
    this.conversionStartTime = process.hrtime();
    this.options = {maxDepth, inquirer};

    console.log('Loading egm file...'); // eslint-disable-line
    this.geoidHeightModel = await load(egmFilePath, PGMLoader);
    console.log('Loading egm file completed!'); // eslint-disable-line

    this.slpkFilesystem = await openSLPK(inputUrl);

    let preprocessResult = true;
    if (analyze || this.slpkFilesystem) {
      preprocessResult = await this.preprocessConversion();
      if (!preprocessResult || analyze) {
        return undefined;
      }
    }

    this.progress.startMonitoring();

    this.sourceTileset = await loadFromArchive(
      inputUrl,
      I3SLoader,
      {
        ...this.loaderOptions,
        // @ts-expect-error `isTileset` can be boolean of 'auto' but TS expects a string
        i3s: {...this.loaderOptions.i3s, isTileset: true}
      },
      this.slpkFilesystem
    );

    if (!this.sourceTileset) {
      return undefined;
    }

    const rootNode = this.sourceTileset?.root;
    if (!rootNode.obb) {
      rootNode.obb = createObbFromMbs(rootNode.mbs);
    }

    this.tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    this.attributeStorageInfo = this.sourceTileset.attributeStorageInfo;

    await this.conversionDump.createDump(options as ConversionDumpOptions);
    if (this.conversionDump.restored && this.options.inquirer) {
      const result = await this.options.inquirer.prompt([
        {
          name: 'resumeConversion',
          type: 'confirm',
          message:
            'Dump file of the previous conversion exists, do you want to resume that conversion?'
        }
      ]);
      if (!result.resumeConversion) {
        this.conversionDump.reset();
      }
    }
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    if (!this.conversionDump.restored) {
      try {
        await removeDir(this.tilesetPath);
      } catch (e) {
        // do nothing
      }
    }

    const rootTile: Tiles3DTileJSON = {
      boundingVolume: {
        box: i3sObbTo3dTilesObb(rootNode.obb, this.geoidHeightModel)
      },
      geometricError: convertScreenThresholdToGeometricError(rootNode),
      children: [],
      refine: 'REPLACE'
    };

    await this._addChildren(rootNode, rootTile, 1);

    const tileset = transform({root: rootTile}, tilesetTemplate());
    await writeFile(this.tilesetPath, JSON.stringify(tileset), 'tileset.json');
    await this.conversionDump.deleteDumpFile();

    this.progress.stopMonitoring();

    await this._finishConversion({slpk: false, outputPath, tilesetName});

    if (this.slpkFilesystem) {
      this.slpkFilesystem.destroy();
    }

    // Clean up worker pools
    const workerFarm = WorkerFarm.getWorkerFarm({});
    workerFarm.destroy();
    return undefined;
  }

  /**
   * Preprocess stage of the tile converter. Calculate number of nodes
   * @returns true - the conversion is possible, false - the tileset's content is not supported
   */
  private async preprocessConversion(): Promise<boolean> {
    // eslint-disable-next-line no-console
    console.log('Analyze source layer');
    const nodesCount = await getNodeCount(this.slpkFilesystem);
    this.progress.stepsTotal = nodesCount;

    // eslint-disable-next-line no-console
    console.log('------------------------------------------------');
    // eslint-disable-next-line no-console
    console.log('Preprocess results:');
    if (this.slpkFilesystem) {
      // eslint-disable-next-line no-console
      console.log(`Node count: ${nodesCount}`);
      if (nodesCount === 0) {
        // eslint-disable-next-line no-console
        console.log('Node count is 0. The conversion will be interrupted.');
        // eslint-disable-next-line no-console
        console.log('------------------------------------------------');
        return false;
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('Node count cannot be calculated for the remote dataset');
    }

    // eslint-disable-next-line no-console
    console.log('------------------------------------------------');
    return true;
  }

  /**
   * Convert particular I3S Node
   * @param parentSourceNode the parent node tile object (@loaders.gl/tiles/Tile3D)
   * @param parentNode object in resulting tileset
   * @param level a current level of a tree depth
   * @param childNodeInfo child node to convert
   */
  // eslint-disable-next-line complexity, max-statements
  private async convertChildNode(
    parentSourceNode: I3STileHeader,
    parentNode: Tiles3DTileJSON,
    level: number,
    childNodeInfo: NodeReference
  ): Promise<void> {
    let nextParentNode = parentNode;
    const sourceChild = await this._loadChildNode(parentSourceNode, childNodeInfo);
    if (sourceChild.contentUrl) {
      if (
        this.conversionDump.restored &&
        this.conversionDump.isFileConversionComplete(`${sourceChild.id}.b3dm`) &&
        (sourceChild.obb || sourceChild.mbs)
      ) {
        const {child} = this._createChildAndBoundingVolume(sourceChild);
        parentNode.children.push(child);
        await this._addChildren(sourceChild, child, level + 1);
        return;
      }
      const content = await loadI3SContent(
        this.sourceTileset,
        sourceChild,
        this.loaderOptions,
        this.slpkFilesystem
      );

      if (!content) {
        await this._addChildren(sourceChild, parentNode, level + 1);
        return;
      }

      this.vertexCounter += content?.vertexCount || 0;

      let featureAttributes: FeatureAttribute | null = null;
      if (this.attributeStorageInfo) {
        featureAttributes = await this._loadChildAttributes(sourceChild, this.attributeStorageInfo);
      }

      const {child, boundingVolume} = this._createChildAndBoundingVolume(sourceChild);

      const i3sAttributesData: I3SAttributesData = {
        tileContent: content,
        box: boundingVolume.box || [],
        textureFormat: sourceChild.textureFormat
      };

      const b3dmConverter = new B3dmConverter();
      const b3dm = await b3dmConverter.convert(i3sAttributesData, featureAttributes);

      await this.conversionDump.addNode(`${sourceChild.id}.b3dm`, sourceChild.id);
      await writeFile(this.tilesetPath, new Uint8Array(b3dm), `${sourceChild.id}.b3dm`);
      await this.conversionDump.updateConvertedNodesDumpFile(
        `${sourceChild.id}.b3dm`,
        sourceChild.id,
        true
      );
      parentNode.children.push(child);
      nextParentNode = child;
    }

    this.progress.stepsDone += 1;
    let timeRemainingString = 'Calculating time left...';
    const timeRemaining = this.progress.getTimeRemainingString();
    if (timeRemaining) {
      timeRemainingString = `${timeRemaining} left`;
    }
    const percentString = this.progress.getPercentString();
    const progressString = percentString ? ` ${percentString}%, ${timeRemainingString}` : '';
    console.log(`[converted${progressString}]: ${childNodeInfo.id}`); // eslint-disable-line

    await this._addChildren(sourceChild, nextParentNode, level + 1);
  }

  /**
   * The recursive function of traversal of a nodes tree
   * @param parentSourceNode the parent node tile object (@loaders.gl/tiles/Tile3D)
   * @param parentNode object in resulting tileset
   * @param level a current level of a tree depth
   */
  private async _addChildren(
    parentSourceNode: I3STileHeader,
    parentNode: Tiles3DTileJSON,
    level: number
  ): Promise<void> {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const childNodeInfo of parentSourceNode.children || []) {
      await this.convertChildNode(parentSourceNode, parentNode, level, childNodeInfo);
    }
  }

  /**
   * Load a child node having information from the node header
   * @param parentNode a parent node tile object (@loaders.gl/tiles/Tile3D)
   * @param childNodeInfo child information from 3DNodeIndexDocument
   *   (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/nodeReference.cmn.md)
   */
  private async _loadChildNode(
    parentNode: I3STileHeader,
    childNodeInfo: NodeReference
  ): Promise<I3STileHeader> {
    let header;
    if (this.sourceTileset?.nodePagesTile) {
      console.log(`Node conversion: ${childNodeInfo.id}`); // eslint-disable-line no-console,no-undef
      header = await this.sourceTileset.nodePagesTile.formTileFromNodePages(
        parseInt(childNodeInfo.id)
      );
    } else {
      const nodeUrl = this._relativeUrlToFullUrl(parentNode.url, childNodeInfo.href!);
      // load metadata
      const options: I3SLoaderOptions = {
        i3s: {
          ...this.loaderOptions,
          // @ts-expect-error
          isTileHeader: true,
          loadContent: false
        }
      };

      console.log(`Node conversion: ${nodeUrl}`); // eslint-disable-line no-console,no-undef
      header = await loadFromArchive(nodeUrl, I3SLoader, options, this.slpkFilesystem);
    }
    return header;
  }

  /**
   * Create child and child's boundingVolume for the converted node
   * @param sourceChild
   * @returns child and child's boundingVolume
   */
  private _createChildAndBoundingVolume(sourceChild: I3STileHeader): {
    boundingVolume: Tile3DBoundingVolume;
    child: Tiles3DTileJSON;
  } {
    if (!sourceChild.obb) {
      sourceChild.obb = createObbFromMbs(sourceChild.mbs);
    }
    const boundingVolume: Tile3DBoundingVolume = {
      box: i3sObbTo3dTilesObb(sourceChild.obb, this.geoidHeightModel)
    };
    const child: Tiles3DTileJSON = {
      boundingVolume,
      geometricError: convertScreenThresholdToGeometricError(sourceChild),
      children: [],
      content: {
        uri: `${sourceChild.id}.b3dm`,
        boundingVolume
      }
    };
    return {boundingVolume, child};
  }

  /**
   * Make an url of a resource from its relative url having the base url
   * @param baseUrl the base url. A resulting url will be related from this url
   * @param relativeUrl a realtive url of a resource
   */
  private _relativeUrlToFullUrl(baseUrl: string = '', relativeUrl: string): string {
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
   * @param sourceChild
   * @param attributeStorageInfo
   * @returns Promise of attributes object.
   */
  private async _loadChildAttributes(
    sourceChild: I3STileHeader,
    attributeStorageInfo: AttributeStorageInfo[]
  ): Promise<FeatureAttribute> {
    const promises: any[] = [];
    const {attributeUrls = []} = sourceChild;

    for (let index = 0; index < attributeUrls.length; index++) {
      const inputUrl = attributeUrls[index];
      const attribute = attributeStorageInfo[index];
      const options = {
        attributeName: attribute.name,
        attributeType: this._getAttributeType(attribute)
      };

      promises.push(loadFromArchive(inputUrl, I3SAttributeLoader, options, this.slpkFilesystem));
    }
    const attributesList = await Promise.all(promises);
    this._replaceNestedArrays(attributesList);
    return Object.assign({}, ...attributesList);
  }

  /**
   * Returns attribute type for loading attributes
   * @param attribute
   * Workaround for I3S v1.6. There is no attribute.attributeValues.valueType field in attribute.
   * There is an 'Oid32' type if attribute has objectIds property.
   * Doc: https://github.com/Esri/i3s-spec/blob/master/docs/1.6/attributeStorageInfo.cmn.md
   */
  private _getAttributeType(attribute: AttributeStorageInfo): string {
    if (attribute.attributeValues) {
      return attribute.attributeValues.valueType;
    } else if (attribute.objectIds) {
      return 'Oid32';
    }
    return '';
  }

  /**
   * Make simple arrays from attribute typed arrays.
   * @param attributesList
   */
  private _replaceNestedArrays(attributesList: FeatureAttribute[]): void {
    for (let index = 0; index < attributesList.length; index++) {
      const attributeObject = attributesList[index];

      for (const key in attributeObject) {
        attributeObject[key] = Array.from(attributeObject[key]);
      }
    }
  }

  /**
   * Print statistics in the end of conversion
   * @param params - output files data
   */
  private async _finishConversion(params: {
    slpk: boolean;
    outputPath: string;
    tilesetName: string;
  }): Promise<void> {
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
