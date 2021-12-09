/* eslint-disable */
/**
 * from https://gitlab.com/taketwo/three-pcd-loader/blob/master/decompress-lzf.js
 * @param inData
 * @param outLength
 * @returns
 */
export function decompressLZF(inData, outLength) {
  const inLength = inData.length;
  const outData = new Uint8Array(outLength);
  let inPtr = 0;
  let outPtr = 0;
  let ctrl;
  let len;
  let ref;

  do {
    ctrl = inData[inPtr++];

    if (ctrl < 1 << 5) {
      ctrl++;
      if (outPtr + ctrl > outLength) throw new Error('Output buffer is not large enough');
      if (inPtr + ctrl > inLength) throw new Error('Invalid compressed data');

      do {
        outData[outPtr++] = inData[inPtr++];
      } while (--ctrl);
    } else {
      len = ctrl >> 5;
      ref = outPtr - ((ctrl & 0x1f) << 8) - 1;
      if (inPtr >= inLength) throw new Error('Invalid compressed data');

      if (len === 7) {
        len += inData[inPtr++];
        if (inPtr >= inLength) throw new Error('Invalid compressed data');
      }

      ref -= inData[inPtr++];
      if (outPtr + len + 2 > outLength) throw new Error('Output buffer is not large enough');
      if (ref < 0) throw new Error('Invalid compressed data');
      if (ref >= outPtr) throw new Error('Invalid compressed data');

      do {
        outData[outPtr++] = outData[ref++];
      } while (--len + 2);
    }
  } while (inPtr < inLength);

  return outData;
}
