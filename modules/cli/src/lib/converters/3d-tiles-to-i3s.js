import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader, convertB3dmToI3sGeometry} from '@loaders.gl/3d-tiles';
import {
  convertCommonToI3SCoordinate,
  convertCommonToI3SExtentCoordinate
} from './coordinate-converter';
import {join} from 'path';
import {v4 as uuidv4} from 'uuid';
import process from 'process';
import NodePages from './node-pages';
import writeFile from './helpers/write-file';

const ION_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line
const HARDCODED_MAX_SCREEN_THRESHOLD_SQ = 196349.54374999998;
const HARDCODED_NODES_PER_PAGE = 64;

export default class Converter3dTilesToI3S {
  constructor() {
    this.nodePages = new NodePages(HARDCODED_NODES_PER_PAGE);
  }

  async convert(inputFile, outputPath, tilesetsName, maxDepth) {
    console.log('Start load 3dTiles'); // eslint-disable-line
    const options = {
      'cesium-ion': {accessToken: ION_TOKEN}
    };
    const preloadOptions = await CesiumIonLoader.preload(inputFile, options);
    Object.assign(options, preloadOptions);
    const tilesetJson = await load(inputFile, CesiumIonLoader, options);
    console.log(tilesetJson); // eslint-disable-line
    const tilesets = new Tileset3D(tilesetJson, options);
    await tilesets.loadAllTiles(maxDepth);

    await this._creationOfStructure(tilesets, outputPath, tilesetsName);

    console.log('Stop load 3dTiles'); // eslint-disable-line
    return tilesetJson;
  }

  /* eslint-disable max-statements */
  async _creationOfStructure(tileset, outputPath, tilesetName) {
    const layers0path = join(`${outputPath}`, `${tilesetName}`, 'layers', '0');
    const extent = convertCommonToI3SExtentCoordinate(tileset);

    const layers0 = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 0,
      name: tilesetName,
      href: './layers/0',
      layerType: 'IntegratedMesh',
      spatialReference: {
        wkid: 4326,
        latestWkid: 4326,
        vcsWkid: 3855,
        latestVcsWkid: 3855
      },
      alias: 'AllRegions',
      description: 'AllRegions',
      capabilities: ['View', 'Query'],
      store: {
        id: `{${uuidv4().toUpperCase()}}`,
        profile: 'meshpyramids',
        version: '1.7',
        resourcePattern: ['3dNodeIndexDocument', 'Attributes', 'SharedResource', 'Geometry'],
        rootNode: './nodes/root',
        extent,
        indexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
        vertexCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
        normalReferenceFrame: 'east-north-up',
        attributeEncoding: 'application/octet-stream; version=1.6',
        textureEncoding: ['image/jpeg'],
        lodType: 'MeshPyramid',
        lodModel: 'node-switching',
        defaultGeometrySchema: {
          geometryType: 'triangles',
          header: [
            {
              property: 'vertexCount',
              type: 'UInt32'
            },
            {
              property: 'featureCount',
              type: 'UInt32'
            }
          ],
          topology: 'PerAttributeArray',
          ordering: ['position', 'normal', 'uv0', 'color'],
          vertexAttributes: {
            position: {
              valueType: 'Float32',
              valuesPerElement: 3
            },
            normal: {
              valueType: 'Float32',
              valuesPerElement: 3
            },
            uv0: {
              valueType: 'Float32',
              valuesPerElement: 2
            },
            color: {
              valueType: 'UInt8',
              valuesPerElement: 4
            }
          },
          featureAttributeOrder: ['id', 'faceRange'],
          featureAttributes: {
            id: {
              valueType: 'UInt64',
              valuesPerElement: 1
            },
            faceRange: {
              valueType: 'UInt32',
              valuesPerElement: 2
            }
          }
        }
      },
      heightModelInfo: {
        heightModel: 'orthometric',
        vertCRS: 'WGS_84',
        heightUnit: 'meter'
      },
      nodePages: {
        nodesPerPage: HARDCODED_NODES_PER_PAGE,
        lodSelectionMetricType: 'maxScreenThresholdSQ'
      },
      materialDefinitions: [
        {
          doubleSided: true,
          pbrMetallicRoughness: {
            baseColorTexture: {
              textureSetDefinitionId: 0
            },
            metallicFactor: 0
          }
        }
      ],
      textureSetDefinitions: [
        {
          formats: [
            {
              name: '0',
              format: 'jpg'
            },
            {
              name: '0_0_1',
              format: 'dds'
            }
          ]
        }
      ],
      geometryDefinitions: [
        {
          geometryBuffers: [
            {
              offset: 8,
              position: {
                type: 'Float32',
                component: 3
              },
              normal: {
                type: 'Float32',
                component: 3
              },
              uv0: {
                type: 'Float32',
                component: 2
              },
              color: {
                type: 'UInt8',
                component: 4
              },
              featureId: {
                type: 'UInt64',
                component: 1,
                binding: 'per-feature'
              },
              faceRange: {
                type: 'UInt32',
                component: 2,
                binding: 'per-feature'
              }
            },
            {
              compressedAttributes: {
                encoding: 'draco',
                attributes: ['position', 'normal', 'uv0', 'color', 'feature-index']
              }
            }
          ]
        }
        // ...
      ]
    };

