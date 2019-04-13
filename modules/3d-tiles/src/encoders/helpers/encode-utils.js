// UTILITIES

export function padStringToByteAlignment(string, byteAlignment) {
  const length = string.length;
  const paddedLength = Math.ceil(length / byteAlignment) * byteAlignment; // Round up to the required alignment
  const padding = paddedLength - length;
  let whitespace = '';
  for (let i = 0; i < padding; ++i) {
    whitespace += ' ';
  }
  return string + whitespace;
}
