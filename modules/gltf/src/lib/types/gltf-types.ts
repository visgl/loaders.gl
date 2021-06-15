export type GLTFJSON = {[key: string]: any};
export type GLTFScene = {[key: string]: any};
export type GLTFNode = {[key: string]: any};
export type GLTFMesh = {[key: string]: any};
export type GLTFSkin = {[key: string]: any};
export type GLTFMaterial = {[key: string]: any};
export type GLTFAccessor = {[key: string]: any};
export type GLTFSampler = {[key: string]: any};
export type GLTFTexture = {[key: string]: any};
export type GLTFImage = {[key: string]: any};
export type GLTFBuffer = {[key: string]: any};
export type GLTFBufferView = {[key: string]: any};

export type GLTFWithBuffers = {
  json: GLTFJSON;
  buffers: any[];
  binary?: ArrayBuffer;
};
