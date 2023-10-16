import {Tiles3DTileContent} from '@loaders.gl/3d-tiles';
import {GLTFPrimitiveModeString, PreprocessData, SchemaClass, SchemaClassProperty} from '../types';
import {
  EXT_STRUCTURAL_METADATA,
  GLTF,
  GLTFLoader,
  GLTF_EXT_feature_metadata_GLTF,
  GLTF_EXT_feature_metadata_Schema,
  GLTF_EXT_structural_metadata_GLTF,
  GLTF_EXT_structural_metadata_Schema
} from '@loaders.gl/gltf';
import {parse} from '@loaders.gl/core';
import {EXT_FEATURE_METADATA} from '@loaders.gl/gltf';

/**
 * glTF primitive modes
 * @see https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#_mesh_primitive_mode
 */
export const GLTF_PRIMITIVE_MODES = [
  GLTFPrimitiveModeString.POINTS, // 0
  GLTFPrimitiveModeString.LINES, // 1
  GLTFPrimitiveModeString.LINE_LOOP, // 2
  GLTFPrimitiveModeString.LINE_STRIP, // 3
  GLTFPrimitiveModeString.TRIANGLES, // 4
  GLTFPrimitiveModeString.TRIANGLE_STRIP, // 5
  GLTFPrimitiveModeString.TRIANGLE_FAN // 6
];

/**
 * Analyze tile content. This function is used during preprocess stage of
 * conversion
 * @param tileContent - 3DTiles tile content ArrayBuffer
 * @returns
 */
export const analyzeTileContent = async (
  tileContent: Tiles3DTileContent | null
): Promise<PreprocessData> => {
  const defaultResult = {
    meshTopologyTypes: new Set<GLTFPrimitiveModeString>(),
    metadataClasses: new Set<string>(),
    schemaClasses: new Array<SchemaClass>()
  };
  if (!tileContent?.gltfArrayBuffer) {
    return defaultResult;
  }

  const gltfData = await parse(tileContent.gltfArrayBuffer, GLTFLoader, {
    gltf: {normalize: false, loadBuffers: false, loadImages: false, decompressMeshes: false}
  });
  const gltf = gltfData.json;

  if (!gltf) {
    return defaultResult;
  }
  const meshTopologyTypes = getMeshTypesFromGLTF(gltf);
  const metadataClasses = getMetadataClassesFromGLTF(gltf);
  const schemaClasses = getSchemaClassesFromGLTF(gltf);
  return {
    meshTopologyTypes,
    metadataClasses,
    schemaClasses
  };
};

/**
 * Get mesh topology types that the glb content has
 * @param gltfJson - JSON part of GLB content
 * @returns array of mesh types found
 */
const getMeshTypesFromGLTF = (gltfJson: GLTF): Set<GLTFPrimitiveModeString> => {
  const result: Set<GLTFPrimitiveModeString> = new Set();
  for (const mesh of gltfJson.meshes || []) {
    for (const primitive of mesh.primitives) {
      let {mode} = primitive;
      if (typeof mode !== 'number') {
        mode = 4; // Default is 4 - TRIANGLES
      }
      result.add(GLTF_PRIMITIVE_MODES[mode]);
    }
  }
  return result;
};

/**
 * Get feature metadata classes from glTF
 * The tileset might contain multiple metadata classes provided by EXT_feature_metadata and EXT_structural_metadata extensions.
 * Every class is a set of properties. But I3S can consume only one set of properties.
 * On the pre-process we collect all classes from the tileset in order to show the prompt to select one class for conversion to I3S.
 * @param gltfJson - JSON part of GLB content
 * @returns array of classes
 */
const getMetadataClassesFromGLTF = (gltfJson: GLTF): Set<string> => {
  const result: Set<string> = new Set();

  // Try to parse from EXT_feature_metadata
  const extFeatureMetadataClasses = (
    gltfJson.extensions?.[EXT_FEATURE_METADATA] as GLTF_EXT_feature_metadata_GLTF
  )?.schema?.classes;

  if (extFeatureMetadataClasses) {
    for (const classKey of Object.keys(extFeatureMetadataClasses)) {
      result.add(classKey);
    }
  }

  // Try to parse from EXT_structural_metadata
  const extStructuralMetadataClasses = (
    gltfJson.extensions?.[EXT_STRUCTURAL_METADATA] as GLTF_EXT_structural_metadata_GLTF
  )?.schema?.classes;
  if (extStructuralMetadataClasses) {
    for (const classKey of Object.keys(extStructuralMetadataClasses)) {
      result.add(classKey);
    }
  }

  return result;
};

/**
 * Get schemas of feature metadata classes from glTF
 * On the pre-process we collect schemas of all classes from the tileset
 * in order to have the complete information on all properties (attributes).
 * @param gltfJson - JSON part of GLB content
 * @returns array of schemas
 */
