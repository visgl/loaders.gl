/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
export function validateLoadedData(t, data) {
  t.ok(data.loaderData && data.loaderData.header, 'data has original header');

  t.ok(data.header && Number.isFinite(data.header.vertexCount), 'data has normalized header');

  t.ok(Number.isFinite(data.mode), 'data has draw mode');

  let attributesError = data.attributes ? null : 'data does not have attributes';
  if (data.indices) {
    attributesError = attributesError || validateAttribute('indices', data.indices);
  }
  for (const attributeName in data.attributes) {
    attributesError = attributesError && validateAttribute(attributeName, data.attributes[attributeName]);
  }
  t.notOk(attributesError, 'data has valid attributes');

  let glTFAttributeMapError = data.glTFAttributeMap ? null : 'data does not have glTFAttributeMap';
  for (const attributeName in data.glTFAttributeMap) {
    glTFAttributeMapError = glTFAttributeMapError ||
      (data.glTFAttributeMap[attributeName] in data.attributes ? null : `${attributeName} attribute is not found`);
  }
  t.notOk(glTFAttributeMapError, 'data has valid glTFAttributeMap');
}

function validateAttribute(attributeName, attribute) {
  if (!Number.isFinite(attribute.size)) {
    return `${attributeName} does not have size`;
  }
  if (!Number.isFinite(attribute.componentType)) {
    return `${attributeName} does not have type`;
  }
  if (!ArrayBuffer.isView(attribute.value)) {
    return `${attributeName} does not have valid value`;
  }
  return null;
}
