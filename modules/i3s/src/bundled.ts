// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright vis.gl contributors

export type {I3SLoaderOptions} from './i3s-loader';
export {I3SLoaderWithParser as I3SLoader} from './i3s-loader-with-parser';
export {SLPKLoaderWithParser as SLPKLoader} from './i3s-slpk-loader-with-parser';
export {I3SContentLoaderWithParser as I3SContentLoader} from './i3s-content-loader-with-parser';
export {
  I3SAttributeLoaderWithParser as I3SAttributeLoader,
  loadFeatureAttributes
} from './i3s-attribute-loader-with-parser';
export {I3SBuildingSceneLayerLoaderWithParser as I3SBuildingSceneLayerLoader} from './i3s-building-scene-layer-loader-with-parser';
export {I3SNodePageLoaderWithParser as I3SNodePageLoader} from './i3s-node-page-loader-with-parser';
export {ArcGISWebSceneLoaderWithParser as ArcGISWebSceneLoader} from './arcgis-webscene-loader-with-parser';
