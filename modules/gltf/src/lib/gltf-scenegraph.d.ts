export type GLTFJSON = {[key: string]: any};

/**
 * Class for structured access to GLTF data
 */
export default class GLTFScenegraph {
  constructor(gltf?: {json: GLTFJSON} | GLTFScenegraph);

  // Accessors

  get json(): GLTFJSON;

  getApplicationData(key: string): object;

  getExtraData(key: string): object;

  getExtension(extensionName: string): object | null;

  getRequiredExtension(extensionName: string): object | null;

  getRequiredExtensions(): string[];

  getUsedExtensions(): string[];

  getObjectExtension(object: object, extensionName: string): object | null;

  getScene(index: number): object;

  getNode(index: number): object;

  getSkin(index: number): object;

  getMesh(index: number): object;

  getMaterial(index: number): object;

  getAccessor(index: number): object;

  getCamera(index: number): object;

  getTexture(index: number): object;

  getSampler(index: number): object;

  getImage(index: number): object;

  getBufferView(index: number): object;

  getBuffer(index: number): object;

  getObject(array: string, index: number): object;

  // accepts buffer view index or buffer view object
  getTypedArrayForBufferView(bufferView: number | object): Uint8Array;

  // accepts accessor index or accessor object
  // returns a typed array with type that matches the types
  getTypedArrayForAccessor(accessor: number | object): any; // TODO typed array

  // accepts accessor index or accessor object
  // returns a `Uint8Array`
  getTypedArrayForImageData(image: number | object): Uint8Array; 

  // MODIFERS

  // Add an extra application-defined key to the top-level data structure
  addApplicationData(key: string, data: object): GLTFScenegraph;

  // `extras` - Standard GLTF field for storing application specific data
  addExtraData(key: string, data: object): GLTFScenegraph;

  addObjectExtension(object: object, extensionName: string, data: object): GLTFScenegraph;

  removeObjectExtension(object: object, extensionName: string): object;

  // Add to standard GLTF top level extension object, mark as used
  addExtension(extensionName: string, extensionData?: object): object;

  // Standard GLTF top level extension object, mark as used and required
  addRequiredExtension(extensionName, extensionData?: object): object;

  // Add extensionName to list of used extensions
  registerUsedExtension(extensionName: string): void;

  // Add extensionName to list of required extensions
  registerRequiredExtension(extensionName: string): void;

  // Removes an extension from the top-level list
  removeExtension(extensionName: string): void;

  setObjectExtension(object: object, extensionName: string, data: object): void;

  addMesh(attributes: object, indices: object, mode?: number): number;

  addPointCloud(attributes: object): number;


  /**
   * Adds a binary image. Builds glTF "JSON metadata" and saves buffer reference
   * Buffer will be copied into BIN chunk during "pack"
   * Currently encodes as glTF image
   * @param imageData 
   * @param mimeType 
   */
  addImage(imageData: any, mimeType?: string): number;

  /**
   * Add one untyped source buffer, create a matching glTF `bufferView`, and return its index
   * @param buffer 
   */
  addBufferView(buffer: any): number;

  /**
   * Adds an accessor to a bufferView
   * @param bufferViewIndex 
   * @param accessor 
   */
  addAccessor(bufferViewIndex: number, accessor: object): number;

  /**
   * Add a binary buffer. Builds glTF "JSON metadata" and saves buffer reference
   * Buffer will be copied into BIN chunk during "pack"
   * Currently encodes buffers as glTF accessors, but this could be optimized
   * @param sourceBuffer 
   * @param accessor 
   */
  addBinaryBuffer(sourceBuffer: any, accessor?: object): number;
}
