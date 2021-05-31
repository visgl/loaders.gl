// TODO - move to @luma.gl/addons
import {createGLTFObjects as createGLTFObjectsSync} from '@luma.gl/experimental';

export async function createGLTFObjects(gl, gltf, options) {
  const gltfObjects = createGLTFObjectsSync(gl, gltf, options);

  if (options.waitForFullLoad) {
    await waitForGLTFAssets(gltfObjects);
  }

  return {
    ...gltfObjects,
    gltf
  };
}

async function waitForGLTFAssets(gltfObjects) {
  const remaining = [];

  gltfObjects.scenes.forEach(scene => {
    scene.traverse(model => {
      Object.values(model.model.program.uniforms).forEach(uniform => {
        if (uniform.loaded === false) {
          remaining.push(uniform);
        }
      });
    });
  });

  return await waitWhileCondition(() => remaining.some(uniform => !uniform.loaded));
}

async function waitWhileCondition(condition) {
  while (condition()) {
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
}
