import {Type} from './arrow-like/enum';

export function getTypeInfo(arrowTypeLike) {
  return {
    typeId: arrowTypeLike.typeId,
    ArrayType: arrowTypeLike.ArrayType,
    typeName: arrowTypeLike.toString(),
    typeEnumName: getTypeKey(arrowTypeLike.typeId),
    precision: arrowTypeLike.precision
  };
}

let ReverseType = null;

function getTypeKey(typeKey) {
  if (!ReverseType) {
    ReverseType = {};
    for (const key in Type) {
      ReverseType[Type[key]] = key;
    }
  }

  return ReverseType[typeKey];
}
