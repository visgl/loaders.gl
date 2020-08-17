/**
 * Convert binary data from b3dm file to i3s resources
 * 
 * @param {Object} content - 3d tile content
 * 
 * @returns A promise that resolves to object with `geometry`, compressedGeometry`, `textures` and `sharedResources` appropriate 
 *  for use  I3S tiles.
 */
export default function convertB3dmToI3sGeometry(content: any): Promise<{
  geometry: ArrayBuffer;
  compressedGeometry: ArrayBuffer;
  textures: any;
  sharedResources: any;
}>;