const getSchemaClassesFromGLTF = (gltfJson: GLTF): Array<SchemaClass> => {
  let result: Array<SchemaClass> = new Array<SchemaClass>();

  // Try to parse from EXT_feature_metadata
  const extFeatureMetadataSchema = (
    gltfJson.extensions?.[EXT_FEATURE_METADATA] as GLTF_EXT_feature_metadata_GLTF
  )?.schema;
  if (extFeatureMetadataSchema) {
    getSchemaClassesForExtFeatureMetadata(extFeatureMetadataSchema, result);
  }
  // Try to parse from EXT_structural_metadata
  const extStructuralMetadataSchema = (
    gltfJson.extensions?.[EXT_STRUCTURAL_METADATA] as GLTF_EXT_structural_metadata_GLTF
  )?.schema;
  if (extStructuralMetadataSchema) {
    getSchemaClassesForExtStructuralMetadata(extStructuralMetadataSchema, result);
  }

  return result;
};

/**
 * Gets all schemas from Ext_feature_metadata classes
 * @param schema - Schema of the Ext_feature_metadata class
 * @param schemaClassArray - destination array containg schema processed
 */
const getSchemaClassesForExtFeatureMetadata = (
  schema: GLTF_EXT_feature_metadata_Schema,
  schemaClassArray: Array<SchemaClass>
): void => {
  const schemaClasses = schema?.classes;

  if (schemaClasses) {
    for (const classKey of Object.keys(schemaClasses)) {
      let schemaClass = schemaClassArray.find((item) => item.classId === classKey);
      if (!schemaClass) {
        const classObject = schemaClasses[classKey];
        const schemaClassProperties: {[key: string]: SchemaClassProperty} = {};
        for (const propertyName in classObject.properties) {
          const property = classObject.properties[propertyName];
          const schemaClassProperty: SchemaClassProperty = {
            propertyType: property.componentType
              ? [
                  'INT8',
                  'INT16',
                  'UINT16',
                  'INT32',
                  'UINT32',
                  'INT64',
                  'UINT64',
                  'FLOAT32',
                  'FLOAT64',
                  'UINT8'
                ].includes(property.componentType)
                ? property.componentType
                : 'string'
              : 'string',

            array: property.type === 'ARRAY'
          };
          schemaClassProperties[propertyName] = schemaClassProperty;
        }
        schemaClass = {
          schemaId: undefined,
          classId: classKey,
          classObject: classObject,
          properties: schemaClassProperties
        };
        schemaClassArray.push(schemaClass);
      }
    }
  }
};

/**
 * Gets all schemas from Ext_structural_metadata classes
 * @param schema - Schema of the Ext_feature_metadata class
 * @param schemaClassArray - destination array containg schema processed
 */
const getSchemaClassesForExtStructuralMetadata = (
  schema: GLTF_EXT_structural_metadata_Schema,
  schemaClassArray: Array<SchemaClass>
): void => {
  const schemaClasses = schema?.classes;

  if (schemaClasses) {
    for (const classKey of Object.keys(schemaClasses)) {
      let schemaClass = schemaClassArray.find(
        (item) => item.schemaId === schema.id && item.classId === classKey
      );
      if (!schemaClass) {
        const classObject = schemaClasses[classKey];
        const schemaClassProperties: {[key: string]: SchemaClassProperty} = {};
        for (const propertyName in classObject.properties) {
          const property = classObject.properties[propertyName];
          const schemaClassProperty: SchemaClassProperty = {
            propertyType: property.array ? 'string' : property.componentType || 'string',
            array: !!property.array
          };
          schemaClassProperties[propertyName] = schemaClassProperty;
        }
        schemaClass = {
          schemaId: schema.id,
          classId: classKey,
          classObject: classObject,
          properties: schemaClassProperties
        };
        schemaClassArray.push(schemaClass);
      }
    }
  }
};

/**
 * Merge object2 into object1
 * @param object1
 * @param object2
 * @returns nothing
 */
export const mergePreprocessData = (object1: PreprocessData, object2: PreprocessData): void => {
  // Merge topology mesh types info
  for (const type of object2.meshTopologyTypes) {
    object1.meshTopologyTypes.add(type);
  }

  // Merge feature metadata classes
  for (const metadataClass of object2.metadataClasses) {
    object1.metadataClasses.add(metadataClass);
  }

  // Merge schema classes
  for (const schemaClass of object2.schemaClasses) {
    const classObject = object1.schemaClasses.find(
      (item) =>
        (!schemaClass.schemaId || item.schemaId === schemaClass.schemaId) &&
        item.classId === schemaClass.classId
    );
    if (!classObject) {
      object1.schemaClasses.push(schemaClass);
    }
  }
};
