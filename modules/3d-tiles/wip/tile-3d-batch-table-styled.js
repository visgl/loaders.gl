// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {GL} from '@loaders.gl/math'; // 'math.gl/geometry';
import assert from '../utils/assert';

/*
const DEFAULT_COLOR_VALUE = Color.WHITE;
const DEFAULT_SHOW_VALUE = true;
*/
const defined = x => x !==  undefined;

// The size of this array equals the maximum instance count among all loaded tiles, which has the potential to be large.
const scratchVisited = [];
const scratchStack = [];
let marker = 0;

const scratchColorBytes = new Array(4);

const scratchColor = null; //new Color();

export default class Tile3DBatchTable {
  constructor(batchTableJson, batchTableBinary, featuresLength) {
    this.json = batchTableJson;
    this.binary = batchTableBinary;
  }

  getExtension(extensionName) {
    return this.json && this.json.extensions && this.json.extensions[extensionName];
  }

  // eslint-disable-next-line max-statements
  initialize(batchTableJson, batchTableBinary, featuresLength) {
    this.featuresLength = featuresLength;

    this._translucentFeaturesLength = 0; // Number of features in the tile that are translucent

    this._extensions = (batchTableJson && batchTableJson.extensions) || {};

    const properties = initializeProperties(batchTableJson);
    this._properties = properties;

    this._batchTableHierarchy = initializeHierarchy(this, batchTableJson, batchTableBinary);
    this._batchTableBinaryProperties = getBinaryProperties(featuresLength, properties, batchTableBinary);

    // PERFORMANCE_IDEA: These parallel arrays probably generate cache misses in get/set color/show
    // and use A LOT of memory.  How can we use less memory?
    this._showAlphaProperties = null; // [Show (0 or 255), Alpha (0 to 255)] property for each feature
    this._batchValues = null;  // Per-feature RGBA (A is based on the color's alpha and feature's show property)

    this._batchValuesDirty = false;
    this._batchTexture = null;
    this._defaultTexture = null;

    this._pickTexture = null;
    this._pickIds = [];

    this._content = content;

    this._colorChangedCallback = colorChangedCallback;

    // Dimensions for batch and pick textures
    let textureDimensions;
    let textureStep;

    if (featuresLength > 0) {
      // PERFORMANCE_IDEA: this can waste memory in the last row in the uncommon case
      // when more than one row is needed (e.g., > 16K features in one tile)
      const width = Math.min(featuresLength, ContextLimits.maximumTextureSize);
      const height = Math.ceil(featuresLength / ContextLimits.maximumTextureSize);
      const stepX = 1.0 / width;
      const centerX = stepX * 0.5;
      const stepY = 1.0 / height;
      const centerY = stepY * 0.5;

      textureDimensions = new Cartesian2(width, height);
      textureStep = new Cartesian4(stepX, centerX, stepY, centerY);
    }

    this._textureDimensions = textureDimensions;
    this._textureStep = textureStep;
  }

  memorySizeInBytes() {
    return 0;
  }

  setShow(batchId, show) {
    //>>includeStart('debug', pragmas.debug);
    if (show && !defined(this._showAlphaProperties)) {
      // Avoid allocating since the default is show = true
      return;
    }

    const showAlphaProperties = getShowAlphaProperties(this);
    const propertyOffset = batchId * 2;

    const newShow = show ? 255 : 0;
    if (showAlphaProperties[propertyOffset] !== newShow) {
      showAlphaProperties[propertyOffset] = newShow;

      const batchValues = getBatchValues(this);

      // Compute alpha used in the shader based on show and color.alpha properties
      const offset = (batchId * 4) + 3;
      batchValues[offset] = show ? showAlphaProperties[propertyOffset + 1] : 0;

      this._batchValuesDirty = true;
    }
  }

  setAllShow(show) {
    const featuresLength = this.featuresLength;
    for (let i = 0; i < featuresLength; ++i) {
      this.setShow(i, show);
    }
  }

