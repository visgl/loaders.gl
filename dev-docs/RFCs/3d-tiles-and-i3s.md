# RFC: 3D Tiles and I3S Spec comparisons

Specs:

- [3D Tiles](https://github.com/CesiumGS/3d-tiles/tree/master/specification)
- [I3S](https://github.com/Esri/i3s-spec)

Common parts:

- Data organized as a tree
- Each data node
  - bounding volume
  - has a field to indicate sufficient for a certain view or not
  - containing positions / colors / normals / texture

tileset: .json metadata for the entire tileset
tile header: .json metadata for the tile
tile content: .bin geometries, textures

Tileset.json tileset - layers/0
tile-node file nodePages/0  
 node/0 - metadata
geometry file / texture file / feature file (optional)

|                   | 3D Tiles                                                                                                              | I3S                                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| tileset file      | [tileset.json](https://assets.cesium.com/43978/tileset.json) (token is required)                                      | [i3s layer](https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0) |
|                   |                                                                                                                       |                                                                                                                           |
| Tileset structure | asset // version                                                                                                      | "profile": "meshpyramids", // tileset type                                                                                |
|                   | geometricError //                                                                                                     | "rootNode": "./nodes/root", // relative url                                                                               |
|                   | root // hierarchy of the tileset, tileheader for each tile node                                                       | "version": "1.6",                                                                                                         |
|                   |                                                                                                                       | "obb/mbs/extend": [],// tileset boundary                                                                                  |
|                   |                                                                                                                       | "lodSelection": {                                                                                                         |
|                   |                                                                                                                       | "metricType": "maxScreenThreshold",                                                                                       |
|                   |                                                                                                                       | "maxError": 34.87550189480981                                                                                             |
|                   |                                                                                                                       | },                                                                                                                        |
|                   |                                                                                                                       | "defaultGeometrySchema": {} // how to parse content                                                                       |
|                   |                                                                                                                       |                                                                                                                           |
| tile files        | tile metadata is already specified in tileset.json                                                                    | each tile node has >4 files for the following info                                                                        |
|                   | tile content stored in a separate file                                                                                | - metadata                                                                                                                |
|                   |                                                                                                                       | - geometry                                                                                                                |
|                   |                                                                                                                       | - feature                                                                                                                 |
|                   |                                                                                                                       | - texture                                                                                                                 |
|                   |
| Key fields        | [geometricError](https://github.com/CesiumGS/3d-tiles/tree/master/specification#geometric-error) in meters            | [maxScreenThreshold](https://github.com/Esri/i3s-spec/blob/master/docs/1.7/lodSelection.cmn.md) in screenCoords           |
|                   | geometricError is a nonnegative number that defines the error, in meters, that determines if the tileset is rendered. | A per-node value for the maximum area of the projected bounding volume on screen in pixel screenSize(Bounding box)        |
|                   | At runtime, the geometric error is used to compute Screen-Space Error (SSE), the error measured in pixels.            |                                                                                                                           |
|                   |                                                                                                                       | Transform matrix (`I3SLoad` is not using it)                                                                              |
|                   | Transform matrix                                                                                                      |
|                   |                                                                                                                       |
|                   | refine                                                                                                                |
|                   | - Add - point cloud                                                                                                   |
|                   | - Replace - mesh                                                                                                      |
|                   |                                                                                                                       |
|                   | boundingBox,                                                                                                          | mbs is bounding box                                                                                                       |
|                   | boundingSphere,                                                                                                       | function traverseNodeTree(node) {                                                                                         |
|                   | region                                                                                                                | if (node mbs is not visible) {                                                                                            |
|                   |                                                                                                                       | // do nothing                                                                                                             |
|                   |                                                                                                                       |
|                   |                                                                                                                       | } else if (node has no children or viewport.screenSize(mbs)< node.maxScreenThreshold) {                                   |
|                   |                                                                                                                       | // render the node                                                                                                        |
|                   |                                                                                                                       |
|                   |                                                                                                                       | } else {                                                                                                                  |
|                   |                                                                                                                       | for each child in children(node)                                                                                          |
|                   |                                                                                                                       | TraverseNodeTree(child);                                                                                                  |
|                   |                                                                                                                       | }                                                                                                                         |
|                   |                                                                                                                       | }                                                                                                                         |
|                   |                                                                                                                       |
|                   |                                                                                                                       |
