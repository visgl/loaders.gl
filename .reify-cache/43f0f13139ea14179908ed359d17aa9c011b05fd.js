"use strict";module.export({validateLoadedData:()=>validateLoadedData});/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
function validateLoadedData(t, data) {
  t.ok(data.loaderData && data.loaderData.header, 'data has original header');

  t.ok(data.header && Number.isFinite(data.header.vertexCount), 'data has normalized header');

  t.ok(Number.isFinite(data.mode), 'data has draw mode');

  let attributesError = data.attributes ? null : 'data does not have attributes';
  if (data.indices) {
    attributesError = attributesError || validateAttribute('indices', data.indices);
  }
  for (const attributeName in data.attributes) {
    attributesError =
      attributesError || validateAttribute(attributeName, data.attributes[attributeName]);
  }
  t.notOk(attributesError, 'data has valid attributes');
}

function validateAttribute(attributeName, attribute) {
  if (!ArrayBuffer.isView(attribute.value)) {
    return `${attributeName} value is not typed array`;
  }
  if (attribute.value.slice(0, 10).some(x => !Number.isFinite(x))) {
    return `${attributeName} contains invalid value`;
  }
  if (!Number.isFinite(attribute.size)) {
    return `${attributeName} does not have size`;
  }
  // if (!Number.isFinite(attribute.componentType)) {
  //   return `${attributeName} does not have type`;
  // }
  return null;
}