  getShow(batchId) {
    //>>includeStart('debug', pragmas.debug);
    this._checkBatchId(batchId, this.featuresLength);
    //>>includeEnd('debug');

    if (!defined(this._showAlphaProperties)) {
      // Avoid allocating since the default is show = true
      return true;
    }

    const offset = batchId * 2;
    return (this._showAlphaProperties[offset] === 255);
  }

  setColor(batchId, color) {
    //>>includeStart('debug', pragmas.debug);
    this._checkBatchId(batchId, this.featuresLength);
    Check.typeOf.object('color', color);
    //>>includeEnd('debug');

    if (Color.equals(color, DEFAULT_COLOR_VALUE) && !defined(this._batchValues)) {
      // Avoid allocating since the default is white
      return;
    }

    const newColor = color.toBytes(scratchColorBytes);
    const newAlpha = newColor[3];

    const batchValues = getBatchValues(this);
    const offset = batchId * 4;

    const showAlphaProperties = getShowAlphaProperties(this);
    const propertyOffset = batchId * 2;

    if ((batchValues[offset] !== newColor[0]) ||
      (batchValues[offset + 1] !== newColor[1]) ||
      (batchValues[offset + 2] !== newColor[2]) ||
      (showAlphaProperties[propertyOffset + 1] !== newAlpha)) {

      batchValues[offset] = newColor[0];
      batchValues[offset + 1] = newColor[1];
      batchValues[offset + 2] = newColor[2];

      const wasTranslucent = (showAlphaProperties[propertyOffset + 1] !== 255);

      // Compute alpha used in the shader based on show and color.alpha properties
      const show = showAlphaProperties[propertyOffset] !== 0;
      batchValues[offset + 3] = show ? newAlpha : 0;
      showAlphaProperties[propertyOffset + 1] = newAlpha;

      // Track number of translucent features so we know if this tile needs
      // opaque commands, translucent commands, or both for rendering.
      const isTranslucent = (newAlpha !== 255);
      if (isTranslucent && !wasTranslucent) {
        ++this._translucentFeaturesLength;
      } else if (!isTranslucent && wasTranslucent) {
        --this._translucentFeaturesLength;
      }

      this._batchValuesDirty = true;

      if (defined(this._colorChangedCallback)) {
        this._colorChangedCallback(batchId, color);
      }
    }
  }

  setAllColor(color) {
    // Check.typeOf.object('color', color);

    for (let i = 0; i < this.featuresLength; ++i) {
      this.setColor(i, color);
    }
  }

  getColor(batchId, result) {
    this._checkBatchId(batchId, this.featuresLength);
    // Check.typeOf.object('result', result);

    if (!defined(this._batchValues)) {
      return Color.clone(DEFAULT_COLOR_VALUE, result);
    }

    const batchValues = this._batchValues;
    const offset = batchId * 4;

    const showAlphaProperties = this._showAlphaProperties;
    const propertyOffset = batchId * 2;

    return Color.fromBytes(batchValues[offset],
      batchValues[offset + 1],
      batchValues[offset + 2],
      showAlphaProperties[propertyOffset + 1],
      result);
  }

  getPickColor(batchId) {
    this._checkBatchId(batchId, this.featuresLength);
    return this._pickIds[batchId];
  }

  applyStyle(frameState, style) {
    if (!style) {
      this.setAllColor(DEFAULT_COLOR_VALUE);
      this.setAllShow(true);
      return;
    }

    const content = this._content;
    const length = this.featuresLength;
    for (let i = 0; i < length; ++i) {
      const feature = content.getFeature(i);
      const color = defined(style.color) ? style.color.evaluateColor(frameState, feature, scratchColor) : DEFAULT_COLOR_VALUE;
      const show = defined(style.show) ? style.show.evaluate(frameState, feature) : DEFAULT_SHOW_VALUE;
      this.setColor(i, color);
      this.setShow(i, show);
    }
  }

