import {Type, AnyArrayType} from './arrow-like/type';

/**
 * Gets type information from an Arrow type object or "mock" Arrow type object
 * @param arrowTypeLike Arrow Type or type object of similar shape
 */
export function getTypeInfo(arrowTypeLike: any): {
  typeId: Type,
  ArrayType: AnyArrayType,
  typeName: string,
  typeEnumName?: string,
  precision?: number
};
