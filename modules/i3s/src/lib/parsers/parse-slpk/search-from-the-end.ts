import {FileProvider} from 'modules/i3s/src/lib/parsers/parse-zip/file-provider';

export const searchFromTheEnd = async (file: FileProvider, target: number[]): Promise<bigint> => {
  const searchWindow = [
    await file.getUint8(file.length - 1n),
    await file.getUint8(file.length - 2n),
    await file.getUint8(file.length - 3n),
    undefined
  ];

  let targetOffset = 0n;

  // looking for the last record in the central directory
  for (let i = file.length - 4n; i > -1; i--) {
    searchWindow[3] = searchWindow[2];
    searchWindow[2] = searchWindow[1];
    searchWindow[1] = searchWindow[0];
    searchWindow[0] = await file.getUint8(i);
    if (searchWindow.every((val, index) => val === target[index])) {
      targetOffset = i;
      break;
    }
  }

  return targetOffset;
};
