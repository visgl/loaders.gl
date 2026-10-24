// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect} from 'vitest';

/** Validates loader metadata with native Vitest assertions. */
export function validateLoader(loader: any, name = '') {
  expect(typeof loader.id === 'string', `Loader ${name} loader.id is not defined`).toBeTruthy();
  expect(loader, `Loader ${name} defined`).toBeTruthy();
  expect(typeof loader.name, `Loader ${name} has a name`).toBe('string');
  expect(Array.isArray(loader.extensions), `Loader ${name} has an extensions array`).toBeTruthy();
  expect(Array.isArray(loader.mimeTypes), `Loader ${name} has a mimeTypes array`).toBeTruthy();

  const options = loader.options || {};
  expect(!('workerUrl' in options), 'workerUrl is not defined on loader.options').toBeTruthy();
  if (name.includes('Worker')) {
    expect('worker' in loader, `Loader ${name} loader.worker is not defined`).toBeTruthy();
  }

  if (loader.parse) {
    expect(typeof loader.parse, `Loader ${name} has 'parse' function`).toBe('function');
    // Call parse just to ensure it returns a promise
    const promise = loader.parse(new ArrayBuffer(0), {}).catch(_ => {});
    expect(promise.then, `Loader ${name} is async (returns a promise)`).toBeTruthy();
  }
}

/** Validates writer metadata with native Vitest assertions. */
export function validateWriter(writer: any, name = '') {
  expect(writer, `Writer ${name} defined`).toBeTruthy();
  expect(typeof writer.name, `Writer ${name} has a name`).toBe('string');
}

/** Validates builder metadata with native Vitest assertions. */
export function validateBuilder(builder: any, name = '') {
  expect(builder, `Builder ${name} defined`).toBeTruthy();
  expect(typeof builder.name, `Builder ${name} has a name`).toBe('string');
}

/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
export function validateMeshCategoryData(data) {
  expect(
    data.header && Number.isFinite(data.header.vertexCount),
    'data has normalized header'
  ).toBeTruthy();
  expect(
    data.header.boundingBox &&
      data.header.boundingBox.length === 2 &&
      data.header.boundingBox.every(p => p.length === 3 && p.every(Number.isFinite)),
    'data header has boundingBox'
  ).toBeTruthy();

  expect(Number.isFinite(data.mode), 'data has draw mode').toBeTruthy();

  let attributesError = data.attributes ? null : 'data does not have attributes';
  if (data.indices) {
    attributesError = attributesError || validateAttribute('indices', data.indices);
  }
  for (const attributeName in data.attributes) {
    attributesError =
      attributesError || validateAttribute(attributeName, data.attributes[attributeName]);
  }
  expect(attributesError, 'data has valid attributes').toBeFalsy();
}

/**
 * Check if the returned data from loaders use the format specified in `ColumnarTable`:
 *  modules/core/src/schema/category/table/table-types.ts
 */
export function validateTableCategoryData(data) {
  expect(data.shape).toBe('columnar-table');
  expect(data.data).toBeTruthy();
  let hasAttributes = false;
  let attributesError = false;
  for (const attributeName in data.data) {
    hasAttributes = true;
    const value = data.data[attributeName];
    if (
      !('length' in value && 'byteOffset' in value && 'byteLength' in value && 'buffer' in value)
    ) {
      attributesError = true;
    }
  }
  attributesError = attributesError || !hasAttributes;
  expect(attributesError, 'data has valid attributes').toBeFalsy();
  if (data.schema) {
    expect(
      data.schema.fields && data.schema.metadata,
      'Schema is instance of `Schema` class'
    ).toBeTruthy();
    expect(data.schema.fields, 'Schema has fields').toBeTruthy();
  }
}

/** Returns the first mesh attribute shape error, or null for valid attributes. */
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
