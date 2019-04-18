import {GLType} from '@loaders.gl/math/gl-type';

const ComponentsPerAttribute = {
  SCALAR: 1,
  VEC2: 2,
  VEC3: 3,
  VEC4: 4,
  MAT2: 4,
  MAT3: 9,
  MAT4: 16
};

/*
const ClassPerType = {
  SCALAR: undefined,
  VEC2: Cartesian2,
  VEC3: Cartesian3,
  VEC4: Cartesian4,
  MAT2: Matrix2,
  MAT3: Matrix3,
  MAT4: Matrix4
};
*/

export function createTypedArrayFromAccessor(accessor, buffer, byteOffset, length) {
  const {componentType} = accessor;

  const type = typeof componentType === 'string' ? GLType.fromName(componentType) : componentType;
  const size = ComponentsPerAttribute[accessor.type];
  // const classType = ClassPerType[accessor.type];

  const values = GLType.createArrayBufferView(type, buffer, byteOffset, size * length);

  return {
    type,
    size,
    values

    // Deprecated
    // componentsPerAttribute: size,
    // classType
  };
}
