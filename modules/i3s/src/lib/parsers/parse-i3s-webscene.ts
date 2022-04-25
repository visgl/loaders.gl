import type {I3SWebScene, I3SWebSceneOperationalLayer} from '../../types';

const ARCGIS_SCENE_SERVER_LAYER_TYPE = 'ArcGISSceneServiceLayer';

/**
 * Parses I3S WebScene and creates tileset
 * @param data
 * @param options
 * @param context
 */
export async function parseI3SWebscene(data: ArrayBuffer, url: string): Promise<I3SWebScene> {
  const layer0 = JSON.parse(new TextDecoder().decode(data));
  const {operationalLayers} = layer0;

  return {
    header: layer0,
    layers: parseOperationalLayers(operationalLayers)
  };
}

/**
 * Recursively parses WebScene Layer operational layers.
 * @param sublayers
 * @param url
 */
function parseOperationalLayers(
  layersList: I3SWebSceneOperationalLayer[]
): I3SWebSceneOperationalLayer[] {
  let layers: I3SWebSceneOperationalLayer[] = [];

  for (let index = 0; index < layersList.length; index++) {
    const layer = layersList[index];
    // Add support only for scene service layer for now.
    // TODO Add ArcGISFeatureLayer support.
    // For now it has different url structure which is not supported yet.
    if (layer.layerType === ARCGIS_SCENE_SERVER_LAYER_TYPE) {
      layers.push(layer);
    }

    if (layer.layers?.length) {
      layers = [...layers, ...parseOperationalLayers(layer.layers)];
    }
  }

  return layers;
}