  isClass(batchId, className) {
    this._checkBatchId(batchId, this.featuresLength);
    assert(typeof className === 'string', className);

    // PERFORMANCE_IDEA : cache results in the ancestor classes to speed up this check if this area becomes a hotspot
    const hierarchy = this._batchTableHierarchy;
    if (!defined(hierarchy)) {
      return false;
    }

    // PERFORMANCE_IDEA : treat class names as integers for faster comparisons
    const result = traverseHierarchy(hierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instanceClass = hierarchy.classes[classId];
      if (instanceClass.name === className) {
        return true;
      }
    });
    return defined(result);
  }

  isExactClass(batchId, className) {
    assert(typeof className === 'string', className);

    return this.getExactClassName(batchId) === className;
  }

  getExactClassName(batchId) {
    this._checkBatchId(batchId, this.featuresLength);

    const hierarchy = this._batchTableHierarchy;
    if (!defined(hierarchy)) {
      return undefined;
    }
    const classId = hierarchy.classIds[batchId];
    const instanceClass = hierarchy.classes[classId];
    return instanceClass.name;
  }

  hasProperty(batchId, name) {
    this._checkBatchId(batchId, this.featuresLength);
    assert(typeof name === 'string', name);

    return (defined(this._properties[name])) || this._hasPropertyInHierarchy(batchId, name);
  }

  getPropertyNames(batchId, results) {
    this._checkBatchId(batchId, this.featuresLength);

    results = defined(results) ? results : [];
    results.length = 0;

    const propertyNames = Object.keys(this._properties);
    results.push(...propertyNames);

    if (this._batchTableHierarchy) {
      this._getPropertyNamesInHierarchy(batchId, results);
    }

    return results;
  }

  getProperty(batchId, name) {
    this._checkBatchId(batchId, this.featuresLength);
    assert(typeof name === 'string', name);

    if (defined(this._batchTableBinaryProperties)) {
      const binaryProperty = this._batchTableBinaryProperties[name];
      if (defined(binaryProperty)) {
        return this.getBinaryProperty(binaryProperty, batchId);
      }
    }

    const propertyValues = this._properties[name];
    if (defined(propertyValues)) {
      return clone(propertyValues[batchId], true);
    }

    if (defined(this._batchTableHierarchy)) {
      const hierarchyProperty = this._getHierarchyProperty(batchId, name);
      if (defined(hierarchyProperty)) {
        return hierarchyProperty;
      }
    }

    return undefined;
  }

  setProperty(batchId, name, value) {
    const featuresLength = this.featuresLength;

    this._checkBatchId(batchId, featuresLength);
    assert(typeof name === 'string', name);

    if (this._batchTableBinaryProperties) {
      const binaryProperty = this._batchTableBinaryProperties[name];
      if (binaryProperty) {
        this.setBinaryProperty(binaryProperty, batchId, value);
        return;
      }
    }

    if (defined(this._batchTableHierarchy)) {
      if (this._setHierarchyProperty(this, batchId, name, value)) {
        return;
      }
    }

    let propertyValues = this._properties[name];
    if (!defined(propertyValues)) {
      // Property does not exist. Create it.
      this._properties[name] = new Array(featuresLength);
      propertyValues = this._properties[name];
    }

    propertyValues[batchId] = clone(value, true);
  }

  getBinaryProperty(binaryProperty, index) {
    const typedArray = binaryProperty.typedArray;
    const componentCount = binaryProperty.componentCount;
    if (componentCount === 1) {
      return typedArray[index];
    }
    return binaryProperty.type.unpack(typedArray, index * componentCount);
  }

  setBinaryProperty(binaryProperty, index, value) {
    const typedArray = binaryProperty.typedArray;
    const componentCount = binaryProperty.componentCount;
    if (componentCount === 1) {
      typedArray[index] = value;
    } else {
      binaryProperty.type.pack(value, typedArray, index * componentCount);
 this._hasPropertyInHierarchy(batchId, name){
    if (!this._batchTableHierarchy) {
      return false;
    }
    const result = traverseHierarchy(this._batchTableHierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instances = hierarchy.classes[classId].instances;
      if (defined(instances[name])) {
        return true;
      }
    });
    return defined(result);
  }

  _getPropertyNamesInHierarchy(batchId, results) {
    traverseHierarchy(this._batchTableHierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instances = hierarchy.classes[classId].instances;
      for (const name in instances) {
        if (instances.hasOwnProperty(name)) {
          if (results.indexOf(name) === -1) {
            results.push(name);
          }
        }
      }
    });
  }

  _getHierarchyProperty(batchId, name) {
    return traverseHierarchy(this._batchTableHierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instanceClass = hierarchy.classes[classId];
      const indexInClass = hierarchy.classIndexes[instanceIndex];
      const propertyValues = instanceClass.instances[name];
      if (defined(propertyValues)) {
        if (defined(propertyValues.typedArray)) {
          return this.getBinaryProperty(propertyValues, indexInClass);
        }
        return clone(propertyValues[indexInClass], true);
      }
    });
  }

  _setHierarchyProperty(batchTable, batchId, name, value) {
    const result = traverseHierarchy(this._batchTableHierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instanceClass = hierarchy.classes[classId];
      const indexInClass = hierarchy.classIndexes[instanceIndex];
      const propertyValues = instanceClass.instances[name];
      if (defined(propertyValues)) {
        assert(instanceIndex === batchId, `Inherited property "${name}" is read-only.`);
        if (defined(propertyValues.typedArray)) {
          this.setBinaryProperty(propertyValues, indexInClass, value);
        } else {
          propertyValues[indexInClass] = clone(value, true);
        }
        return true;
      }
    });
    return defined(result);
  }

  _checkBatchId(batchId, featuresLength) {
    if (!Number.isFinite(batchId) || (batchId < 0) || (batchId > featuresLength)) {
      throw new Error(`batchId is required and between zero and featuresLength - 1 (${featuresLength}).`);
    }
  }
}

