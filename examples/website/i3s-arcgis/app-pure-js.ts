import {loadArcGISModules} from '@deck.gl/arcgis';
import {Tile3DLayer} from '@deck.gl/geo-layers';
import {I3SLoader} from '@loaders.gl/i3s';

function flipY(texCoords) {
  for (let i = 0; i < texCoords.length; i += 2) {
    texCoords[i + 1] = 1 - texCoords[i + 1];
  }
}

function renderLayers(sceneView) {
  return [
    new Tile3DLayer({
      id: 'tile-3d-layer',
      // Tileset entry point: Indexed 3D layer file url
      data: 'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
      loader: I3SLoader,
      onTilesetLoad: (tileset) => {
        const {cartographicCenter} = tileset;
        const [longitude, latitude] = cartographicCenter;

        sceneView.goTo({center: [longitude, latitude]});
      },
      onTileLoad: (tile) => {
        if (tile.content.attributes.texCoords) {
          flipY(tile.content.attributes.texCoords.value);
        }
      }
    })
  ];
}

loadArcGISModules(['esri/Map', 'esri/views/SceneView', 'esri/views/3d/externalRenderers']).then(
  ({DeckRenderer, modules}) => {
    const [ArcGISMap, SceneView, externalRenderers] = modules;

    const sceneView = new SceneView({
      container: 'sceneViewDiv',
      qualityProfile: 'high',
      map: new ArcGISMap({
        basemap: 'dark-gray-vector'
      }),
      environment: {
        atmosphereEnabled: false
      },
      camera: {
        position: {x: -122, y: 37, z: 5000},
        heading: 180,
        tilt: 45
      },
      viewingMode: 'local'
    });

    const renderer = new DeckRenderer(sceneView, {});
    externalRenderers.add(sceneView, renderer);

    setInterval(() => {
      renderer.deck.layers = renderLayers(sceneView);
    }, 50);
  }
);
