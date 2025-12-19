// loaders.gl
// SPDX-License-Identifier: MIT AND Apache-2.0
// Copyright vis.gl contributors

// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

// TODO - Finish hierarchy suypport: this file is only half ported
/* eslint-disable */
// @ts-nocheck
const defined = (x) => x !== undefined;

export function initializeHierarchy(batchTable, jsonHeader, binaryBody) {
  if (!jsonHeader) {
    return null;
  }

  let hierarchy = batchTable.getExtension('3DTILES_batch_table_hierarchy');

  const legacyHierarchy = jsonHeader.HIERARCHY;
  if (legacyHierarchy) {
    // eslint-disable-next-line
    console.warn('3D Tile Parser: HIERARCHY is deprecated. Use 3DTILES_batch_table_hierarchy.');
    jsonHeader.extensions = jsonHeader.extensions || {};
    jsonHeader.extensions['3DTILES_batch_table_hierarchy'] = legacyHierarchy;
    hierarchy = legacyHierarchy;
  }

  if (!hierarchy) {
    return null;
  }

  return initializeHierarchyValues(hierarchy, binaryBody);
}

// eslint-disable-next-line max-statements
function initializeHierarchyValues(hierarchyJson, binaryBody) {
  let i;
  let classId;
  let binaryAccessor;

  const instancesLength = hierarchyJson.instancesLength;
  const classes = hierarchyJson.classes;
  let classIds = hierarchyJson.classIds;
  let parentCounts = hierarchyJson.parentCounts;
  let parentIds = hierarchyJson.parentIds;
  let parentIdsLength = instancesLength;

  if (defined(classIds.byteOffset)) {
    classIds.componentType = defaultValue(classIds.componentType, GL.UNSIGNED_SHORT);
    classIds.type = AttributeType.SCALAR;
    binaryAccessor = getBinaryAccessor(classIds);
    classIds = binaryAccessor.createArrayBufferView(
      binaryBody.buffer,
      binaryBody.byteOffset + classIds.byteOffset,
      instancesLength
    );
  }

  let parentIndexes;
  if (defined(parentCounts)) {
    if (defined(parentCounts.byteOffset)) {
      parentCounts.componentType = defaultValue(parentCounts.componentType, GL.UNSIGNED_SHORT);
      parentCounts.type = AttributeType.SCALAR;
      binaryAccessor = getBinaryAccessor(parentCounts);
      parentCounts = binaryAccessor.createArrayBufferView(
        binaryBody.buffer,
        binaryBody.byteOffset + parentCounts.byteOffset,
        instancesLength
      );
    }
    parentIndexes = new Uint16Array(instancesLength);
    parentIdsLength = 0;
    for (i = 0; i < instancesLength; ++i) {
      parentIndexes[i] = parentIdsLength;
      parentIdsLength += parentCounts[i];
    }
  }

  if (defined(parentIds) && defined(parentIds.byteOffset)) {
    parentIds.componentType = defaultValue(parentIds.componentType, GL.UNSIGNED_SHORT);
    parentIds.type = AttributeType.SCALAR;
    binaryAccessor = getBinaryAccessor(parentIds);
    parentIds = binaryAccessor.createArrayBufferView(
      binaryBody.buffer,
      binaryBody.byteOffset + parentIds.byteOffset,
      parentIdsLength
    );
  }

  const classesLength = classes.length;
  for (i = 0; i < classesLength; ++i) {
    const classInstancesLength = classes[i].length;
    const properties = classes[i].instances;
    const binaryProperties = getBinaryProperties(classInstancesLength, properties, binaryBody);
    classes[i].instances = combine(binaryProperties, properties);
  }

  const classCounts = new Array(classesLength).fill(0);
  const classIndexes = new Uint16Array(instancesLength);
  for (i = 0; i < instancesLength; ++i) {
    classId = classIds[i];
    classIndexes[i] = classCounts[classId];
    ++classCounts[classId];
  }

  const hierarchy = {
    classes,
    classIds,
    classIndexes,
    parentCounts,
    parentIndexes,
    parentIds
  };

  validateHierarchy(hierarchy);

  return hierarchy;
}

// HELPER CODE