function initializeProperties(jsonHeader) {
  const properties = {};

  if (!jsonHeader) {
    return properties;
  }

  for (const propertyName in jsonHeader) {
    if (jsonHeader.hasOwnProperty(propertyName)
        && propertyName !== 'HIERARCHY' // Deprecated HIERARCHY property
        && propertyName !== 'extensions'
        && propertyName !== 'extras') {
      properties[propertyName] = clone(jsonHeader[propertyName], true);
    }
  }

  return properties;
}

function getByteLength(batchTable) {
  const dimensions = batchTable._textureDimensions;
  return (dimensions.x * dimensions.y) * 4;
}

function getBatchValues(batchTable) {
  if (!defined(batchTable._batchValues)) {
    // Default batch texture to RGBA = 255: white highlight (RGB) and show/alpha = true/255 (A).
    const byteLength = getByteLength(batchTable);
    const bytes = new Uint8Array(byteLength);
    bytes.fill(255);
    batchTable._batchValues = bytes;
  }

  return batchTable._batchValues;
}

function getShowAlphaProperties(batchTable) {
  if (!defined(batchTable._showAlphaProperties)) {
    const byteLength = 2 * batchTable.featuresLength;
    const bytes = new Uint8Array(byteLength);
    // [Show = true, Alpha = 255]
    bytes.fill(255);
    batchTable._showAlphaProperties = bytes;
  }
  return batchTable._showAlphaProperties;
}

function getBinaryProperties(featuresLength, properties, binaryBody) {
  let binaryProperties;
  for (const name in properties) {
    if (properties.hasOwnProperty(name)) {
      const property = properties[name];
      if ('byteOffset' in property) {
        // This is a binary property
        const componentType = property.componentType;
        const type = property.type;
        assert(Number.isFinite(property.componentType), 'componentType is required.');
        if (!defined(type)) {
          throw new Error('type is required.');
        }
        if (!defined(binaryBody)) {
          throw new Error('Property ' + name + ' requires a batch table binary.');
        }

        const binaryAccessor = getBinaryAccessor(property);
        const componentCount = binaryAccessor.componentsPerAttribute;
        const classType = binaryAccessor.classType;

        const byteOffset = property.byteOffset;
        const typedArray = binaryAccessor.createArrayBufferView(binaryBody.buffer, binaryBody.byteOffset + byteOffset, featuresLength);

        if (!defined(binaryProperties)) {
          binaryProperties = {};
        }

        // Store any information needed to access the binary data, including the typed array,
        // componentCount (e.g. a VEC4 would be 4), and the type used to pack and unpack (e.g. Cartesian4).
        binaryProperties[name] = {
          typedArray,
          componentCount,
          type: classType
        };
      }
    }
  }
  return binaryProperties;
}

