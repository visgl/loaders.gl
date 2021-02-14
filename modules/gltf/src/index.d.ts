// Constants
export {KHR_DRACO_MESH_COMPRESSION, UBER_POINT_CLOUD_EXTENSION} from './lib/gltf-constants';

// glTF loader/writer definition objects
export {GLTFLoader} from './gltf-loader';
export {GLTFWriter} from './gltf-writer';

// GLB Loader & Writer (for custom formats that want to leverage the GLB binary "envelope")
export {GLBLoader} from './glb-loader';
export {GLBWriter} from './glb-writer';

// glTF Data Access Helper Class
export {default as GLTFScenegraph} from './lib/gltf-scenegraph';
export {default as postProcessGLTF} from './lib/post-process-gltf';

// DEPRECATED

export {default as GLBBuilder} from './lib/deprecated/glb-builder';
export {encodeGLTFSync} from './lib/encode-gltf'; // For 3D Tiles
