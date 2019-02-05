import assert from 'assert';

export function getAttribute(data, gltfAttributeName) {
  return data.attributes[data.glTFAttributeMap[gltfAttributeName]];
}

/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
export function validateLoadedData(data) {
  assert(data.loaderData, 'data does not have loaderData');
  assert(data.loaderData.header, 'data does not have original header');

  assert(data.header, 'data does not have header');
  assert(Number.isFinite(data.header.vertexCount || data.header.elementCount), 'header does not have vertexCount');

  assert(Number.isFinite(data.mode), 'data does not have mode');

  if (data.indices) {
    validateAttribute('indices', data.indices);
  }

  assert(data.attributes, 'data does not have attributes');

  for (const attributeName in data.attributes) {
    validateAttribute(attributeName, data.attributes[attributeName]);
  }

  assert(data.glTFAttributeMap, 'data does not have glTFAttributeMap');

  for (const attributeName in data.glTFAttributeMap) {
    assert(data.glTFAttributeMap[attributeName] in data.attributes);
  }
}

function validateAttribute(attributeName, attribute) {
  assert(Number.isFinite(attribute.size), `${attributeName} does not have size`);
  assert(Number.isFinite(attribute.componentType), `${attributeName} does not have type`);
  assert(ArrayBuffer.isView(attribute.value), `${attributeName} does not have valid value`);
}
