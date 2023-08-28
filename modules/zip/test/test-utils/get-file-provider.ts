import {fetchFile, isBrowser} from '@loaders.gl/core';
import {DataViewFile, FileHandleFile, FileProvider} from '../../src';

export const getFileProvider = async (fileName: string) => {
  let fileProvider: FileProvider;
  if (isBrowser) {
    const fileResponse = await fetchFile(fileName);
    const file = await fileResponse.arrayBuffer();
    fileProvider = new DataViewFile(new DataView(file));
  } else {
    fileProvider = await FileHandleFile.from(fileName);
  }
  return fileProvider;
};
