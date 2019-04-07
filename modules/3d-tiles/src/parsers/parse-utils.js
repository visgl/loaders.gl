export function getStringFromTypedArray() {
  // Decode the JSON binary array into clear text
  const textDecoder = new TextDecoder('utf8');
  const jsonText = textDecoder.decode(jsonChunk);
  return jsonText;
}

export function getMagicString(dataView, byteOffset = 0) {
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}
