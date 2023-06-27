import type {LoaderContext} from '@loaders.gl/loader-utils';
import type {Tiles3DLoaderOptions} from '../../tiles-3d-loader';
import {_getMemoryUsageGLTF, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';
import {Tiles3DTileContent} from '../../types';

export async function parseGltf3DTile(
  tile: Tiles3DTileContent,
  arrayBuffer: ArrayBuffer,
  options?: Tiles3DLoaderOptions,
  context?: LoaderContext
): Promise<void> {
  // Set flags
  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;
  // Save gltf up axis
  tile.gltfUpAxis =
    options?.['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis
      ? options['3d-tiles'].assetGltfUpAxis
      : 'Y';

  if (options?.['3d-tiles']?.loadGLTF) {
    if (!context) {
      return;
    }
    const {parse} = context;
    const gltfWithBuffers = await parse(arrayBuffer, GLTFLoader, options, context);
    tile.gltf = postProcessGLTF(gltfWithBuffers);
    tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
  } else {
    tile.gltfArrayBuffer = arrayBuffer;
  }
}
