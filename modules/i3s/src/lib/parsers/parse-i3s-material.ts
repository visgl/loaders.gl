export function parseI3sTileMaterial(tile) {
  tile.content.material = makePbrMaterial(tile.materialDefinition, tile.content.texture);
}

/**
 * Makes a glTF-compatible PBR material from an I3S material definition
 * @param {object} materialDefinition - i3s material definition
 *  https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
 * @param {object} texture - texture image
 * @returns {object}
 */
function makePbrMaterial(materialDefinition, texture) {
  let pbrMaterial;
  if (materialDefinition) {
    pbrMaterial = {
      ...materialDefinition,
      pbrMetallicRoughness: materialDefinition.pbrMetallicRoughness
        ? {...materialDefinition.pbrMetallicRoughness}
        : {baseColorFactor: [255, 255, 255, 255]}
    };
  } else {
    pbrMaterial = {
      pbrMetallicRoughness: {}
    };
    if (texture) {
      pbrMaterial.pbrMetallicRoughness.baseColorTexture = {texCoord: 0};
    } else {
      pbrMaterial.pbrMetallicRoughness.baseColorFactor = [255, 255, 255, 255];
    }
  }

  // Set default 0.25 per spec https://github.com/Esri/i3s-spec/blob/master/docs/1.7/materialDefinitions.cmn.md
  pbrMaterial.alphaCutoff = pbrMaterial.alphaCutoff || 0.25;

  if (pbrMaterial.alphaMode) {
    // I3S contain alphaMode in lowerCase
    pbrMaterial.alphaMode = pbrMaterial.alphaMode.toUpperCase();
  }

  // Convert colors from [255,255,255,255] to [1,1,1,1]
  if (pbrMaterial.emissiveFactor) {
    pbrMaterial.emissiveFactor = convertColorFormat(pbrMaterial.emissiveFactor);
  }
  if (pbrMaterial.pbrMetallicRoughness && pbrMaterial.pbrMetallicRoughness.baseColorFactor) {
    pbrMaterial.pbrMetallicRoughness.baseColorFactor = convertColorFormat(
      pbrMaterial.pbrMetallicRoughness.baseColorFactor
    );
  }

  setMaterialTexture(pbrMaterial, texture);

  return pbrMaterial;
}

/**
 * Convert color from [255,255,255,255] to [1,1,1,1]
 * @param {Array} colorFactor - color array
 * @returns {Array} - new color array
 */
function convertColorFormat(colorFactor) {
  const normalizedColor = [...colorFactor];
  for (let index = 0; index < colorFactor.length; index++) {
    normalizedColor[index] = colorFactor[index] / 255;
  }
  return normalizedColor;
}

/**
 * Set texture in PBR material
 * @param {object} material - i3s material definition
 * @param {object} image - texture image
 * @returns {void}
 */
function setMaterialTexture(material, image) {
  const texture = {source: {image}};
  // I3SLoader now support loading only one texture. This elseif sequence will assign this texture to one of
  // properties defined in materialDefinition
  if (material.pbrMetallicRoughness && material.pbrMetallicRoughness.baseColorTexture) {
    material.pbrMetallicRoughness.baseColorTexture = {
      ...material.pbrMetallicRoughness.baseColorTexture,
      texture
    };
  } else if (material.emissiveTexture) {
    material.emissiveTexture = {...material.emissiveTexture, texture};
  } else if (
    material.pbrMetallicRoughness &&
    material.pbrMetallicRoughness.metallicRoughnessTexture
  ) {
    material.pbrMetallicRoughness.metallicRoughnessTexture = {
      ...material.pbrMetallicRoughness.metallicRoughnessTexture,
      texture
    };
  } else if (material.normalTexture) {
    material.normalTexture = {...material.normalTexture, texture};
  } else if (material.occlusionTexture) {
    material.occlusionTexture = {...material.occlusionTexture, texture};
  }
}
