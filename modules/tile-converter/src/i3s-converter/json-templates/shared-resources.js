import transform from 'json-map-transform';

const MATERIAL_DEFINITION_INFO_PARAMS = {
  renderMode: {
    path: 'renderMode',
    default: 'solid'
  },
  shininess: {
    path: 'shininess',
    default: 1
  },
  reflectivity: {
    path: 'reflectivity',
    default: 0
  },
  ambient: {
    path: 'ambient',
    default: [1, 1, 1, 1]
  },
  diffuse: {
    path: 'diffuse',
    default: [1, 1, 1, 1]
  },
  specular: {
    path: 'specular',
    default: [0, 0, 0, 0]
  },
  useVertexColorAlpha: {
    path: 'useVertexColorAlpha',
    default: false
  },
  vertexRegions: {
    path: 'vertexRegions',
    default: false
  },
  vertexColors: {
    path: 'vertexColors',
    default: true
  }
};

const MATERIAL_DEFINITION_INFO = {
  name: {
    path: 'name',
    default: 'standard'
  },
  type: {
    path: 'type',
    default: 'standard'
  },
  params: {
    path: 'params',
    transform: (val, thisObject, originalObject) =>
      transform(originalObject, MATERIAL_DEFINITION_INFO_PARAMS)
  }
};

const TEXTURE_DEFINITION_IMAGE = {
  id: {
    path: 'id'
  },
  size: {
    path: 'size'
  },
  href: {
    path: 'href',
    default: ['../textures/0']
  },
  length: {
    path: 'length'
  }
};

const TEXTURE_DEFINITION_INFO = {
  encoding: {
    path: 'encoding'
  },
  wrap: {
    path: 'wrap',
    default: ['none']
  },
  atlas: {
    path: 'atlas',
    default: false
  },
  uvSet: {
    path: 'uvSet',
    default: 'uv0'
  },
  channels: {
    path: 'channels',
    default: 'rgb'
  },
  images: {
    path: 'images',
    transform: (val, thisObject, originalObject) =>
      val.map((image) => transform(image, TEXTURE_DEFINITION_IMAGE))
  }
};

export const SHARED_RESOURCES_TEMPLATE = {
  materialDefinitions: {
    path: 'materialDefinitionInfos',
    transform: transfromMaterialDefinitions
  },
  textureDefinitions: {
    path: 'textureDefinitionInfos',
    transform: transfromTextureDefinitions
  }
};

function transfromMaterialDefinitions(materialDefinitionInfos, thisObject, originalObject) {
  const result = {};
  for (const [index, materialDefinitionInfo] of materialDefinitionInfos.entries()) {
    result[`Mat${originalObject.nodePath}${index}`] = transform(
      materialDefinitionInfo,
      MATERIAL_DEFINITION_INFO
    );
  }
  return result;
}

function transfromTextureDefinitions(textureDefinitionInfos, thisObject, originalObject) {
  if (!textureDefinitionInfos) {
    return null;
  }
  const result = {};
  for (const [index, textureDefinitionInfo] of textureDefinitionInfos.entries()) {
    const imageIndex = `${originalObject.nodePath}${index}`;
    textureDefinitionInfo.imageIndex = imageIndex;
    result[imageIndex] = transform(textureDefinitionInfo, TEXTURE_DEFINITION_INFO);
  }
  return result;
}
