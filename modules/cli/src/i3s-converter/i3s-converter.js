import {load, setLoaderOptions} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';
import md5 from 'md5';
import {promises as fs} from 'fs';
import draco3d from 'draco3d';

import NodePages from './helpers/node-pages';
import {writeFile, removeDir, writeFileForSlpk} from '../lib/utils/file-utils';
import {
  compressWithChildProcess,
  generateHash128FromZip,
  addFileToZip
} from '../lib/utils/compress-util';
import convertB3dmToI3sGeometry from './helpers/geometry-converter';
import {
  convertCommonToI3SCoordinate,
  convertCommonToI3SExtentCoordinate
} from './helpers/coordinate-converter';
import {createSceneServerPath} from './helpers/create-scene-server-path';
import {convertScreenSpaceErrorToScreenThreshold} from '../lib/utils/lod-conversion-utils';

import {LAYERS as layersTemplate} from './json-templates/layers';
import {NODE as nodeTemplate} from './json-templates/node';
import {SHARED_RESOURCES_TEMPLATE} from './json-templates/shared-resources';

const ION_DEFAULT_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_NODES_PER_PAGE = 64;
const _3D_TILES = '3DTILES';

// Bind draco3d to avoid dynamic loading
// Converter bundle has incorrect links when using dynamic loading
setLoaderOptions({
  modules: {
    draco3d
  }
});

