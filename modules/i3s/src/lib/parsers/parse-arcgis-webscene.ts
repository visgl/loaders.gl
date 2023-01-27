import {JSONLoader, load} from '@loaders.gl/core';
import type {ArcGisWebSceneData, OperationalLayer} from '../../types';

/**
 * WKID, or Well-Known ID, of the CRS. Specify either WKID or WKT of the CRS.
 * Spec - https://github.com/Esri/i3s-spec/blob/master/docs/1.8/spatialReference.cmn.md
 */
const SUPPORTED_WKID = 4326;

const ARCGIS_SCENE_SERVER_LAYER_TYPE = 'ArcGISSceneServiceLayer';
const BUILDING_SCENE_LAYER = 'BuildingSceneLayer';
const INTEGRATED_MESH_LAYER = 'IntegratedMeshLayer';
const GROUP_LAYER = 'GroupLayer';

/**
 * Supported layers list
 * Possible operational layers in WebScene: https://developers.arcgis.com/web-scene-specification/objects/operationalLayers/
 */
const SUPPORTED_LAYERS_TYPES = [
  ARCGIS_SCENE_SERVER_LAYER_TYPE,
  INTEGRATED_MESH_LAYER,
  BUILDING_SCENE_LAYER,
  GROUP_LAYER
];

const NO_AVAILABLE_SUPPORTED_LAYERS_ERROR = 'NO_AVAILABLE_SUPPORTED_LAYERS_ERROR';
const NOT_SUPPORTED_CRS_ERROR = 'NOT_SUPPORTED_CRS_ERROR';

/**
 * Parses ArcGIS WebScene
 * @param data
 */
export async function parseWebscene(data: ArrayBuffer): Promise<ArcGisWebSceneData> {
  const layer0 = JSON.parse(new TextDecoder().decode(data));
  const {operationalLayers} = layer0;
  const {layers, unsupportedLayers} = await parseOperationalLayers(operationalLayers, true);

  if (!layers.length) {
    throw new Error(NO_AVAILABLE_SUPPORTED_LAYERS_ERROR);
  }

  return {
    header: layer0,
    layers,
    unsupportedLayers
  };
}

/**
 * Recursively parses WebScene operational layers.
 * @param layersList
 */
async function parseOperationalLayers(
  layersList: OperationalLayer[],
  needToCheckCRS: boolean
): Promise<{layers: OperationalLayer[]; unsupportedLayers: OperationalLayer[]}> {
  const layers: OperationalLayer[] = [];
  let unsupportedLayers: OperationalLayer[] = [];

  for (let index = 0; index < layersList.length; index++) {
    const layer = layersList[index];
    const isLayerSupported = SUPPORTED_LAYERS_TYPES.includes(layer.layerType);

    if (isLayerSupported) {
      if (needToCheckCRS && layer.layerType !== GROUP_LAYER) {
        await checkSupportedIndexCRS(layer);
        needToCheckCRS = false;
      }

      layers.push(layer);
    } else {
      unsupportedLayers.push(layer);
    }

    if (layer.layers?.length) {
      const {layers: childLayers, unsupportedLayers: childUnsupportedLayers} =
        await parseOperationalLayers(layer.layers, needToCheckCRS);
      layer.layers = childLayers;
      unsupportedLayers = [...unsupportedLayers, ...childUnsupportedLayers];
    }
  }

  return {layers, unsupportedLayers};
}

/**
 * Check if layer has supported CRS
 * @param layer
 */
async function checkSupportedIndexCRS(layer: OperationalLayer) {
  try {
    const layerJson = await load(layer.url, JSONLoader);
    // @ts-expect-error
    const wkid = layerJson?.spatialReference?.wkid;

    if (wkid !== SUPPORTED_WKID) {
      throw new Error(NOT_SUPPORTED_CRS_ERROR);
    }
  } catch (error) {
    throw error;
  }
}
