import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';
import md5 from 'md5';

import NodePages from './helpers/node-pages';
import {writeFile, removeDir, writeFileForSlpk} from '../lib/utils/file-utils';
import {
  compressWithChildProcess
  // generateHash128FromZip,
  // addFileToZip
} from '../lib/utils/compress-util';
import {calculateFilesSize, timeConverter} from '../lib/utils/statistic-utills';
import convertB3dmToI3sGeometry from './helpers/geometry-converter';
import {
  convertCommonToI3SCoordinate,
  convertCommonToI3SExtentCoordinate
} from './helpers/coordinate-converter';
import {createSceneServerPath} from './helpers/create-scene-server-path';
import {convertGeometricErrorToScreenThreshold} from '../lib/utils/lod-conversion-utils';
import {PGMLoader} from '../pgm-loader';

import {LAYERS as layersTemplate} from './json-templates/layers';
import {NODE as nodeTemplate} from './json-templates/node';
import {SHARED_RESOURCES_TEMPLATE} from './json-templates/shared-resources';
import {validateNodeBoundingVolumes} from './helpers/node-debug';

const ION_DEFAULT_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_NODES_PER_PAGE = 64;
const _3D_TILES = '3DTILES';
const _3D_OBJECT_LAYER_TYPE = '3DObject';
const STRING_TYPE = 'string';
const SHORT_INT_TYPE = 'Int32';
const DOUBLE_TYPE = 'double';
const OBJECT_ID_TYPE = 'OBJECTID';
const REFRESH_TOKEN_TIMEOUT = 1800; // 30 minutes in seconds
// const FS_FILE_TOO_LARGE = 'ERR_FS_FILE_TOO_LARGE';