export default class I3SConverter {
  constructor() {
    this.nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE);
    this.fileMap = {};
    this.options = {};
    this.layers0Path = '';
    this.materialMap = new Map();
    this.materialDefinitions = [];
    this.vertexCounter = 0;
  }

  // Convert a 3d tileset
  async convert({inputUrl, outputPath, tilesetName, maxDepth, slpk, sevenZipExe, token}) {
    this.conversionStartTime = process.hrtime();
    this.options = {maxDepth, slpk, sevenZipExe};

    if (slpk) {
      this.nodePages.useWriteFunction(writeFileForSlpk);
    }

    const options = {
      'cesium-ion': {accessToken: token || ION_DEFAULT_TOKEN}
    };
    const preloadOptions = await CesiumIonLoader.preload(inputUrl, options);
    Object.assign(options, preloadOptions);
    const sourceTilesetJson = await load(inputUrl, CesiumIonLoader, options);

    /* TODO/ib - get rid of confusing options warnings, move into options sub-object */
    // const tilesetJson = await load(inputUrl, CesiumIonLoader, {
    //   'cesium-ion': preloadOptions
    // });
    // console.log(tilesetJson); // eslint-disable-line
    this.sourceTileset = new Tileset3D(sourceTilesetJson, options);

    await this._createAndSaveTileset(outputPath, tilesetName);
    await this._finishConversion({slpk, outputPath, tilesetName});
    return sourceTilesetJson;
  }

  // PRIVATE
  /* eslint-disable max-statements */
  async _createAndSaveTileset(outputPath, tilesetName) {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);
    // Removing the tilesetPath needed to exclude erroneous files after conversion
    try {
      await removeDir(tilesetPath);
    } catch (e) {
      // do nothing
    }

    this.layers0Path = join(tilesetPath, 'SceneServer', 'layers', '0');
    const extent = convertCommonToI3SExtentCoordinate(this.sourceTileset);

    const layers0data = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 0,
      name: tilesetName,
      href: './layers/0',
      layerType: 'IntegratedMesh',
      store: {
        id: `{${uuidv4().toUpperCase()}}`,
        extent
      },
      nodePages: {
        nodesPerPage: HARDCODED_NODES_PER_PAGE
      },
      compressGeometry: true
    };

    const layers0 = transform(layers0data, layersTemplate);
    this.materialDefinitions = [];
    this.materialMap = new Map();

    const sourceRootTile = this.sourceTileset.root;
    const rootPath = join(this.layers0Path, 'nodes', 'root');
    const coordinates = convertCommonToI3SCoordinate(sourceRootTile);
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
    const root0 = transform(root0data, nodeTemplate);

    const parentId = this.nodePages.push({
      lodThreshold: 0,
      obb: coordinates.obb,
      children: []
    });

    const isCreateSlpk = this.options.slpk;
    await this.sourceTileset._loadTile(sourceRootTile);
    if (sourceRootTile.content && sourceRootTile.content.type === 'b3dm') {
      root0.children.push({
        id: '1',
        href: './1',
        ...coordinates
      });
      const child = await this._createNode(root0, sourceRootTile, parentId, 0);
      const childPath = join(this.layers0Path, 'nodes', child.path);

      if (isCreateSlpk) {
        this.fileMap['nodes/1/3dNodeIndexDocument.json.gz'] = await writeFileForSlpk(
          childPath,
          JSON.stringify(child),
          '3dNodeIndexDocument.json'
        );
      } else {
        await writeFile(childPath, JSON.stringify(child));
      }
    } else {
      await this._addChildrenWithNeighborsAndWriteFile(
        {rootNode: root0, sourceTiles: sourceRootTile.children},
        parentId,
        1
      );
      await sourceRootTile.unloadContent();
    }

    layers0.materialDefinitions = this.materialDefinitions;
    if (isCreateSlpk) {
      this.fileMap['3dSceneLayer.json.gz'] = await writeFileForSlpk(
        this.layers0Path,
        JSON.stringify(layers0),
        '3dSceneLayer.json'
      );
    } else {
      await writeFile(this.layers0Path, JSON.stringify(layers0));
    }
    createSceneServerPath(tilesetName, layers0, tilesetPath);

    if (isCreateSlpk) {
      this.fileMap['nodes/root/3dNodeIndexDocument.json.gz'] = await writeFileForSlpk(
        rootPath,
        JSON.stringify(root0),
        '3dNodeIndexDocument.json'
      );
    } else {
      await writeFile(rootPath, JSON.stringify(root0));
    }
    await this.nodePages.save(this.layers0Path, this.fileMap, isCreateSlpk);
    if (isCreateSlpk) {
      const slpkTilesetPath = join(tilesetPath, 'SceneServer', 'layers', '0');
      const slpkFileName = `${tilesetPath}.slpk`;
      await compressWithChildProcess(
        slpkTilesetPath,
        slpkFileName,
        0,
        '.',
        this.options.sevenZipExe
      );
      const fileHash128Path = `${tilesetPath}/@specialIndexFileHASH128@`;
      await generateHash128FromZip(slpkFileName, fileHash128Path);
      await addFileToZip(
        tilesetPath,
        '@specialIndexFileHASH128@',
        slpkFileName,
        this.options.sevenZipExe
      );
      // All converted files are contained in slpk now they can be deleted
      try {
        await removeDir(tilesetPath);
      } catch (e) {
        // do nothing
      }
    }
  }
  /* eslint-enable max-statements */

  async _addChildrenWithNeighborsAndWriteFile(data, parentId, level) {
    const childNodes = [];
    await this._addChildren({...data, childNodes}, parentId, level);
    await this._addNeighborsAndWriteFile(data.rootNode, childNodes);
  }

  async _addChildren(data, parentId, level) {
    if (this.options.maxDepth && level > this.options.maxDepth) {
      return;
    }
    const childNodes = data.childNodes;
    for (const sourceTile of data.sourceTiles) {
      if (sourceTile.type === 'json') {
        await this.sourceTileset._loadTile(sourceTile);
        await this._addChildren(
          {rootNode: data.rootNode, sourceTiles: sourceTile.children, childNodes},
          parentId,
          level + 1
        );
        await sourceTile.unloadContent();
      } else {
        const coordinates = convertCommonToI3SCoordinate(sourceTile);
        const child = await this._createNode(data.rootNode, sourceTile, parentId, level);
        data.rootNode.children.push({
          id: child.id,
          href: `../${child.path}`,
          ...coordinates
        });
        childNodes.push(child);
      }
      console.log(sourceTile.id); // eslint-disable-line
    }
  }

  async _addNeighborsAndWriteFile(rootNode, childNodes) {
    for (const node of childNodes) {
      const childPath = join(this.layers0Path, 'nodes', node.path);
      const nodePath = node.path;
      delete node.path;
      for (const neighbor of rootNode.children) {
        if (node.id === neighbor.id) {
          continue; // eslint-disable-line
        }

        node.neighbors.push({...neighbor});
      }

      if (this.options.slpk) {
        this.fileMap[`nodes/${nodePath}/3dNodeIndexDocument.json.gz`] = await writeFileForSlpk(
          childPath,
          JSON.stringify(node),
          '3dNodeIndexDocument.json'
        );
      } else {
        await writeFile(childPath, JSON.stringify(node));
      }
    }
  }

  async _createNode(rootTile, sourceTile, parentId, level) {
    await this.sourceTileset._loadTile(sourceTile);
    const rootTileId = rootTile.id;
    const coordinates = convertCommonToI3SCoordinate(sourceTile);

    const lodSelection = convertScreenSpaceErrorToScreenThreshold(sourceTile, coordinates);
    const maxScreenThresholdSQ = lodSelection.find(
      val => val.metricType === 'maxScreenThresholdSQ'
    ) || {maxError: 0};

    const nodeInPage = {
      lodThreshold: maxScreenThresholdSQ.maxError,
      obb: coordinates.obb,
      children: []
    };
    if (sourceTile.content && sourceTile.content.type === 'b3dm') {
      nodeInPage.mesh = {
        geometry: {
          definition: 0
        }
      };
    }
    const nodeId = this.nodePages.push(nodeInPage, parentId);

    const nodeData = {
      version: rootTile.version,
      id: nodeId.toString(),
      path: nodeId.toString(),
      level: rootTile.level + 1,
      ...coordinates,
      lodSelection,
      parentNode: {
        id: rootTileId,
        href: `../${rootTileId}`,
        mbs: rootTile.mbs,
        obb: rootTile.obb
      },
      children: [],
      neighbors: []
    };
    const node = transform(nodeData, nodeTemplate);
    await this._convertResources(sourceTile, node);
    sourceTile.unloadContent();

    await this._addChildrenWithNeighborsAndWriteFile(
      {rootNode: node, sourceTiles: sourceTile.children},
      nodeId,
      level + 1
    );
    return node;
  }

  /* eslint-disable max-statements, complexity*/
  async _convertResources(sourceTile, node) {
    if (!sourceTile.content || sourceTile.content.type !== 'b3dm') {
      return;
    }
    node.geometryData = [{href: './geometries/0'}];
    node.sharedResource = [{href: './shared'}];
    const childPath = join(this.layers0Path, 'nodes', node.path);
    const slpkChildPath = join('nodes', node.path);
    const {
      geometry: geometryBuffer,
      compressedGeometry,
      texture,
      sharedResources,
      meshMaterial,
      vertexCount
    } = await convertB3dmToI3sGeometry(sourceTile.content, Number(node.id));
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

    sharedResources.nodePath = node.path;
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
    if (texture) {
      node.textureData = [{href: './textures/0'}];
      const textureData = texture.bufferView.data;
      if (this.options.slpk) {
        const slpkTexturePath = join(childPath, 'textures');
        const compress = false;
        this.fileMap[`${slpkChildPath}/textures/0.jpeg`] = await writeFileForSlpk(
          slpkTexturePath,
          textureData,
          '0.jpeg',
          compress
        );
      } else {
        const texturePath = join(childPath, 'textures/0/');
        await writeFile(texturePath, textureData, 'index.jpeg');
      }
    }
    if (meshMaterial) {
      this.nodePages.updateMaterialByNodeId(node.id, this._findOrCreateMaterial(meshMaterial));
    }
    if (vertexCount) {
      this.vertexCounter += vertexCount;
      this.nodePages.updateVertexCountByNodeId(node.id, vertexCount);
    }
  }

  /**
   * Find or create material in materialDefinitions array
   * @param material - end-to-end index of the node
   * @return material id
   */
  _findOrCreateMaterial(material) {
    const hash = md5(Object.entries(material).toString());
    if (this.materialMap.has(hash)) {
      return this.materialMap.get(hash);
    }
    const newMaterialId = this.materialDefinitions.push(material) - 1;
    this.materialMap.set(hash, newMaterialId);
    return newMaterialId;
  }

  async _finishConversion(params) {
    const filesSize = await this._calculateFilesSize(params);
    const diff = process.hrtime(this.conversionStartTime);
    const conversionTime = this._timeConverter(diff);
    console.log(`------------------------------------------------`); // eslint-disable-line
    console.log(`Finishing conversion of ${_3D_TILES}`); // eslint-disable-line
    console.log(`Total conversion time: ${conversionTime}`); // eslint-disable-line
    console.log(`Vertex count: `, this.vertexCounter); // eslint-disable-line
    console.log(`File(s) size: `, filesSize, ' bytes'); // eslint-disable-line
    console.log(`------------------------------------------------`); // eslint-disable-line
  }

  _timeConverter(time) {
    const timeInSecons = time[0];
    const hours = Math.floor(timeInSecons / 60 / 60);
    const minutes = Math.floor(timeInSecons / 60) % 60;
    const seconds = Math.floor(timeInSecons - minutes * 60);
    const milliseconds = time[1];
    let result = '';

    if (hours) {
      result += `${hours}h `;
    }
    if (minutes) {
      result += `${minutes}m `;
    }

    if (seconds) {
      result += `${seconds}s`;
    }

    if (!result) {
      result += `${milliseconds}ms`;
    }

    return result;
  }

  async _calculateFilesSize(params) {
    const {slpk, outputPath, tilesetName} = params;

    if (slpk) {
      const slpkPath = join(process.cwd(), outputPath, `${tilesetName}.slpk`);
      const stat = await fs.stat(slpkPath);
      return stat.size;
    }
    const directoryPath = join(process.cwd(), outputPath, tilesetName);
    const totalSize = await this._getTotalFilesSize(directoryPath);
    return totalSize;
  }

  async _getTotalFilesSize(dirPath) {
    let totalFileSize = 0;

    const files = await fs.readdir(dirPath);

    for (const file of files) {
      const fileStat = await fs.stat(join(dirPath, file));
      if (fileStat.isDirectory()) {
        totalFileSize += await this._getTotalFilesSize(join(dirPath, file));
      } else {
        totalFileSize += fileStat.size;
      }
    }
    return totalFileSize;
  }
}