    await writeFile(layers0path, JSON.stringify(layers0));
    const root = tileset.root;
    const rootPath = join(layers0path, 'nodes', 'root');
    const coordinates = convertCommonToI3SCoordinate(root);
    const root0 = {
      version: `{${uuidv4().toUpperCase()}}`,
      id: 'root',
      level: 0,
      ...coordinates,
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
      children: []
    };

    const parentId = this.nodePages.push({
      lodThreshold: HARDCODED_MAX_SCREEN_THRESHOLD_SQ,
      obb: coordinates.obb,
      children: []
    });

    if (root.content && root.content.type === 'b3dm') {
      root0.children.push({
        id: '1',
        href: './1',
        ...coordinates
      });
      const node = await this._createNode(root0, root, layers0path, parentId);
      const childPath = join(layers0path, 'nodes', node.path);
      node.geometryData = [{href: './geometries/0'}];
      const {geometry: geometryBuffer, textures} = convertB3dmToI3sGeometry(root.content);
      const geometryPath = join(childPath, 'geometries/0/');
      await writeFile(geometryPath, geometryBuffer, 'index.bin');

      if (textures) {
        node.textureData = [{href: './textures/0'}];
        const texturesPath = join(childPath, 'textures/0/');
        const texturesData = textures.bufferView.data;
        await writeFile(texturesPath, texturesData, 'index.jpeg');
      }

      await writeFile(childPath, JSON.stringify(node));
    } else {
      await this._addChildren({rootNode: root0, tiles: root.children}, layers0path, parentId);
    }

    await writeFile(rootPath, JSON.stringify(root0));
    await this.nodePages.save(layers0path);
  }
  /* eslint-enable max-statements */

  async _addChildren(data, layers0path, parentId) {
    const childNodes = [];
    for (const child of data.tiles) {
      if (child.type === 'json') {
        await this._addChildren(
          {rootNode: data.rootNode, tiles: child.children},
          layers0path,
          parentId
        );
      } else {
        const coordinates = convertCommonToI3SCoordinate(child);
        const newChild = await this._createNode(data.rootNode, child, layers0path, parentId);
        data.rootNode.children.push({
          id: newChild.id,
          href: `../${newChild.path}`,
          ...coordinates
        });
        childNodes.push(newChild);
      }
      console.log(child.id); // eslint-disable-line
    }

    await this._addNeighbors(data.rootNode, childNodes, layers0path);
  }

  async _addNeighbors(rootNode, childNodes, layers0path) {
    for (const node of childNodes) {
      const childPath = join(layers0path, 'nodes', node.path);
      delete node.path;
      for (const neighbor of rootNode.children) {
        if (node.id === neighbor.id) {
          continue; // eslint-disable-line
        }

        node.neighbors.push({
          id: neighbor.id,
          href: `../${neighbor.id}`,
          mbs: neighbor.mbs,
          obb: neighbor.obb
        });
      }

      await writeFile(childPath, JSON.stringify(node));
    }
  }

  async _createNode(rootTile, tile, layers0path, parentId) {
    const rootTileId = rootTile.id;
    const coordinates = convertCommonToI3SCoordinate(tile);

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

    const node = {
      version: rootTile.version,
      id: nodeId.toString(),
      path: nodeId.toString(),
      level: rootTile.level + 1,
      ...coordinates,
      lodSelection: [
        {
          metricType: 'maxScreenThresholdSQ',
          maxError: HARDCODED_MAX_SCREEN_THRESHOLD_SQ
        },
        {
          metricType: 'maxScreenThreshold',
          maxError: 999.9999999999999
        }
      ],
      featureData: [{href: './features/0'}],
      geometryData: [{href: './geometries/0'}],
      textureData: undefined,
      sharedResource: {href: './shared'},
      parentNode: {
        id: rootTileId,
        href: `../${rootTileId}`,
        mbs: rootTile.mbs,
        obb: rootTile.obb
      },
      features: null,
      neighbors: [],
      children: []
    };

    if (tile.content && tile.content.type === 'b3dm') {
      const childPath = join(layers0path, 'nodes', node.path);
      const {geometry: geometryBuffer, textures} = convertB3dmToI3sGeometry(tile.content);
      const geometryPath = join(childPath, 'geometries/0/');
      await writeFile(geometryPath, geometryBuffer, 'index.bin');
      if (textures) {
        node.textureData = [{href: './textures/0'}];
        const texturesPath = join(childPath, 'textures/0/');
        const texturesData = textures.bufferView.data;
        await writeFile(texturesPath, texturesData, 'index.jpeg');
      }
    }

    await this._addChildren({rootNode: node, tiles: tile.children}, layers0path, nodeId);
    return node;
  }
}
