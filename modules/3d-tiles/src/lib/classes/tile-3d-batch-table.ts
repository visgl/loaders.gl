// This file is derived from the Cesium code base under Apache 2 license
// See LICENSE.md and https://github.com/AnalyticalGraphicsInc/cesium/blob/master/LICENSE.md

import {assert} from '@loaders.gl/loader-utils';

import {createTypedArrayFromAccessor} from './helpers/tile-3d-accessor-utils';
import {initializeHierarchy, traverseHierarchy} from './tile-3d-batch-table-hierarchy';

function defined(x) {
  return x !== undefined && x !== null;
}

const clone = (x, y) => x;

// These top level fields in the batch table json are not properties
const IGNORED_PROPERTY_FIELDS = {
  HIERARCHY: true, // Deprecated HIERARCHY property
  extensions: true,
  extras: true
};

// The size of this array equals the maximum instance count among all loaded tiles, which has the potential to be large.
export default class Tile3DBatchTableParser {
  json;
  binary;
  featureCount;
  _extensions;
  // Copy all top-level property fields from the json object, ignoring special fields
  _properties;
  _binaryProperties;
  // TODO: hierarchy support is only partially implemented and not tested
  _hierarchy;

  constructor(json, binary, featureCount, options = {}) {
    assert(featureCount >= 0);
    this.json = json || {};
    this.binary = binary;
    this.featureCount = featureCount;

    this._extensions = this.json?.extensions || {};

    // Copy all top-level property fields from the json object, ignoring special fields
    this._properties = {};
    for (const propertyName in this.json) {
      if (!IGNORED_PROPERTY_FIELDS[propertyName]) {
        this._properties[propertyName] = this.json[propertyName];
      }
    }

    this._binaryProperties = this._initializeBinaryProperties();

    // TODO: hierarchy support is only partially implemented and not tested
    if (options['3DTILES_batch_table_hierarchy']) {
      this._hierarchy = initializeHierarchy(this, this.json, this.binary);
    }
  }

  getExtension(extensionName) {
    return this.json && this.json.extensions && this.json.extensions[extensionName];
  }

  memorySizeInBytes(): number {
    return 0;
  }

  isClass(batchId, className: string): boolean {
    this._checkBatchId(batchId);
    assert(typeof className === 'string', className);

    // extension: 3DTILES_batch_table_hierarchy
    if (this._hierarchy) {
      // PERFORMANCE_IDEA : cache results in the ancestor classes
      //   to speed up this check if this area becomes a hotspot
      // PERFORMANCE_IDEA : treat class names as integers for faster comparisons
      const result = traverseHierarchy(this._hierarchy, batchId, (hierarchy, instanceIndex) => {
        const classId = hierarchy.classIds[instanceIndex];
        const instanceClass = hierarchy.classes[classId];
        return instanceClass.name === className;
      });
      return defined(result);
    }

    return false;
  }

  isExactClass(batchId, className) {
    assert(typeof className === 'string', className);

    return this.getExactClassName(batchId) === className;
  }

  getExactClassName(batchId) {
    this._checkBatchId(batchId);

    // extension: 3DTILES_batch_table_hierarchy
    if (this._hierarchy) {
      const classId = this._hierarchy.classIds[batchId];
      const instanceClass = this._hierarchy.classes[classId];
      return instanceClass.name;
    }

    return undefined;
  }

  hasProperty(batchId, name) {
    this._checkBatchId(batchId);
    assert(typeof name === 'string', name);

    return defined(this._properties[name]) || this._hasPropertyInHierarchy(batchId, name);
  }

  getPropertyNames(batchId, results) {
    this._checkBatchId(batchId);

    results = defined(results) ? results : [];
    results.length = 0;

    const propertyNames = Object.keys(this._properties);
    results.push(...propertyNames);

    if (this._hierarchy) {
      this._getPropertyNamesInHierarchy(batchId, results);
    }

    return results;
  }

  getProperty(batchId, name) {
    this._checkBatchId(batchId);
    assert(typeof name === 'string', name);

    if (this._binaryProperties) {
      const binaryProperty = this._binaryProperties[name];
      if (defined(binaryProperty)) {
        return this._getBinaryProperty(binaryProperty, batchId);
      }
    }

    const propertyValues = this._properties[name];
    if (defined(propertyValues)) {
      return clone(propertyValues[batchId], true);
    }

    // EXTENSION: 3DTILES_batch_table_hierarchy
    if (this._hierarchy) {
      const hierarchyProperty = this._getHierarchyProperty(batchId, name);
      if (defined(hierarchyProperty)) {
        return hierarchyProperty;
      }
    }

    return undefined;
  }

