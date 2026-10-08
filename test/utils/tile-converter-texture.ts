import {GLTFScenegraph, GLTFWriter} from '@loaders.gl/gltf';

/** Authored glTF wrapping/filtering exercised by the source mapping tests. */
export const TEXTURE_SAMPLER = {
  wrapS: 33071,
  wrapT: 33648,
  magFilter: 9728,
  minFilter: 9987
} as const;

/** Builds a tiny self-contained GLB with a buffer-view or inline URI image and repeatable geometry. */
export function createTexturedTriangle(
  image: Uint8Array,
  mimeType: 'image/png' | 'image/jpeg',
  normalized = false,
  vertexCount = 3,
  transform?: Record<string, unknown>,
  imageUri?: string
): ArrayBuffer {
  const scenegraph = new GLTFScenegraph({json: {asset: {version: '2.0'}}});
  const positions = new Float32Array(vertexCount * 3);
  const coordinates = normalized
    ? new Uint16Array(vertexCount * 2)
    : new Float32Array(vertexCount * 2);
  for (let index = 0; index < vertexCount; index++) {
    positions.set(index % 3 === 1 ? [1, 0, 0] : index % 3 === 2 ? [0, 1, 0] : [0, 0, 0], index * 3);
    const maximum = normalized ? 65535 : 1;
    coordinates.set(
      index % 3 === 1 ? [maximum, 0] : index % 3 === 2 ? [0, maximum] : [0, 0],
      index * 2
    );
  }
  let imageIndex: number;
  if (imageUri === undefined) {
    imageIndex = scenegraph.addImage(
      new DataView(image.buffer, image.byteOffset, image.byteLength),
      mimeType
    );
  } else {
    scenegraph.json.images = [{uri: imageUri}];
    imageIndex = 0;
  }
  const textureIndex = scenegraph.addTexture({
    imageIndex,
    samplerIndex: scenegraph.addSampler(TEXTURE_SAMPLER)
  });
  if (transform) scenegraph.registerRequiredExtension('KHR_texture_transform');
  const meshIndex = scenegraph.addMesh({
    attributes: {
      POSITION: {value: positions, size: 3},
      TEXCOORD_0: {value: coordinates, size: 2, ...(normalized ? {normalized: true} : {})}
    },
    material: scenegraph.addMaterial({
      pbrMetallicRoughness: {
        baseColorFactor: [0.5, 0.75, 1, 1],
        baseColorTexture: {
          index: textureIndex,
          ...(transform ? {extensions: {KHR_texture_transform: transform}} : {})
        }
      }
    })
  });
  scenegraph.setDefaultScene(scenegraph.addScene({nodeIndices: [scenegraph.addNode({meshIndex})]}));
  scenegraph.createBinaryChunk();
  return GLTFWriter.encodeSync!(scenegraph.gltf);
}

/** Encodes a small immutable image fixture with the browser's portable base64 API. */
export function createImageDataUri(image: Uint8Array, mimeType: string): string {
  return `data:${mimeType};base64,${btoa(Array.from(image, value => String.fromCharCode(value)).join(''))}`;
}
