import {_getMemoryUsageGLTF, GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';

export async function parseGltf3DTile(tile, arrayBuffer, options, context) {
  // Set flags
  // glTF models need to be rotated from Y to Z up
  // https://github.com/AnalyticalGraphicsInc/3d-tiles/tree/master/specification#y-up-to-z-up
  tile.rotateYtoZ = true;
  // Save gltf up axis
  tile.gltfUpAxis =
    options['3d-tiles'] && options['3d-tiles'].assetGltfUpAxis
      ? options['3d-tiles'].assetGltfUpAxis
      : 'Y';

  const {parse} = context;
  const gltfWithBuffers = await parse(arrayBuffer, GLTFLoader, options, context);
  tile.gltf = postProcessGLTF(gltfWithBuffers);
  tile.gpuMemoryUsageInBytes = _getMemoryUsageGLTF(tile.gltf);
}
