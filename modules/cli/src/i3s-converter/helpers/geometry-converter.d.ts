/**
 * Convert binary data from b3dm file to i3s resources
 *
 * @param content - 3d tile content
 * @param options - converter options
 * @returns A promise that resolves to object with `geometry`, compressedGeometry`, `textures` and `sharedResources` appropriate
 *  for use  I3S tiles.
 */
export default function convertB3dmToI3sGeometry(
  content: any,
  options?: Object
): Promise<{
  geometry: ArrayBuffer;
  compressedGeometry: ArrayBuffer;
  textures: any;
  sharedResources: any;
  meshMaterial: any;
}>;
