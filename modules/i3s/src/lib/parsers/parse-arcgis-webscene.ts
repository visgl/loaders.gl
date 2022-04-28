import type {ArcGisWebSceneData, OperationalLayer} from '../../types';

const ARCGIS_SCENE_SERVER_LAYER_TYPE = 'ArcGISSceneServiceLayer';
const BUILDING_SCENE_LAYER = 'BuildingSceneLayer';
const INTEGRATED_MESH_LAYER = 'IntegratedMeshLayer';

/**
 * Supported layers list
 * Possible operational layers in WebScene: https://developers.arcgis.com/web-scene-specification/objects/operationalLayers/
 */
const SUPPORTED_LAYERS_TYPES = [
  ARCGIS_SCENE_SERVER_LAYER_TYPE,
  INTEGRATED_MESH_LAYER,
  BUILDING_SCENE_LAYER
];

/**
 * Parses ArcGIS WebScene
 * @param data
 * @param options
 * @param context
 */
export async function parseWebscene(data: ArrayBuffer): Promise<ArcGisWebSceneData> {
  const layer0 = JSON.parse(new TextDecoder().decode(data));
  const {operationalLayers} = layer0;

  return {
    header: layer0,
    layers: parseOperationalLayers(operationalLayers)
  };
}

/**
 * Recursively parses WebScene operational layers.
 * @param sublayers
 * @param url
 */
function parseOperationalLayers(layersList: OperationalLayer[]): OperationalLayer[] {
  let layers: OperationalLayer[] = [];

  for (let index = 0; index < layersList.length; index++) {
    const layer = layersList[index];

    if (SUPPORTED_LAYERS_TYPES.includes(layer.layerType)) {
      layers.push(layer);
    }

    if (layer.layers?.length) {
      layers = [...layers, ...parseOperationalLayers(layer.layers)];
    }
  }

  return layers;
}
