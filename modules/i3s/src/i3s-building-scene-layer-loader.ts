import type {LoaderWithParser, LoaderOptions, LoaderContext} from '@loaders.gl/loader-utils';
import type {BuildingSceneLayerTileset, BuildingSceneSublayer} from './types';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.

const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'beta';
const OBJECT_3D_LAYER_TYPE = '3DObject';

/**
 * Loader for I3S - Building Scene Layer
 */
export const I3SBuildingSceneLayerLoader: LoaderWithParser = {
  name: 'I3S Building Scene Layer',
  id: 'i3s-building-scene-layer',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/json'],
  parse,
  extensions: ['json'],
  options: {}
};

async function parse(
  data: ArrayBuffer,
  options?: LoaderOptions,
  context?: LoaderContext
): Promise<BuildingSceneLayerTileset> {
  const layers: BuildingSceneSublayer[] = [];
  const layer0 = JSON.parse(new TextDecoder().decode(data));
  const {sublayers} = layer0;
  const url = context?.url;

  if (!url) {
    throw new Error('Url is not provided');
  }

  parseSublayersTree(sublayers, url, layers);

  return {
    header: layer0,
    sublayers: layers
  };
}

function parseSublayersTree(
  sublayers: BuildingSceneSublayer[],
  url: string,
  layers: BuildingSceneSublayer[]
): void {
  for (let index = 0; index < sublayers.length; index++) {
    const subLayer = sublayers[index];
    const {id, layerType, ...rest} = subLayer;

    // Add support only for 3DObject layer type for I3S purposes.
    if (layerType === OBJECT_3D_LAYER_TYPE) {
      const sublayerUrl = `${url}/sublayers/${id}`;

      layers.push({
        url: sublayerUrl,
        id,
        layerType,
        ...rest
      });
    }

    if (subLayer?.sublayers?.length) {
      parseSublayersTree(subLayer.sublayers, url, layers);
    }
  }
}
