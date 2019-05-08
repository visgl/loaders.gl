"use strict";module.export({getStringFromArrayBuffer:()=>getStringFromArrayBuffer,getStringFromTypedArray:()=>getStringFromTypedArray,getMagicString:()=>getMagicString});var TextDecoder,assert;module.link('@loaders.gl/core',{TextDecoder(v){TextDecoder=v},assert(v){assert=v}},0);

// Decode the JSON binary array into clear text
function getStringFromArrayBuffer(arrayBuffer, byteOffset, byteLength) {
  assert(arrayBuffer instanceof ArrayBuffer);
  const textDecoder = new TextDecoder('utf8');
  const typedArray = new Uint8Array(arrayBuffer, byteOffset, byteLength);
  const string = textDecoder.decode(typedArray);
  return string;
}

// Decode the JSON binary array into clear text
function getStringFromTypedArray(typedArray) {
  assert(ArrayBuffer.isView(typedArray));
  const textDecoder = new TextDecoder('utf8');
  const string = textDecoder.decode(typedArray);
  return string;
}

function getMagicString(arrayBuffer, byteOffset = 0) {
  const dataView = new DataView(arrayBuffer);
  return `\
${String.fromCharCode(dataView.getUint8(byteOffset + 0))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 1))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 2))}\
${String.fromCharCode(dataView.getUint8(byteOffset + 3))}`;
}
