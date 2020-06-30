import { load } from "@loaders.gl/core";
import { Tileset3D, TILESET_TYPE } from "@loaders.gl/tiles";
import { CesiumIonLoader } from '@loaders.gl/3d-tiles';
import { Ellipsoid } from '@math.gl/geospatial';
import { Vector3 } from '@math.gl/core';
import { join } from "path";
import { promises, writeFile } from "fs";
import { v4 as uuidv4 } from 'uuid';

export default class Converter3dTilesToI3S {
    async convert(inputFile, outputPath, tilesetsName) {
        console.log("Start load 3dTiles");
        const tilesetJson = await load(inputFile, CesiumIonLoader);
        console.log(tilesetJson);
        const tilesets = new Tileset3D(tilesetJson);
        await tilesets.loadAllTiles();

        this._creationOfStructure(tilesets, outputPath, tilesetsName);

        console.log("Stop load 3dTiles");
        return tilesetJson;
    }

    _creationOfStructure(tileset, outputPath, tilesetName) {
        const layers0path = join(outputPath, tilesetName, "layers", "0");

        const layers0 = {
            version: `{${uuidv4().toUpperCase()}}`,
            id: 0,
            name: tilesetName,
            href: "./layers/0",
            layerType: "IntegratedMesh",
            spatialReference: {
                wkid: 4326,
                latestWkid: 4326,
                vcsWkid: 3855,
                latestVcsWkid: 3855
            },
            alias: "AllRegions",
            description: "AllRegions",
            capabilities: [
                "View",
                "Query"
            ],
            store: {
                id: `{${uuidv4().toUpperCase()}}`,
                profile: "meshpyramids",
                version: "1.7",
                resourcePattern: [
                    "3dNodeIndexDocument",
                    "Attributes",
                    "SharedResource",
                    "Geometry"
                ],
                rootNode: "./nodes/root",
                extent: [
                    -122.51473530281777,
                    37.70463582140094,
                    -122.35672838423584,
                    37.83262838041543
                ],
                indexCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
                vertexCRS: "http://www.opengis.net/def/crs/EPSG/0/4326",
                normalReferenceFrame: "east-north-up",
                attributeEncoding: "application/octet-stream; version=1.6",
                textureEncoding: [
                    "image/jpeg",
                ],
                lodType: "MeshPyramid",
                lodModel: "node-switching",
                defaultGeometrySchema: {
                    geometryType: "triangles",
                    header: [
                        {
                            property: "vertexCount",
                            type: "UInt32"
                        },
                        {
                            property: "featureCount",
                            type: "UInt32"
                        }
                    ],
                    topology: "PerAttributeArray",
                    ordering: [
                        "position",
                        "normal",
                        "uv0",
                        "color"
                    ],
                    vertexAttributes: {
                        position: {
                            valueType: "Float32",
                            valuesPerElement: 3
                        },
                        normal: {
                            valueType: "Float32",
                            valuesPerElement: 3
                        },
                        uv0: {
                            valueType: "Float32",
                            valuesPerElement: 2
                        },
                        color: {
                            valueType: "UInt8",
                            valuesPerElement: 4
                        }
                    },
                    featureAttributeOrder: [
                        "id",
                        "faceRange"
                    ],
                    featureAttributes: {
                        id: {
                            valueType: "UInt64",
                            valuesPerElement: 1
                        },
                        faceRange: {
                            valueType: "UInt32",
                            valuesPerElement: 2
                        }
                    }
                }
            },
            heightModelInfo: {
                heightModel: "orthometric",
                vertCRS: "WGS_84",
                heightUnit: "meter"
            },
            nodePages: {
                nodesPerPage: 64,
                lodSelectionMetricType: "maxScreenThresholdSQ"
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
                            name: "0",
                            format: "jpg"
                        },
                        {
                            name: "0_0_1",
                            format: "dds"
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
                                type: "Float32",
                                component: 3
                            },
                            normal: {
                                type: "Float32",
                                component: 3
                            },
                            uv0: {
                                type: "Float32",
                                component: 2
                            },
                            color: {
                                type: "UInt8",
                                component: 4
                            },
                            featureId: {
                                type: "UInt64",
                                component: 1,
                                binding: "per-feature"
                            },
                            faceRange: {
                                type: "UInt32",
                                component: 2,
                                binding: "per-feature"
                            }
                        },
                        {
                            compressedAttributes: {
                                encoding: "draco",
                                attributes: [
                                    "position",
                                    "normal",
                                    "uv0",
                                    "color",
                                    "feature-index"
                                ]
                            }
                        }
                    ]
                }
                // ...
            ]
        };

        this._writeFile(layers0path, JSON.stringify(layers0));
        const root = tileset.root;
        const rootPath = join(layers0path, "nodes", "root");
        const coordinates = this._getCoordinates(root);
        const root0 = {
            version: `{${uuidv4().toUpperCase()}}`,
            id: "root",
            level: 0,
            ...coordinates,
            lodSelection: [
                {
                    metricType: "maxScreenThresholdSQ",
                    maxError: 196349.54374999998
                },
                {
                    metricType: "maxScreenThreshold",
                    maxError: 499.99999999999994
                }
            ],
            children: []
        };

        this._addChildren({rootNode: root0, count: 0, tiles: root.children}, layers0path);
        this._writeFile(rootPath, JSON.stringify(root0));
    }

    _addChildren(data, layers0path) {
        const childNodes = [];
        for (const child of data.tiles) {
            if (child.type === "json") {
                this._addChildren({rootNode: data.rootNode, count: data.count, tiles: child.children}, layers0path);
            } else {
                const coordinates = this._getCoordinates(child);
                data.rootNode.children.push({
                    id: `${data.count}`,
                    href: `./${data.count}`,
                    ...coordinates
                });
                childNodes.push(this._createNode(data.rootNode, data.count, child, layers0path));
                data.count++;
            }
            console.log(data.count, child.id);
        }

        this._addNeighbors(data.rootNode, childNodes, layers0path);
    }

    _addNeighbors(rootNode, childNodes, layers0path) {
        for (const node of childNodes) {
            const childPath = join(layers0path, "nodes", node.path);
            delete node.path;
            for (const neighbor of rootNode.children) {
                if (node.id === neighbor.id) {
                    continue;
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
            this._writeFile(childPath, JSON.stringify(node));
        }
    }

    _getCoordinates(tile) {
        //TODO: from bounding-volume.js -> createSphere
        const center = tile.boundingVolume.center;
        const radius = tile.boundingVolume.radius;
        const uniformScale = Math.max(Math.max(center[0], center[1]), center[2]);
        const cartographicCenter = Ellipsoid.WGS84.cartesianToCartographic(center, new Vector3());
        return {
            mbs: [
                cartographicCenter[0],
                cartographicCenter[1],
                cartographicCenter[2],
                radius / uniformScale
            ],
            obb: {
                center: [
                    cartographicCenter[0],
                    cartographicCenter[1],
                    cartographicCenter[2]
                ],
                halfSize: [
                    33.609211,
                    42.7426872,
                    4.93590784
                ],
                quaternion: [
                    0.480679125,
                    -0.159757987,
                    -0.216719344,
                    0.834540367
                ]
            }
        };
    }

    _createNode(rootTile, count, tile, layers0path) {
        const rootTileId = rootTile.id;
        const path = rootTileId === "root" ? `${count}` : `${rootTile.path}/${count}`;
        const coordinates = this._getCoordinates(tile);

        const node = {
            version: rootTile.version,
            id: `${count}`,
            path,
            level: rootTile.level + 1,
            ...coordinates ,
            lodSelection: [
                {
                    metricType: "maxScreenThresholdSQ",
                    maxError: 785398.1749999999
                },
                {
                    metricType: "maxScreenThreshold",
                    maxError: 999.9999999999999
                }
            ],
            featureData: [{href: "./features/0"}],
            geometryData: [{href: "./geometries/0"}],
            textureData: [{href: "./textures/0"}, {href: "./textures/0_0_1"}],
            sharedResource: {href: "./shared"},
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
        this._addChildren({rootNode: node, count: 0, tiles: tile.children}, layers0path);
        return node;
    }

    async _writeFile(path, data) {
        await promises.mkdir(path, {recursive: true});
        const nodeFiles = join(path, "index.json");
        await writeFile(nodeFiles, data, (err) => {
            if (err) throw err;
            console.log(`${nodeFiles} saved.`);
        });
    }

}