  setProperty(batchId, name, value) {
    const featureCount = this.featureCount;

    this._checkBatchId(batchId);
    assert(typeof name === 'string', name);

    if (this._binaryProperties) {
      const binaryProperty = this._binaryProperties[name];
      if (binaryProperty) {
        this._setBinaryProperty(binaryProperty, batchId, value);
        return;
      }
    }

    // EXTENSION: 3DTILES_batch_table_hierarchy
    if (this._hierarchy) {
      if (this._setHierarchyProperty(this, batchId, name, value)) {
        return;
      }
    }

    let propertyValues = this._properties[name];
    if (!defined(propertyValues)) {
      // Property does not exist. Create it.
      this._properties[name] = new Array(featureCount);
      propertyValues = this._properties[name];
    }

    propertyValues[batchId] = clone(value, true);
  }

  // PRIVATE METHODS

  _checkBatchId(batchId) {
    const valid = batchId >= 0 && batchId < this.featureCount;
    if (!valid) {
      throw new Error('batchId not in range [0, featureCount - 1].');
    }
  }

  _getBinaryProperty(binaryProperty, index) {
    return binaryProperty.unpack(binaryProperty.typedArray, index);
  }

  _setBinaryProperty(binaryProperty, index, value) {
    binaryProperty.pack(value, binaryProperty.typedArray, index);
  }

  _initializeBinaryProperties() {
    let binaryProperties: Record<string, any> | null = null;
    for (const name in this._properties) {
      const property = this._properties[name];
      const binaryProperty = this._initializeBinaryProperty(name, property);
      // Store any information needed to access the binary data, including the typed array,
      // componentCount (e.g. a VEC4 would be 4), and the type used to pack and unpack (e.g. Cartesian4).
      if (binaryProperty) {
        binaryProperties = binaryProperties || {};
        binaryProperties[name] = binaryProperty;
      }
    }
    return binaryProperties;
  }

  _initializeBinaryProperty(name, property) {
    if ('byteOffset' in property) {
      // This is a binary property
      const tile3DAccessor = property;

      assert(this.binary, `Property ${name} requires a batch table binary.`);
      assert(tile3DAccessor.type, `Property ${name} requires a type.`);

      const accessor = createTypedArrayFromAccessor(
        tile3DAccessor,
        this.binary.buffer,
        this.binary.byteOffset | 0,
        this.featureCount
      );

      // Store any information needed to access the binary data, including the typed array,
      // componentCount (e.g. a VEC4 would be 4), and the type used to pack and unpack (e.g. Cartesian4).
      return {
        typedArray: accessor.values,
        componentCount: accessor.size,
        unpack: accessor.unpacker,
        pack: accessor.packer
      };
    }

    return null;
  }

  //  EXTENSION SUPPORT: 3DTILES_batch_table_hierarchy

  _hasPropertyInHierarchy(batchId, name) {
    if (!this._hierarchy) {
      return false;
    }

    const result = traverseHierarchy(this._hierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instances = hierarchy.classes[classId].instances;
      return defined(instances[name]);
    });

    return defined(result);
  }

  _getPropertyNamesInHierarchy(batchId, results) {
    traverseHierarchy(this._hierarchy, batchId, (hierarchy, instanceIndex) => {
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
    return traverseHierarchy(this._hierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instanceClass = hierarchy.classes[classId];
      const indexInClass = hierarchy.classIndexes[instanceIndex];
      const propertyValues = instanceClass.instances[name];
      if (defined(propertyValues)) {
        if (defined(propertyValues.typedArray)) {
          return this._getBinaryProperty(propertyValues, indexInClass);
        }
        return clone(propertyValues[indexInClass], true);
      }
      return null;
    });
  }

  _setHierarchyProperty(batchTable, batchId, name, value) {
    const result = traverseHierarchy(this._hierarchy, batchId, (hierarchy, instanceIndex) => {
      const classId = hierarchy.classIds[instanceIndex];
      const instanceClass = hierarchy.classes[classId];
      const indexInClass = hierarchy.classIndexes[instanceIndex];
      const propertyValues = instanceClass.instances[name];
      if (defined(propertyValues)) {
        assert(instanceIndex === batchId, `Inherited property "${name}" is read-only.`);
        if (defined(propertyValues.typedArray)) {
          this._setBinaryProperty(propertyValues, indexInClass, value);
        } else {
          propertyValues[indexInClass] = clone(value, true);
        }
        return true;
      }
      return false;
    });
    return defined(result);
  }
}
