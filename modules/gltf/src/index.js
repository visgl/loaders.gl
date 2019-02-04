// glTF loader/writer definition objects
export {default as GLTFLoader} from './gltf/gltf-loader';
export {default as GLTFWriter} from './gltf/gltf-writer';

// glTF Parser & Builder
export {default as GLTFParser} from './gltf/gltf-parser';
export {default as GLTFBuilder} from './gltf/gltf-builder';

// GLB Parser & Builder (for custom formats that want to leverage the GLB binary "envelope")
export {default as GLBParser} from './glb/glb-parser';
export {default as GLBBuilder} from './glb/glb-builder';

export {
  ATTRIBUTE_TYPE_TO_COMPONENTS,
  ATTRIBUTE_COMPONENT_TYPE_TO_BYTE_SIZE,
  ATTRIBUTE_COMPONENT_TYPE_TO_ARRAY
} from './utils/gltf-type-utils';