function initializeHierarchy(batchTable, jsonHeader, binaryBody) {
  if (!jsonHeader) {
    return;
  }

  let hierarchy = batchTable.getExtension('3DTILES_batch_table_hierarchy');

  const legacyHierarchy = jsonHeader.HIERARCHY;
  if (legacyHierarchy) {
    console.warn('3D Tile Parser: Batch table HIERARCHY property is deprecated. Use 3DTILES_batch_table_hierarchy extension instead.');
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
  const instancesLength = hierarchyJson.instancesLength;
  const classes = hierarchyJson.classes;
  const classIds = hierarchyJson.classIds;
  const parentCounts = hierarchyJson.parentCounts;
  const parentIds = hierarchyJson.parentIds;
  const parentIdsLength = instancesLength;

  if (defined(classIds.byteOffset)) {
    classIds.componentType = defaultValue(classIds.componentType, GL.UNSIGNED_SHORT);
    classIds.type = AttributeType.SCALAR;
    const binaryAccessor = getBinaryAccessor(classIds);
    classIds = binaryAccessor.createArrayBufferView(binaryBody.buffer, binaryBody.byteOffset + classIds.byteOffset, instancesLength);
  }

  let parentIndexes;
  if (defined(parentCounts)) {
    if (defined(parentCounts.byteOffset)) {
      parentCounts.componentType = defaultValue(parentCounts.componentType, GL.UNSIGNED_SHORT);
      parentCounts.type = AttributeType.SCALAR;
      const binaryAccessor = getBinaryAccessor(parentCounts);
      parentCounts = binaryAccessor.createArrayBufferView(binaryBody.buffer, binaryBody.byteOffset + parentCounts.byteOffset, instancesLength);
    }
    parentIndexes = new Uint16Array(instancesLength);
    parentIdsLength = 0;
    for (let i = 0; i < instancesLength; ++i) {
      parentIndexes[i] = parentIdsLength;
      parentIdsLength += parentCounts[i];
    }
  }

  if (defined(parentIds) && defined(parentIds.byteOffset)) {
    parentIds.componentType = defaultValue(parentIds.componentType, GL.UNSIGNED_SHORT);
    parentIds.type = AttributeType.SCALAR;
    const binaryAccessor = getBinaryAccessor(parentIds);
    parentIds = binaryAccessor.createArrayBufferView(binaryBody.buffer, binaryBody.byteOffset + parentIds.byteOffset, parentIdsLength);
  }

  const classesLength = classes.length;
  for (let i = 0; i < classesLength; ++i) {
    const classInstancesLength = classes[i].length;
    const properties = classes[i].instances;
    const binaryProperties = getBinaryProperties(classInstancesLength, properties, binaryBody);
    classes[i].instances = combine(binaryProperties, properties);
  }

  const classCounts = new Array(classesLength).fill(0);
  const classIndexes = new Uint16Array(instancesLength);
  for (let i = 0; i < instancesLength; ++i) {
    const classId = classIds[i];
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

// Traverse over the hierarchy and process each instance with the endConditionCallback.
// When the endConditionCallback returns a value, the traversal stops and that value is returned.
function traverseHierarchy(hierarchy, instanceIndex, endConditionCallback) {
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

  assert(instanceIndex < instancesLength,
    `Parent index ${instanceIndex} exceeds the total number of instances: ${instancesLength}`);
  assert(stack.indexOf(instanceIndex) === -1,
    'Circular dependency detected in the batch table hierarchy.');

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


function getBatchValues(batchTable) {
  if (!defined(batchTable._batchValues)) {
    // Default batch texture to RGBA = 255: white highlight (RGB) and show/alpha = true/255 (A).
    const byteLength = getByteLength(batchTable);
    const bytes = new Uint8Array(byteLength);
    bytes.fill(255);
    batchTable._batchValues = bytes;
  }

  return batchTable._batchValues;
}

function getByteLength(batchTable) {
  const dimensions = batchTable._textureDimensions;
  return (dimensions.x * dimensions.y) * 4;
}
