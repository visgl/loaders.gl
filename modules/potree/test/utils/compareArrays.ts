const EPSILON = 0.000000001;
export function areNumberArraysEqual(array1, array2) {
  let result = true;
  if (array1.length !== array2.length) {
    return false;
  }
  for (let i = 0; i < array1.length; i++) {
    if (Math.abs(array1[i] - array2[i]) > EPSILON) {
      result = false;
      break;
    }
  }
  return result;
}
