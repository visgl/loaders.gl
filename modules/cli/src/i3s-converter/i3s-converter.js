import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader} from '@loaders.gl/3d-tiles';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import transform from 'json-map-transform';

import NodePages from './helpers/node-pages';
import writeFile from '../lib/utils/write-file';
import convertB3dmToI3sGeometry from './helpers/geometry-converter';
import {
  convertCommonToI3SCoordinate,
  convertCommonToI3SExtentCoordinate
} from './helpers/coordinate-converter';
import {createSceneServerPath} from './helpers/create-scene-server-path';

import {LAYERS as layersTemplate} from './json-templates/layers';
import {NODE as nodeTemplate} from './json-templates/node';
import {SHARED_RESOURCES_TEMPLATE} from './json-templates/shared-resources';

const ION_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_MAX_SCREEN_THRESHOLD_SQ = 196349.54374999998;
const HARDCODED_NODES_PER_PAGE = 64;

export default class I3SConverter {
  constructor() {
    this.nodePages = new NodePages(writeFile, HARDCODED_NODES_PER_PAGE);
    this.options = {};
    this.layers0Path = '';
  }

  // Convert a 3d tileset
  async convert({inputUrl, outputPath, tilesetName, maxDepth, draco}) {
    this.options = {maxDepth, draco};

    const options = {
      'cesium-ion': {accessToken: ION_TOKEN}
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

    await this._creationOfStructure(outputPath, tilesetName);

    return sourceTilesetJson;
  }

  // PRIVATE

  /* eslint-disable max-statements */
  async _creationOfStructure(outputPath, tilesetName) {
    const tilesetPath = join(`${outputPath}`, `${tilesetName}`);
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
      compressGeometry: this.options.draco
    };

    const layers0 = transform(layers0data, layersTemplate);
    await writeFile(this.layers0Path, JSON.stringify(layers0));
    createSceneServerPath(tilesetName, layers0, tilesetPath);

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
      lodThreshold: HARDCODED_MAX_SCREEN_THRESHOLD_SQ,
      obb: coordinates.obb,
      children: []
    });

    await this.sourceTileset._loadTile(sourceRootTile);
    if (sourceRootTile.content && sourceRootTile.content.type === 'b3dm') {
      root0.children.push({
        id: '1',
        href: './1',
        ...coordinates
      });
      const child = await this._createNode(root0, sourceRootTile, parentId, 0);
      const childPath = join(this.layers0Path, 'nodes', child.path);
      await writeFile(childPath, JSON.stringify(child));
    } else {
      await this._addChildrenWithNeighborsAndWriteFile(
        {rootNode: root0, sourceTiles: sourceRootTile.children},
        parentId,
        1
      );
      await sourceRootTile.unloadContent();
    }

    await writeFile(rootPath, JSON.stringify(root0));
    await this.nodePages.save(this.layers0Path);
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
      delete node.path;
      for (const neighbor of rootNode.children) {
        if (node.id === neighbor.id) {
          continue; // eslint-disable-line
        }

        node.neighbors.push({...neighbor});
      }

      await writeFile(childPath, JSON.stringify(node));
    }
  }

  async _createNode(rootTile, sourceTile, parentId, level) {
    const rootTileId = rootTile.id;
    const coordinates = convertCommonToI3SCoordinate(sourceTile);

    const nodeInPage = {
      lodThreshold: HARDCODED_MAX_SCREEN_THRESHOLD_SQ,
      obb: coordinates.obb,
      children: [],
      mesh: {
        material: {
          definition: 0
        },
        geometry: {
          definition: 0
        }
      }
    };
    const nodeId = this.nodePages.push(nodeInPage, parentId);

    const nodeData = {
      version: rootTile.version,
      id: nodeId.toString(),
      path: nodeId.toString(),
      level: rootTile.level + 1,
      ...coordinates,
      parentNode: {
        id: rootTileId,
        href: `../${rootTileId}`,
        mbs: rootTile.mbs,
        obb: rootTile.obb
      },
      geometryData: [
        {
          href: './geometries/0'
        }
      ],
      sharedResource: [
        {
          href: './shared/0'
        }
      ],
      children: [],
      neighbors: []
    };
    const node = transform(nodeData, nodeTemplate);
    await this._convertResources(sourceTile, node);

    await this._addChildrenWithNeighborsAndWriteFile(
      {rootNode: node, sourceTiles: sourceTile.children},
      nodeId,
      level + 1
    );
    return node;
  }

  async _convertResources(sourceTile, node) {
    await this.sourceTileset._loadTile(sourceTile);
    if (!sourceTile.content || sourceTile.content.type !== 'b3dm') {
      return;
    }
    const childPath = join(this.layers0Path, 'nodes', node.path);
    const {
      geometry: geometryBuffer,
      compressedGeometry,
      textures,
      sharedResources
    } = await convertB3dmToI3sGeometry(sourceTile.content, this.options);
    const geometryPath = join(childPath, 'geometries/0/');
    await writeFile(geometryPath, geometryBuffer, 'index.bin');
    if (this.options.draco) {
      const compressedGeometryPath = join(childPath, 'geometries/1/');
      await writeFile(compressedGeometryPath, compressedGeometry, 'index.bin');
    }
    const sharedPath = join(childPath, 'shared/0/');
    sharedResources.nodePath = node.path;
    const sharedData = transform(sharedResources, SHARED_RESOURCES_TEMPLATE);
    await writeFile(sharedPath, JSON.stringify(sharedData));
    if (textures) {
      node.textureData = [{href: './textures/0'}];
      const texturesPath = join(childPath, 'textures/0/');
      const texturesData = textures.bufferView.data;
      await writeFile(texturesPath, texturesData, 'index.jpeg');
    }
    sourceTile.unloadContent();
  }
}