// Traverse over the hierarchy and process each instance with the endConditionCallback.
// When the endConditionCallback returns a value, the traversal stops and that value is returned.
export function traverseHierarchy(hierarchy, instanceIndex, endConditionCallback) {
  if (!hierarchy) {
    return;
  }

  const parentCounts = hierarchy.parentCounts;
  const parentIds = hierarchy.parentIds;
  if (parentIds) {
    return endConditionCallback(hierarchy, instanceIndex);
  }
  if (parentCounts > 0) {
    return traverseHierarchyMultipleParents(hierarchy, instanceIndex, endConditionCallback);
  }
  return traverseHierarchySingleParent(hierarchy, instanceIndex, endConditionCallback);
}

// eslint-disable-next-line max-statements
function traverseHierarchyMultipleParents(hierarchy, instanceIndex, endConditionCallback) {
  const classIds = hierarchy.classIds;
  const parentCounts = hierarchy.parentCounts;
  const parentIds = hierarchy.parentIds;
  const parentIndexes = hierarchy.parentIndexes;
  const instancesLength = classIds.length;

  // Ignore instances that have already been visited. This occurs in diamond inheritance situations.
  // Use a marker value to indicate that an instance has been visited, which increments with each run.
  // This is more efficient than clearing the visited array every time.
  const visited = scratchVisited;
  visited.length = Math.max(visited.length, instancesLength);
  const visitedMarker = ++marker;

  const stack = scratchStack;
  stack.length = 0;
  stack.push(instanceIndex);

  while (stack.length > 0) {
    instanceIndex = stack.pop();
    if (visited[instanceIndex] === visitedMarker) {
      // This instance has already been visited, stop traversal
      continue;
    }
    visited[instanceIndex] = visitedMarker;
    const result = endConditionCallback(hierarchy, instanceIndex);
    if (defined(result)) {
      // The end condition was met, stop the traversal and return the result
      return result;
    }
    const parentCount = parentCounts[instanceIndex];
    const parentIndex = parentIndexes[instanceIndex];
    for (let i = 0; i < parentCount; ++i) {
      const parentId = parentIds[parentIndex + i];
      // Stop the traversal when the instance has no parent (its parentId equals itself)
      // else add the parent to the stack to continue the traversal.
      if (parentId !== instanceIndex) {
        stack.push(parentId);
      }
    }
  }

  return null;
}

function traverseHierarchySingleParent(hierarchy, instanceIndex, endConditionCallback) {
  let hasParent = true;
  while (hasParent) {
    const result = endConditionCallback(hierarchy, instanceIndex);
    if (defined(result)) {
      // The end condition was met, stop the traversal and return the result
      return result;
    }
    const parentId = hierarchy.parentIds[instanceIndex];
    hasParent = parentId !== instanceIndex;
    instanceIndex = parentId;
  }
  throw new Error('traverseHierarchySingleParent');
}

// DEBUG CODE

function validateHierarchy(hierarchy) {
  const scratchValidateStack = [];

  const classIds = hierarchy.classIds;
  const instancesLength = classIds.length;

  for (let i = 0; i < instancesLength; ++i) {
    validateInstance(hierarchy, i, stack);
  }
}

function validateInstance(hierarchy, instanceIndex, stack) {
  const parentCounts = hierarchy.parentCounts;
  const parentIds = hierarchy.parentIds;
  const parentIndexes = hierarchy.parentIndexes;
  const classIds = hierarchy.classIds;
  const instancesLength = classIds.length;

  if (!defined(parentIds)) {
    // No need to validate if there are no parents
    return;
  }

  assert(
    instanceIndex < instancesLength,
    `Parent index ${instanceIndex} exceeds the total number of instances: ${instancesLength}`
  );
  assert(
    stack.indexOf(instanceIndex) === -1,
    'Circular dependency detected in the batch table hierarchy.'
  );

  stack.push(instanceIndex);
  const parentCount = defined(parentCounts) ? parentCounts[instanceIndex] : 1;
  const parentIndex = defined(parentCounts) ? parentIndexes[instanceIndex] : instanceIndex;
  for (let i = 0; i < parentCount; ++i) {
    const parentId = parentIds[parentIndex + i];
    // Stop the traversal when the instance has no parent (its parentId equals itself), else continue the traversal.
    if (parentId !== instanceIndex) {
      validateInstance(hierarchy, parentId, stack);
    }
  }
  stack.pop(instanceIndex);
}
