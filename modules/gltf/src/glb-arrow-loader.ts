import {Matrix4} from '@math.gl/core';
import {Accessor, Node, PlatformIO, Primitive, WebIO} from '@gltf-transform/core';
import {KHRONOS_EXTENSIONS} from '@gltf-transform/extensions';
import {unweld, uninstance, dequantize} from '@gltf-transform/functions';
import * as arrow from 'apache-arrow';
import type {LoaderWithParser, LoaderOptions} from '@loaders.gl/loader-utils';
import {ArrowTable, DataType, Field, Schema, SchemaMetadata} from '@loaders.gl/schema';
import {deserializeArrowField, deserializeArrowType} from '@loaders.gl/schema-utils';
import {GLBLoader} from './glb-loader';

/** GLB Arrow loader options */
export type GLBArrowLoaderOptions = LoaderOptions & {
  io?: PlatformIO;
};

export type ArrowTableTransformList = [ArrowTable, Matrix4][];

/**
 * GLB Loader -
 * GLB is the binary container format for GLTF
 */
export const GLBArrowLoader = {
  ...GLBLoader,
  dataType: null as unknown as ArrowTableTransformList,
  batchType: null as never,
  worker: false,
  parse,
  parseSync: undefined
} as const satisfies LoaderWithParser<ArrowTableTransformList, never, GLBArrowLoaderOptions>;

async function parse(
  arrayBuffer: ArrayBuffer,
  options?: GLBArrowLoaderOptions
): Promise<ArrowTableTransformList> {
  const io = options?.io || new WebIO().registerExtensions(KHRONOS_EXTENSIONS);
  const document = await io.readBinary(new Uint8Array(arrayBuffer));

  // Unclear how represent indexed, instanced, or normalized meshes as
  // ArrowTable. Convert to simpler representations for now.
  await document.transform(unweld(), uninstance(), dequantize());

  const scene = document.getRoot().getDefaultScene() || document.getRoot().listScenes()[0];
  const meshList: ArrowTableTransformList = [];

  // Traverse the default scene, creating a list of mesh primitives and their
  // corresponding scene transforms.
  scene.traverse((node: Node) => {
    if (node.getMesh()) {
      const matrix = new Matrix4(node.getWorldMatrix());
      for (const prim of node.getMesh()!.listPrimitives()) {
        meshList.push([convertPrimitiveToArrowTable(prim), matrix]);
      }
    }
  });

  return meshList;
}

/**
 * Encodes a glTF Transform Primitive as an ArrowTable. Currently ignores
 * materials, morph targets, and extras.
 */
function convertPrimitiveToArrowTable(prim: Primitive): ArrowTable {
  const fields: Field[] = [];
  const arrowFields: arrow.Field[] = [];
  const arrowAttributes: arrow.Data[] = [];

  let vertexCount = -1;

  for (const name of prim.listSemantics()) {
    const attribute = prim.getAttribute(name)!;
    const type = componentTypeToDataType(attribute.getComponentType());

    const field: Field = {name, type};
    const arrowField = deserializeArrowField(field);
    const arrowAttribute = accessorToArrowListData(attribute);

    fields.push(field);
    arrowFields.push(arrowField);
    arrowAttributes.push(arrowAttribute);

    if (vertexCount <= 0) {
      vertexCount = attribute.getCount();
    }
  }

  const metadata: SchemaMetadata = {};
  const schema: Schema = {fields, metadata};

  const arrowSchema = new arrow.Schema(arrowFields);
  const arrowStruct = new arrow.Struct(arrowFields);
  const arrowData = new arrow.Data(arrowStruct, 0, vertexCount, 0, undefined, arrowAttributes);
  const arrowRecordBatch = new arrow.RecordBatch(arrowSchema, arrowData);
  const arrowTable = new arrow.Table([arrowRecordBatch]);

  return {shape: 'arrow-table', schema, data: arrowTable};
}

/** Encodes a glTF component type as an equivalent DataType string. */
function componentTypeToDataType(componentType: number): DataType {
  switch (componentType) {
    case Accessor.ComponentType.FLOAT:
      return 'float32';
    case Accessor.ComponentType.UNSIGNED_BYTE:
      return 'uint8';
    case Accessor.ComponentType.UNSIGNED_SHORT:
      return 'uint16';
    case Accessor.ComponentType.UNSIGNED_INT:
      return 'uint32';
    case Accessor.ComponentType.BYTE:
      return 'int8';
    case Accessor.ComponentType.SHORT:
      return 'int16';
    case Accessor.ComponentType.INT:
      return 'int32';
    default:
      throw new Error(`Unexpected component type, ${componentType}`);
  }
}

/** Encodes a glTF Transform Accessor as an arrow.Data list. */
function accessorToArrowListData(accessor: Accessor): arrow.Data<arrow.FixedSizeList> {
  const size = accessor.getElementSize();
  const count = accessor.getCount();
  const type = componentTypeToDataType(accessor.getComponentType());
  const arrowType = deserializeArrowType(type);
  const arrowList = new arrow.FixedSizeList(size, new arrow.Field('value', arrowType));
  const arrowNestedType = arrowList.children[0].type; // TODO: Eh?
  const buffers = {[arrow.BufferType.DATA]: accessor.getArray()};
  const arrowNestedData = new arrow.Data(arrowNestedType, 0, size * count, 0, buffers);
  const arrowData = new arrow.Data<arrow.FixedSizeList>(arrowList, 0, count, 0, undefined, [
    arrowNestedData
  ]);
  return arrowData;
}
