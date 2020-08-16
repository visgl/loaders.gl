/**
 * 
 * @param content 3d tile content
 */
export default function convertB3dmToI3sGeometry(content: any): Promise<{
  geometry: ArrayBuffer;
  compressedGeometry: ArrayBuffer;
  textures: any;
  sharedResources: any;
}>;
