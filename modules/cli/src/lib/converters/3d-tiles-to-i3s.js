import {load} from '@loaders.gl/core';
import {Tileset3D} from '@loaders.gl/tiles';
import {CesiumIonLoader, convertB3dmToI3sGeometry} from '@loaders.gl/3d-tiles';
import {
  convertCommonToI3SCoordinate,
  convertCommonToI3SExtentCoordinate
} from './coordinate-converter';
import {join} from 'path';
import {promises, writeFile} from 'fs';
import {v4 as uuidv4} from 'uuid';
import process from 'process';

const ION_TOKEN =
  process.env.IonToken || // eslint-disable-line
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWMxMzcyYy0zZjJkLTQwODctODNlNi01MDRkZmMzMjIxOWIiLCJpZCI6OTYyMCwic2NvcGVzIjpbImFzbCIsImFzciIsImdjIl0sImlhdCI6MTU2Mjg2NjI3M30.1FNiClUyk00YH_nWfSGpiQAjR5V2OvREDq1PJ5QMjWQ'; // eslint-disable-line

export default class Converter3dTilesToI3S {
  async convert(inputFile, outputPath, tilesetsName) {
    console.log('Start load 3dTiles'); // eslint-disable-line
    const options = {
      'cesium-ion': {accessToken: ION_TOKEN}
    };
    const preloadOptions = await CesiumIonLoader.preload(inputFile, options);
    Object.assign(options, preloadOptions);
    const tilesetJson = await load(inputFile, CesiumIonLoader, options);
    console.log(tilesetJson); // eslint-disable-line
    const tilesets = new Tileset3D(tilesetJson, options);
    await tilesets.loadAllTiles();

    await this._creationOfStructure(tilesets, outputPath, tilesetsName);

    console.log('Stop load 3dTiles'); // eslint-disable-line
    return tilesetJson;
  }

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
        nodesPerPage: 64,
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

    await this._writeFile(layers0path, JSON.stringify(layers0));
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
          maxError: 196349.54374999998
        },
        {
          metricType: 'maxScreenThreshold',
          maxError: 499.99999999999994
        }
      ],
      children: [],
      geometryData: undefined,
      textureData: undefined
    };

    await this._addChildren({rootNode: root0, count: 0, tiles: root.children}, layers0path);
    if (root.content && root.content.type === 'b3dm') {
      root0.geometryData = [{href: './geometries/0'}];
      const {geometry: geometryBuffer, textures} = convertB3dmToI3sGeometry(root.content);
      const geometryPath = join(rootPath, 'geometries/0/');
      await this._writeFile(geometryPath, geometryBuffer, 'index.bin');
      if (textures) {
        root0.textureData = [{href: './textures/0'}];
        const texturesPath = join(rootPath, 'textures/0/');
        const texturesData = textures.bufferView.data;
        await this._writeFile(texturesPath, texturesData, 'index.jpeg');
      }
    }
    await this._writeFile(rootPath, JSON.stringify(root0));
  }

  async _addChildren(data, layers0path) {
    const childNodes = [];
    for (const child of data.tiles) {
      if (child.type === 'json') {
        await this._addChildren(
          {rootNode: data.rootNode, count: data.count, tiles: child.children},
          layers0path
        );
      } else {
        const coordinates = convertCommonToI3SCoordinate(child);
        data.rootNode.children.push({
          id: data.rootNode.id === 'root' ? `${data.count}` : `${data.rootNode.id}-${data.count}`,
          href: `./${data.count}`,
          ...coordinates
        });
        childNodes.push(await this._createNode(data.rootNode, data.count, child, layers0path));
        data.count++;
      }
      console.log(data.count, child.id); // eslint-disable-line
    }

    await this._addNeighbors(data.rootNode, childNodes, layers0path);
  }

  async _addNeighbors(rootNode, childNodes, layers0path) {
    for (const nodeObject of childNodes) {
      const {node, sourceTile} = nodeObject;
      const childPath = join(layers0path, 'nodes', node.path);
      delete node.path;
      for (const neighbor of rootNode.children) {
        if (node.id === neighbor.id) {
          continue; // eslint-disable-line
        }
        if (node.neighbors === null) {
          node.neighbors = [];
        }

        node.neighbors.push({
          id: neighbor.id,
          href: `../${neighbor.id}`,
          mbs: neighbor.mbs,
          obb: neighbor.obb
        });
      }

      if (sourceTile.content && sourceTile.content.type === 'b3dm') {
        const {geometry: geometryBuffer, textures} = convertB3dmToI3sGeometry(sourceTile.content);
        const geometryPath = join(childPath, 'geometries/0/');
        await this._writeFile(geometryPath, geometryBuffer, 'index.bin');
        if (textures) {
          node.textureData = [{href: './textures/0'}];
          const texturesPath = join(childPath, 'textures/0/');
          const texturesData = textures.bufferView.data;
          await this._writeFile(texturesPath, texturesData, 'index.jpeg');
        }
      }

      await this._writeFile(childPath, JSON.stringify(node));
    }
  }

  async _createNode(rootTile, count, tile, layers0path) {
    const rootTileId = rootTile.id;
    const path = rootTileId === 'root' ? `${count}` : `${rootTile.path}-${count}`;
    const coordinates = convertCommonToI3SCoordinate(tile);

    const node = {
      version: rootTile.version,
      id: path,
      path,
      level: rootTile.level + 1,
      ...coordinates,
      lodSelection: [
        {
          metricType: 'maxScreenThresholdSQ',
          maxError: 785398.1749999999
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
      neighbors: null,
      children: []
    };
    await this._addChildren({rootNode: node, count: 0, tiles: tile.children}, layers0path);
    return {
      node,
      sourceTile: tile
    };
  }

  async _writeFile(path, data, fileName = 'index.json') {
    await promises.mkdir(path, {recursive: true});
    const nodeFiles = join(path, fileName);
    await writeFile(nodeFiles, data, err => {
      if (err) throw err;
      console.log(`${nodeFiles} saved.`); // eslint-disable-line
    });
  }
}
