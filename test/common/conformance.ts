// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {expect as vitestExpect} from 'vitest';

type AssertionTarget = {
  ok(value: unknown, message?: string): void;
  notOk(value: unknown, message?: string): void;
  equal(actual: unknown, expected: unknown, message?: string): void;
  equals?(actual: unknown, expected: unknown, message?: string): void;
};

function getAssertionTarget(assertionTarget?: AssertionTarget): AssertionTarget {
  if (assertionTarget) {
    return assertionTarget;
  }

  const expectFunction =
    (globalThis as typeof globalThis & {expect?: (value: unknown, message?: string) => any})
      .expect || vitestExpect;

  if (!expectFunction) {
    throw new Error('validateLoader requires tape assertions or a global expect');
  }

  return {
    ok(value, message) {
      expectFunction(value, message).toBeTruthy();
    },
    notOk(value, message) {
      expectFunction(value, message).toBeFalsy();
    },
    equal(actual, expected, message) {
      expectFunction(actual, message).toBe(expected);
    },
    equals(actual, expected, message) {
      expectFunction(actual, message).toBe(expected);
    }
  };
}

function resolveAssertionsAndValue<T>(
  assertionTargetOrValue: AssertionTarget | T,
  valueOrName?: T | string,
  name?: string
): {assertionTarget: AssertionTarget; value: T; name: string} {
  if (
    assertionTargetOrValue &&
    typeof assertionTargetOrValue === 'object' &&
    ('ok' in assertionTargetOrValue || 'equal' in assertionTargetOrValue)
  ) {
    return {
      assertionTarget: getAssertionTarget(assertionTargetOrValue as AssertionTarget),
      value: valueOrName as T,
      name: name || ''
    };
  }

  return {
    assertionTarget: getAssertionTarget(),
    value: assertionTargetOrValue as T,
    name: (valueOrName as string) || ''
  };
}

export function validateLoader(
  assertionTargetOrLoader: AssertionTarget | any,
  loaderOrName?: any,
  name = ''
) {
  const {
    assertionTarget,
    value: loader,
    name: resolvedName
  } = resolveAssertionsAndValue(assertionTargetOrLoader, loaderOrName, name);

  assertionTarget.ok(
    typeof loader.id === 'string',
    `Loader ${resolvedName} loader.id is not defined`
  );
  assertionTarget.ok(loader, `Loader ${resolvedName} defined`);
  assertionTarget.equal(typeof loader.name, 'string', `Loader ${resolvedName} has a name`);
  assertionTarget.ok(
    Array.isArray(loader.extensions),
    `Loader ${resolvedName} has an extensions array`
  );
  assertionTarget.ok(
    Array.isArray(loader.mimeTypes),
    `Loader ${resolvedName} has a mimeTypes array`
  );

  const options = loader.options || {};
  assertionTarget.ok(!('workerUrl' in options), 'workerUrl is not defined on loader.options');
  if (resolvedName.includes('Worker')) {
    assertionTarget.ok('worker' in loader, `Loader ${resolvedName} loader.worker is not defined`);
  }

  // const loaderOptions = options[loader.id] || {};
  if (!loader.parse) {
    // t.ok(loaderOptions.workerUrl, 'options.<loaderId>.workerUrl');
  } else {
    assertionTarget.equal(
      typeof loader.parse,
      'function',
      `Loader ${resolvedName} has 'parse' function`
    );
    // Call parse just to ensure it returns a promise
    const promise = loader.parse(new ArrayBuffer(0), {}).catch(_ => {});
    assertionTarget.ok(promise.then, `Loader ${resolvedName} is async (returns a promise)`);
  }
}

export function validateWriter(
  assertionTargetOrWriter: AssertionTarget | any,
  writerOrName?: any,
  name = ''
) {
  const {
    assertionTarget,
    value: writer,
    name: resolvedName
  } = resolveAssertionsAndValue(assertionTargetOrWriter, writerOrName, name);
  assertionTarget.ok(writer, `Writer ${resolvedName} defined`);
  assertionTarget.equal(typeof writer.name, 'string', `Writer ${resolvedName} has a name`);
}

export function validateBuilder(
  assertionTargetOrBuilder: AssertionTarget | any,
  builderOrName?: any,
  name = ''
) {
  const {
    assertionTarget,
    value: builder,
    name: resolvedName
  } = resolveAssertionsAndValue(assertionTargetOrBuilder, builderOrName, name);
  assertionTarget.ok(builder, `Builder ${resolvedName} defined`);
  assertionTarget.equal(typeof builder.name, 'string', `Builder ${resolvedName} has a name`);
}

/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
export function validateMeshCategoryData(t, data) {
  // t.ok(data.loaderData && data.loaderData.header, 'data has original header');

  t.ok(data.header && Number.isFinite(data.header.vertexCount), 'data has normalized header');
  t.ok(
    data.header.boundingBox &&
      data.header.boundingBox.length === 2 &&
      data.header.boundingBox.every(p => p.length === 3 && p.every(Number.isFinite)),
    'data header has boundingBox'
  );

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

/**
 * Check if the returned data from loaders use the format specified in `ColumnarTable`:
 *  modules/schema/src/category/table/table-types.ts
 */
export function validateTableCategoryData(t, data) {
  t.equals(data.shape, 'columnar-table');
  t.ok(data.data);
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
  t.notOk(attributesError, 'data has valid attributes');
  if (data.schema) {
    t.ok(data.schema.fields && data.schema.metadata, 'Schema is instance of `Schema` class');
    t.ok(data.schema.fields, 'Schema has fields');
  }
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
