"use strict";module.export({padStringToByteAlignment:()=>padStringToByteAlignment,copyStringToDataView:()=>copyStringToDataView,copyBinaryToDataView:()=>copyBinaryToDataView});// UTILITIES

// PERFORMANCE IDEA: No need to copy string twice...
function padStringToByteAlignment(string, byteAlignment) {
  const length = string.length;
  const paddedLength = Math.ceil(length / byteAlignment) * byteAlignment; // Round up to the required alignment
  const padding = paddedLength - length;
  let whitespace = '';
  for (let i = 0; i < padding; ++i) {
    whitespace += ' ';
  }
  return string + whitespace;
}

function copyStringToDataView(dataView, byteOffset, string, byteLength) {
  if (dataView) {
    for (let i = 0; i < byteLength; i++) {
      dataView.setUint8(byteOffset + i, string.charCodeAt(i));
    }
  }
  return byteOffset + byteLength;
}

function copyBinaryToDataView(dataView, byteOffset, binary, byteLength) {
  if (dataView) {
    for (let i = 0; i < byteLength; i++) {
      dataView.setUint8(byteOffset + i, binary[i]);
      byteOffset++;
    }
  }
  return byteOffset + byteLength;
}