export default class I3SConverter {
  constructor() {
    this.nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE);
    this.fileMap = {};
    this.options = {};
    this.layers0Path = '';
    this.materialMap = new Map();
    this.materialDefinitions = [];
    this.vertexCounter = 0;
    this.layers0 = {};
    this.featuresHashArray = [];
    this.refinementCounter = {
      tilesCount: 0,
      tilesWithAddRefineCount: 0
    };
    this.validate = false;
    this.boundingVolumeWarnings = null;
  }

  // Convert a 3d tileset
  async convert({
    inputUrl,
    outputPath,
    tilesetName,
    maxDepth,
    slpk,
    sevenZipExe,
    egmFilePath,
    token,
    draco,
    validate
  }) {
    this.conversionStartTime = process.hrtime();
    this.options = {maxDepth, slpk, sevenZipExe, egmFilePath, draco, token, inputUrl};
    this.validate = validate;

    console.log('Loading egm file...'); // eslint-disable-line
    this.geoidHeightModel = await load(egmFilePath, PGMLoader);
    console.log('Loading egm file completed!'); // eslint-disable-line

    if (slpk) {
      this.nodePages.useWriteFunction(writeFileForSlpk);
    }

    const fetchOptions = await this._fetchPreloadOptions();
    const sourceTilesetJson = await load(inputUrl, CesiumIonLoader, {
      fetch: fetchOptions
    });
    // console.log(tilesetJson); // eslint-disable-line
    this.sourceTileset = new Tileset3D(sourceTilesetJson, fetchOptions);

    await this._createAndSaveTileset(outputPath, tilesetName);
    await this._finishConversion({slpk, outputPath, tilesetName});
    return sourceTilesetJson;
  }

  // PRIVATE
  /**
   * Convert and save the layer and embedded tiles
   * @param {string} outputPath - path to save output data
   * @param {string} tilesetName - new tileset path
   * @return {Promise<void>}
   */
  async _createAndSaveTileset(outputPath, tilesetName) {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(tilesetPath);
    } catch (e) {
      // do nothing
    }

    this.layers0Path = join(tilesetPath, 'SceneServer', 'layers', '0');

    this._formLayers0(tilesetName);

    this.materialDefinitions = [];
    this.materialMap = new Map();

    const sourceRootTile = this.sourceTileset.root;
    const coordinates = convertCommonToI3SCoordinate(sourceRootTile, this.geoidHeightModel);
    const parentId = this.nodePages.push({
      lodThreshold: 0,
      obb: coordinates.obb,
      children: []
    });

    const isCreateSlpk = this.options.slpk;
    const root0 = this._formRootNodeIndexDocument(coordinates);

    await this._convertNodesTree(root0, sourceRootTile, parentId, coordinates);

    this.layers0.materialDefinitions = this.materialDefinitions;
    await this._writeLayers0();
    createSceneServerPath(tilesetName, this.layers0, tilesetPath);
    await this._writeNodeIndexDocument(root0, 'root', join(this.layers0Path, 'nodes', 'root'));
    await this.nodePages.save(this.layers0Path, this.fileMap, isCreateSlpk);
    await this._createSlpk(tilesetPath);
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param {string} tilesetName - Name of layer
   * @return {void}
   */
  _formLayers0(tilesetName) {
    const extent = convertCommonToI3SExtentCoordinate(this.sourceTileset);
    const layers0data = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 0,
      name: tilesetName,
      href: './layers/0',
      store: {
        id: `{${uuidv4().toUpperCase()}}`,
        extent
      },
      nodePages: {
        nodesPerPage: HARDCODED_NODES_PER_PAGE
      },
      compressGeometry: this.options.draco
    };

    this.layers0 = transform(layers0data, layersTemplate);
  }

  /**
   * Convert and save the layer and embedded tiles
   * @param {object} coordinates - mbs and obb data about node's bounding volume
   * @return {object} - 3DNodeIndexDocument data https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   */
  _formRootNodeIndexDocument(coordinates) {
    const root0data = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 'root',
      level: 0,
      lodSelection: [
        {
          metricType: 'maxScreenThresholdSQ',
          maxError: 0
        },
        {
          metricType: 'maxScreenThreshold',
          maxError: 0
        }
      ],
      ...coordinates,
      children: []
    };
    return transform(root0data, nodeTemplate);
  }

  /**
   * Form object of 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md
   * @param {object} root0 - 3DNodeIndexDocument of root node https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md
   * @param {object} sourceRootTile - Source (3DTile) tile data
   * @param {number} parentId - node id in node pages
   * @param {object} coordinates - mbs and obb data about node's bounding volume
   * @return {Promise<void>}
   */
  async _convertNodesTree(root0, sourceRootTile, parentId, coordinates) {
    await this.sourceTileset._loadTile(sourceRootTile);
    if (sourceRootTile.content && sourceRootTile.content.type === 'b3dm') {
      root0.children.push({
        id: '1',
        href: './1',
        ...coordinates
      });
      const [child] = await this._createNode(root0, sourceRootTile, parentId, 0);
      const childPath = join(this.layers0Path, 'nodes', child.path);

      if (this.options.slpk) {
        this.fileMap['nodes/1/3dNodeIndexDocument.json.gz'] = await writeFileForSlpk(
          childPath,
          JSON.stringify(child),
          '3dNodeIndexDocument.json'
        );
      } else {
        await writeFile(childPath, JSON.stringify(child));
      }
    } else {
      await this._addChildrenWithNeighborsAndWriteFile({
        parentNode: root0,
        sourceTiles: sourceRootTile.children,
        parentId,
        level: 1
      });
    }
    await sourceRootTile.unloadContent();
  }

  /**
   * Write 3DSceneLayer https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DSceneLayer.cmn.md in file
   * @return {Promise<void>}
   */
  async _writeLayers0() {
    if (this.options.slpk) {
      this.fileMap['3dSceneLayer.json.gz'] = await writeFileForSlpk(
        this.layers0Path,
        JSON.stringify(this.layers0),
        '3dSceneLayer.json'
      );
    } else {
      await writeFile(this.layers0Path, JSON.stringify(this.layers0));
    }
  }

  /**
   * Write 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md in file
   * @return {Promise<void>}
   */
  async _writeNodeIndexDocument(root0, nodePath, rootPath) {
    if (this.options.slpk) {
      this.fileMap[`nodes/${nodePath}/3dNodeIndexDocument.json.gz`] = await writeFileForSlpk(
        rootPath,
        JSON.stringify(root0),
        '3dNodeIndexDocument.json'
      );
    } else {
      await writeFile(rootPath, JSON.stringify(root0));
    }
  }

  /**
   * Pack files into *.slpk archive
   * @param {string} tilesetPath - Path to save file
   * @return {Promise<void>}
   */
  async _createSlpk(tilesetPath) {
    if (this.options.slpk) {
      const slpkTilesetPath = join(tilesetPath, 'SceneServer', 'layers', '0');
      const slpkFileName = `${tilesetPath}.slpk`;
      await compressWithChildProcess(
        slpkTilesetPath,
        slpkFileName,
        0,
        '.',
        this.options.sevenZipExe
      );

      // TODO: `addFileToZip` corrupts archive so it can't be validated with windows i3s_converter.exe
      // const fileHash128Path = `${tilesetPath}/@specialIndexFileHASH128@`;
      // try {
      //   await generateHash128FromZip(slpkFileName, fileHash128Path);
      //   await addFileToZip(
      //     tilesetPath,
      //     '@specialIndexFileHASH128@',
      //     slpkFileName,
      //     this.options.sevenZipExe
      //   );
      // } catch (error) {
      //   if (error.code === FS_FILE_TOO_LARGE) {
      //     console.warn(`${slpkFileName} file is too big to generate a hash`); // eslint-disable-line
      //   } else {
      //     console.error(error); // eslint-disable-line
      //   }
      // }
      // All converted files are contained in slpk now they can be deleted
      try {
        await removeDir(tilesetPath);
      } catch (e) {
        // do nothing
      }
    }
  }

  /**
   * Add child nodes recursively and write them to files
   * @param {object} data - arguments
   * @param {object} data.sourceTiles - array of source child nodes
   * @param {object} data.parentNode - 3DNodeIndexDocument of parent node for processing child nodes
   * @param {number} data.parentId - id of parent node in node pages
   * @param {number} data.level - level of node (distanse to root node in the tree)
   * @return {Promise<void>}
   */
  async _addChildrenWithNeighborsAndWriteFile(data) {
    const childNodes = [];
    await this._addChildren({...data, childNodes});
    await this._addNeighborsAndWriteFile(data.parentNode, childNodes);
  }

  /**
   * Add child nodes recursively and write them to files
   * @param {object} data - arguments
   * @param {array} data.childNodes - array of target child nodes
   * @param {array} data.sourceTiles - array of source child nodes
   * @param {object} data.parentNode - 3DNodeIndexDocument of parent node for processing child nodes
   * @param {number} data.parentId - id of parent node in node pages
   * @param {number} data.level - level of node (distanse to root node in the tree)
   * @return {Promise<void>}
   */
  async _addChildren({childNodes, sourceTiles, parentNode, parentId, level}) {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    for (const sourceTile of sourceTiles) {
      if (sourceTile.type === 'json') {
        await this.sourceTileset._loadTile(sourceTile);
        await this._addChildren({
          parentNode,
          sourceTiles: sourceTile.children,
          childNodes,
          parentId,
          level: level + 1
        });
        await sourceTile.unloadContent();
      } else {
        const coordinates = convertCommonToI3SCoordinate(sourceTile, this.geoidHeightModel);
        const children = await this._createNode(parentNode, sourceTile, parentId, level);
        for (const child of children) {
          parentNode.children.push({
            id: child.id,
            href: `../${child.path}`,
            ...coordinates
          });
          childNodes.push(child);
        }
      }
      if (sourceTile.id) {
        console.log(sourceTile.id); // eslint-disable-line
      }
    }
  }

  /**
   * Add neightbors to 3DNodeIndexDocument and write it in a file
   * @param {object} parentNode - arguments
   * @param {array} childNodes - array of target child nodes
   * @return {Promise<void>}
   */
  async _addNeighborsAndWriteFile(parentNode, childNodes) {
    for (const node of childNodes) {
      const childPath = join(this.layers0Path, 'nodes', node.path);
      const nodePath = node.path;
      delete node.path;

      // Don't do large amount of "neightbors" to avoid big memory consumption
      if (parentNode.children.length < 1000) {
        for (const neighbor of parentNode.children) {
          // eslint-disable-next-line max-depth
          if (node.id === neighbor.id) {
            continue; // eslint-disable-line
          }

          node.neighbors.push({...neighbor});
        }
      } else {
        // eslint-disable-next-line no-console, no-undef
        console.warn(
          `Node ${node.id}: neighbors attribute is omited because of large number of neigbors`
        );
        delete node.neighbors;
      }
      await this._writeNodeIndexDocument(node, nodePath, childPath);
      node.neighbors = [];
    }
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param {object} parentTile - parent 3DNodeIndexDocument
   * @param {object} sourceTile - source tile (3DTile)
   * @param {number} parentId - id of parent node in node pages
   * @param {number} level - level of node (distanse to root node in the tree)
   * @return {Promise<object[]>}
   */
  async _createNode(parentTile, sourceTile, parentId, level) {
    if (this.validate) {
      this._checkAddRefinementTypeForTile(sourceTile);
    }

    await this._updateTilesetOptions();
    await this.sourceTileset._loadTile(sourceTile);
    const coordinates = convertCommonToI3SCoordinate(sourceTile, this.geoidHeightModel);

    const lodSelection = convertGeometricErrorToScreenThreshold(sourceTile, coordinates);
    const maxScreenThresholdSQ = lodSelection.find(
      val => val.metricType === 'maxScreenThresholdSQ'
    ) || {maxError: 0};

    this._convertAttributeStorageInfo(sourceTile.content);

    const resourcesData = await this._convertResources(sourceTile);

    const nodes = [];
    const emptyResources = {
      geometry: null,
      compressedGeometry: null,
      texture: null,
      sharedResources: null,
      meshMaterial: null,
      vertexCount: null,
      attributes: null,
      featureCount: null
    };
    for (const resources of resourcesData || [emptyResources]) {
      const nodeInPage = this._createNodeInNodePages(
        maxScreenThresholdSQ,
        coordinates,
        sourceTile,
        parentId,
        resources
      );
      const node = this._createNodeIndexDocument(
        parentTile,
        coordinates,
        lodSelection,
        nodeInPage,
        resources
      );

      if (nodeInPage.mesh) {
        await this._writeResources(resources, node.path);
      }

      if (this.validate) {
        this.boundingVolumeWarnings = validateNodeBoundingVolumes(node);

        if (this.boundingVolumeWarnings && this.boundingVolumeWarnings.length) {
          console.warn('Bounding Volume Warnings: ', ...this.boundingVolumeWarnings); //eslint-disable-line
        }
      }

      nodes.push(node);
    }

    sourceTile.unloadContent();

    const firstNode = nodes[0];
    await this._addChildrenWithNeighborsAndWriteFile({
      parentNode: firstNode,
      sourceTiles: sourceTile.children,
      parentId: firstNode.id,
      level: level + 1
    });
    return nodes;
  }

  /**
   * Convert attributesStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
   * from B3DM batch table
   * @param {object} sourceTileContent - tile content of 3DTile
   * @return {void}
   */
  _convertAttributeStorageInfo(sourceTileContent) {
    const batchTable = sourceTileContent.batchTableJson;
    if (batchTable && !this.layers0.attributeStorageInfo.length) {
      this._convertBatchTableInfoToNodeAttributes(batchTable);
    }
  }

  /**
   * Convert tile to one or more I3S nodes
   * @param {object} sourceTile - source tile (3DTile)
   * @return {Promise<null | object[]>} If B3DM - returns resources for I3S node:
   * result.geometry - Uint8Array with geometry attributes
   * result.compressedGeometry - Uint8Array with compressed (draco) geometry
   * result.texture - texture image
   * result.sharedResources - shared resource data object
   * result.meshMaterial - PBR-like material object
   * result.vertexCount - number of vertices in geometry
   * result.attributes - feature attributes
   * result.featureCount - number of features
   */
  async _convertResources(sourceTile) {
    if (!sourceTile.content || sourceTile.content.type !== 'b3dm') {
      return null;
    }
    const resourcesData = await convertB3dmToI3sGeometry(
      sourceTile.content,
      Number(this.nodePages.nodesCounter),
      this.featuresHashArray,
      this.layers0.attributeStorageInfo,
      this.options.draco
    );
    return resourcesData;
  }

  /**
   * Create a new node object (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/node.cmn.md)
   * in node pages (https://github.com/Esri/i3s-spec/blob/master/docs/1.7/nodePage.cmn.md)
   * @param {object} maxScreenThresholdSQ - Level of Details (LOD) metric
   * @param {object} coordinates - Bounding volume coordinates
   * @param {object} sourceTile - source tile (3DTile)
   * @param {number} parentId - id of parent node in node pages
   * @param {object} resources - the node resources data
   * @param {object} resources.meshMaterial - PBR-like material object
   * @param {object} resources.texture - texture image
   * @param {number} resources.vertexCount - number of vertices in geometry
   * @param {number} resources.featureCount - number of features
   * @return {object} - the node object in node pages
   */
  _createNodeInNodePages(
    maxScreenThresholdSQ,
    coordinates,
    sourceTile,
    parentId,
    {meshMaterial, texture, vertexCount, featureCount}
  ) {
    const nodeInPage = {
      lodThreshold: maxScreenThresholdSQ.maxError,
      obb: coordinates.obb,
      children: []
    };
    if (sourceTile.content && sourceTile.content.type === 'b3dm') {
      nodeInPage.mesh = {
        geometry: {
          definition: texture ? 0 : 1
        },
        attribute: {}
      };
    }
    const nodeId = this.nodePages.push(nodeInPage, parentId);

    if (meshMaterial) {
      this.nodePages.updateMaterialByNodeId(nodeId, this._findOrCreateMaterial(meshMaterial));
    }

    if (texture) {
      const texelCountHint = texture.image.height * texture.image.width;
      this.nodePages.updateTexelCountHintByNodeId(nodeId, texelCountHint);
    }

    if (vertexCount) {
      this.vertexCounter += vertexCount;
      this.nodePages.updateVertexCountByNodeId(nodeId, vertexCount);
    }
    this.nodePages.updateNodeAttributeByNodeId(nodeId);
    if (featureCount) {
      this.nodePages.updateFeatureCountByNodeId(nodeId, featureCount);
    }

    return nodeInPage;
  }

  /**
   * Create a new node page object in node pages
   * @param {object} parentNode - 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object of the parent node
   * @param {object} coordinates - Bounding volume coordinates
   * @param {object} lodSelection - Level of Details (LOD) metrics
   * @param {object} nodeInPage - corresponding node object in a node page
   * @param {object} resources - the node resources data
   * @param {object} resources.texture - texture image
   * @param {object} resources.attributes - feature attributes
   * @return {object} - 3DNodeIndexDocument https://github.com/Esri/i3s-spec/blob/master/docs/1.7/3DNodeIndexDocument.cmn.md object
   */
  _createNodeIndexDocument(
    parentNode,
    coordinates,
    lodSelection,
    nodeInPage,
    {texture, attributes}
  ) {
    const nodeId = nodeInPage.index;
    const nodeData = {
      version: parentNode.version,
      id: nodeId.toString(),
      path: nodeId.toString(),
      level: parentNode.level + 1,
      ...coordinates,
      lodSelection,
      parentNode: {
        id: parentNode.id,
        href: `../${parentNode.id}`,
        mbs: parentNode.mbs,
        obb: parentNode.obb
      },
      children: [],
      neighbors: []
    };
    const node = transform(nodeData, nodeTemplate);

    if (nodeInPage.mesh) {
      node.geometryData = [{href: './geometries/0'}];
      node.sharedResource = {href: './shared'};

      if (texture) {
        node.textureData = [{href: './textures/0'}];
      }

      if (
        attributes &&
        attributes.length &&
        this.layers0.attributeStorageInfo &&
        this.layers0.attributeStorageInfo.length
      ) {
        node.attributeData = [];
        for (let index = 0; index < attributes.length; index++) {
          const folderName = this.layers0.attributeStorageInfo[index].key;
          node.attributeData.push({href: `./attributes/${folderName}/0`});
        }
      }
    }

    return node;
  }

  /**
   * Write node resources in files
   * @param {object} resources - source tile (3DTile)
   * @param {Uint8Array} resources.geometry - Uint8Array with geometry attributes
   * @param {Uint8Array} resources.compressedGeometry - Uint8Array with compressed (draco) geometry
   * @param {object} resources.texture - texture image
   * @param {object} resources.sharedResources - shared resource data object
   * @param {object} resources.attributes - feature attributes
   * @return {Promise<void>}
   */
  async _writeResources(
    {geometry: geometryBuffer, compressedGeometry, texture, sharedResources, attributes},
    nodePath
  ) {
    const childPath = join(this.layers0Path, 'nodes', nodePath);
    const slpkChildPath = join('nodes', nodePath);

    await this._writeGeometries(geometryBuffer, compressedGeometry, childPath, slpkChildPath);
    await this._writeShared(sharedResources, childPath, slpkChildPath, nodePath);
    await this._writeTexture(texture, childPath, slpkChildPath);
    await this._writeAttributes(attributes, childPath, slpkChildPath);
  }

  /**
   * Write non-compressed and compressed geometries in files
   * @param {Uint8Array} geometryBuffer - Uint8Array with geometry attributes
   * @param {Uint8Array} compressedGeometry - Uint8Array with compressed (draco) geometry
   * @param {string} childPath - a child path to write resources
   * @param {string} slpkChildPath - resource path inside *slpk file
   * @return {Promise<void>}
   */
  async _writeGeometries(geometryBuffer, compressedGeometry, childPath, slpkChildPath) {
    if (this.options.slpk) {
      const slpkGeometryPath = join(childPath, 'geometries');
      this.fileMap[`${slpkChildPath}/geometries/0.bin.gz`] = await writeFileForSlpk(
        slpkGeometryPath,
        geometryBuffer,
        '0.bin'
      );
    } else {
      const geometryPath = join(childPath, 'geometries/0/');
      await writeFile(geometryPath, geometryBuffer, 'index.bin');
    }

    if (this.options.draco) {
      if (this.options.slpk) {
        const slpkCompressedGeometryPath = join(childPath, 'geometries');
        this.fileMap[`${slpkChildPath}/geometries/1.bin.gz`] = await writeFileForSlpk(
          slpkCompressedGeometryPath,
          compressedGeometry,
          '1.bin'
        );
      } else {
        const compressedGeometryPath = join(childPath, 'geometries/1/');
        await writeFile(compressedGeometryPath, compressedGeometry, 'index.bin');
      }
    }
  }

  /**
   * Write shared resources in a file
   * @param {object} sharedResources - shared resource data object
   * @param {string} childPath - a child path to write resources
   * @param {string} slpkChildPath - resource path inside *slpk file
   * @param {Uint8Array} nodePath - a node path
   * @return {Promise<void>}
   */
  async _writeShared(sharedResources, childPath, slpkChildPath, nodePath) {
    sharedResources.nodePath = nodePath;
    const sharedData = transform(sharedResources, SHARED_RESOURCES_TEMPLATE);
    const sharedDataStr = JSON.stringify(sharedData);
    if (this.options.slpk) {
      const slpkSharedPath = join(childPath, 'shared');
      this.fileMap[`${slpkChildPath}/shared/sharedResource.json.gz`] = await writeFileForSlpk(
        slpkSharedPath,
        sharedDataStr,
        'sharedResource.json'
      );
    } else {
      const sharedPath = join(childPath, 'shared/');
      await writeFile(sharedPath, sharedDataStr);
    }
  }

  /**
   * Write the texture image in a file
   * @param {object} texture - the texture image
   * @param {string} childPath - a child path to write resources
   * @param {string} slpkChildPath - the resource path inside *slpk file
   * @return {Promise<void>}
   */
  async _writeTexture(texture, childPath, slpkChildPath) {
    if (texture) {
      const format = this._getFormatByMimeType(texture.mimeType);
      if (!this.layers0.textureSetDefinitions.length) {
        this.layers0.textureSetDefinitions.push({
          formats: [
            {
              name: '0',
              format
            }
          ]
        });
      }

      const textureData = texture.bufferView.data;
      if (this.options.slpk) {
        const slpkTexturePath = join(childPath, 'textures');
        const compress = false;
        this.fileMap[`${slpkChildPath}/textures/0.${format}`] = await writeFileForSlpk(
          slpkTexturePath,
          textureData,
          `0.${format}`,
          compress
        );
      } else {
        const texturePath = join(childPath, 'textures/0/');
        await writeFile(texturePath, textureData, `index.${format}`);
      }
    }
  }

  /**
   * Write feature attributes in files
   * @param {object} attributes - feature attributes
   * @param {string} childPath - a child path to write resources
   * @param {string} slpkChildPath - the resource path inside *slpk file
   * @return {Promise<void>}
   */
  async _writeAttributes(attributes, childPath, slpkChildPath) {
    if (
      attributes.length &&
      this.layers0.attributeStorageInfo &&
      this.layers0.attributeStorageInfo.length
    ) {
      for (let index = 0; index < attributes.length; index++) {
        const folderName = this.layers0.attributeStorageInfo[index].key;
        const fileBuffer = new Uint8Array(attributes[index]);

        if (this.options.slpk) {
          const slpkAttributesPath = join(childPath, 'attributes', folderName);
          this.fileMap[`${slpkChildPath}/attributes/${folderName}.bin.gz`] = await writeFileForSlpk(
            slpkAttributesPath,
            fileBuffer,
            '0.bin'
          );
        } else {
          const attributesPath = join(childPath, `attributes/${folderName}/0`);
          await writeFile(attributesPath, fileBuffer, 'index.bin');
        }
      }
    }
  }

  /**
   * Return file format by its MIME type
   * @param {string} mimeType - feature attributes
   * @return {string}
   */
  _getFormatByMimeType(mimeType) {
    switch (mimeType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      default:
        return 'jpg';
    }
  }

  /**
   * Find or create material in materialDefinitions array
   * @param material - end-to-end index of the node
   * @return material id
   */
  _findOrCreateMaterial(material) {
    const hash = md5(JSON.stringify(material));
    if (this.materialMap.has(hash)) {
      return this.materialMap.get(hash);
    }
    const newMaterialId = this.materialDefinitions.push(material) - 1;
    this.materialMap.set(hash, newMaterialId);
    return newMaterialId;
  }

  /**
   * Generate storage attribute for map segmentation.
   * @param {Number} attributeIndex - order index of attribute (f_0, f_1 ...).
   * @param {String} key - attribute key from batch table.\
   * @param {String} attributeType - attribute type.
   * @return {Object} Updated storageAttribute.
   */
  _createdStorageAttribute(attributeIndex, key, attributeType) {
    const storageAttribute = {
      key: `f_${attributeIndex}`,
      name: key,
      ordering: ['attributeValues'],
      header: [{property: 'count', valueType: 'UInt32'}],
      attributeValues: {valueType: 'Int32', valuesPerElement: 1}
    };

    switch (attributeType) {
      case OBJECT_ID_TYPE:
        this._setupIdAttribute(storageAttribute);
        break;
      case STRING_TYPE:
        this._setupStringAttribute(storageAttribute);
        break;
      case DOUBLE_TYPE:
        this._setupDoubleAttribute(storageAttribute);
        break;
      case SHORT_INT_TYPE:
        break;
      default:
        this._setupStringAttribute(storageAttribute);
    }

    return storageAttribute;
  }

  /**
   * Get the attribute type for attributeStorageInfo https://github.com/Esri/i3s-spec/blob/master/docs/1.7/attributeStorageInfo.cmn.md
   * @param {string} key - attribute's key
   * @param {string} attribute - attribute's type in batchTable
   * @return {string}
   */
  getAttributeType(key, attribute) {
    if (key === OBJECT_ID_TYPE) {
      return OBJECT_ID_TYPE;
    }
    if (typeof attribute === STRING_TYPE) {
      return STRING_TYPE;
    } else if (typeof attribute === 'number') {
      return Number.isInteger(attribute) ? SHORT_INT_TYPE : DOUBLE_TYPE;
    }
    return STRING_TYPE;
  }

  /**
   * Setup storage attribute as string.
   * @param {Object} storageAttribute - attribute for map segmentation.
   * @return {void}
   */
  _setupStringAttribute(storageAttribute) {
    storageAttribute.ordering.unshift('attributeByteCounts');
    storageAttribute.header.push({property: 'attributeValuesByteCount', valueType: 'UInt32'});
    storageAttribute.attributeValues = {
      valueType: 'String',
      encoding: 'UTF-8',
      valuesPerElement: 1
    };
    storageAttribute.attributeByteCounts = {
      valueType: 'UInt32',
      valuesPerElement: 1
    };
  }

  /**
   * Setup Id attribute for map segmentation.
   * @param {Object} storageAttribute - attribute for map segmentation .
   * @return {void}
   */
  _setupIdAttribute(storageAttribute) {
    storageAttribute.attributeValues = {
      valueType: 'Oid32',
      valuesPerElement: 1
    };
  }

  /**
   * Setup double attribute for map segmentation.
   * @param {Object} storageAttribute - attribute for map segmentation .
   * @return {void}
   */
  _setupDoubleAttribute(storageAttribute) {
    storageAttribute.attributeValues = {
      valueType: 'Float64',
      valuesPerElement: 1
    };
  }

  /**
   * Setup field attribute for map segmentation.
   * @param {String} key - attribute for map segmentation.
   * @param {String} fieldAttributeType - esri attribute type ('esriFieldTypeString' or 'esriFieldTypeOID').
   * @return {Object}
   */
  _createFieldAttribute(key, fieldAttributeType) {
    return {
      name: key,
      type: fieldAttributeType,
      alias: key
    };
  }

  /**
   * Do conversion of 3DTiles batch table to I3s node attributes.
   * @param {Object} batchTable - Table with layer meta data.
   * @return {void}
   */
  _convertBatchTableInfoToNodeAttributes(batchTable) {
    let attributeIndex = 0;
    const batchTableWithObjectId = {
      OBJECTID: [0],
      ...batchTable
    };

    for (const key in batchTableWithObjectId) {
      const firstAttribute = batchTableWithObjectId[key][0];
      const attributeType = this.getAttributeType(key, firstAttribute);

      const storageAttribute = this._createdStorageAttribute(attributeIndex, key, attributeType);
      const fieldAttributeType = this._getFieldAttributeType(attributeType);
      const fieldAttribute = this._createFieldAttribute(key, fieldAttributeType);
      const popupInfo = this._createPopupInfo(batchTableWithObjectId);

      this.layers0.attributeStorageInfo.push(storageAttribute);
      this.layers0.fields.push(fieldAttribute);
      this.layers0.popupInfo = popupInfo;
      this.layers0.layerType = _3D_OBJECT_LAYER_TYPE;

      attributeIndex += 1;
    }
  }

  /**
   * Find and return attribute type based on key form Batch table.
   * @param {String} attributeType
   * @return {String}
   */
  _getFieldAttributeType(attributeType) {
    switch (attributeType) {
      case OBJECT_ID_TYPE:
        return 'esriFieldTypeOID';
      case STRING_TYPE:
        return 'esriFieldTypeString';
      case SHORT_INT_TYPE:
        return 'esriFieldTypeInteger';
      case DOUBLE_TYPE:
        return 'esriFieldTypeDouble';
      default:
        return 'esriFieldTypeString';
    }
  }

  /**
   * Generate popup info to show metadata on the map.
   * @param {Object} batchTable - Batch table data with OBJECTID.
   * @return {Object} - data for correct rendering of popup.
   */
  _createPopupInfo(batchTable) {
    const title = '{OBJECTID}';
    const mediaInfos = [];
    const fieldInfos = [];
    const popupElements = [];
    const expressionInfos = [];

    for (const key in batchTable) {
      fieldInfos.push({
        fieldName: key,
        visible: true,
        isEditable: false,
        label: key
      });
    }
    popupElements.push({
      fieldInfos,
      type: 'fields'
    });

    return {
      title,
      mediaInfos,
      popupElements,
      fieldInfos,
      expressionInfos
    };
  }

  /**
   * Print statistics in the end of conversion
   * @param {object} params - output files data
   * @return {Promise<void>}
   */
  async _finishConversion(params) {
    const {tilesCount, tilesWithAddRefineCount} = this.refinementCounter;
    const addRefinementPercentage = tilesWithAddRefineCount
      ? (tilesWithAddRefineCount / tilesCount) * 100
      : 0;
    const filesSize = await calculateFilesSize(params);
    const diff = process.hrtime(this.conversionStartTime);
    const conversionTime = timeConverter(diff);
    console.log(`------------------------------------------------`); // eslint-disable-line no-undef, no-console
    console.log(`Finishing conversion of ${_3D_TILES}`); // eslint-disable-line no-undef, no-console
    console.log(`Total conversion time: ${conversionTime}`); // eslint-disable-line no-undef, no-console
    console.log(`Vertex count: `, this.vertexCounter); // eslint-disable-line no-undef, no-console
    console.log(`File(s) size: `, filesSize, ' bytes'); // eslint-disable-line no-undef, no-console
    console.log(`Percentage of tiles with "ADD" refinement type:`, addRefinementPercentage, '%'); // eslint-disable-line no-undef, no-console
    console.log(`------------------------------------------------`); // eslint-disable-line no-undef, no-console
  }

  /**
   * Fetch preload options for ION tileset
   * @return {Promise<Object>} - full set of options for tileset
   */
  async _fetchPreloadOptions() {
    const options = {
      'cesium-ion': {accessToken: this.options.token || ION_DEFAULT_TOKEN}
    };
    const preloadOptions = await CesiumIonLoader.preload(this.options.inputUrl, options);
    this.refreshTokenTime = process.hrtime();
    return {...options, ...preloadOptions};
  }

  /**
   * Update options of source tileset
   * @return {Promise<void>}
   */
  async _updateTilesetOptions() {
    const diff = process.hrtime(this.refreshTokenTime);
    if (diff[0] < REFRESH_TOKEN_TIMEOUT) {
      return;
    }
    this.refreshTokenTime = process.hrtime();

    const options = await this._fetchPreloadOptions();
    this.sourceTileset.options = {...this.sourceTileset.options, ...options};
    if (options.headers) {
      this.sourceTileset.fetchOptions.headers = options.headers;
      console.log('Authorization Bearer token has been updated'); // eslint-disable-line no-undef, no-console
    }
    if (options.token) {
      this.sourceTileset.fetchOptions.token = options.token;
    }
  }

  /** Do calculations of all tiles and tiles with "ADD" type of refinement.
   * @param {Object} tile
   * @return {void}
   */
  _checkAddRefinementTypeForTile(tile) {
    const ADD_TILE_REFINEMENT = 1;

    if (tile.refine === ADD_TILE_REFINEMENT) {
      this.refinementCounter.tilesWithAddRefineCount += 1;
      console.warn('This tile uses "ADD" type of refinement'); // eslint-disable-line
    }

    this.refinementCounter.tilesCount += 1;
  }
}
