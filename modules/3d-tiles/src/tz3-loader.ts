import {LoaderOptions, LoaderWithParser} from '@loaders.gl/loader-utils';
import {DataViewFile} from '@loaders.gl/zip';
import {parse3tz as parse3tzFromProvider} from './tz3/tz3-parser';

// __VERSION__ is injected by babel-plugin-version-inline
// @ts-ignore TS2304: Cannot find name '__VERSION__'.
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : 'latest';

/** options to load data from 3tz */
export type Tiles3DArchiveFileLoaderOptions = LoaderOptions & {
  tz3?: {
    /** path inside the 3tz archive */
    path?: string;
  };
};

/**
 * Loader for 3tz packages
 */
export const Tiles3DArchiveFileLoader: LoaderWithParser<
  ArrayBuffer,
  never,
  Tiles3DArchiveFileLoaderOptions
> = {
  name: '3tz',
  id: '3tz',
  module: 'i3s',
  version: VERSION,
  mimeTypes: ['application/octet-stream', 'application/vnd.maxar.archive.3tz+zip'],
  parse: parse3tz,
  extensions: ['3tz'],
  options: {}
};

/**
 * returns a single file from the 3tz archive
 * @param data 3tz archive data
 * @param options options
 * @returns requested file
 */
async function parse3tz(
  data: ArrayBuffer,
  options: Tiles3DArchiveFileLoaderOptions = {}
): Promise<ArrayBuffer> {
  const archive = await parse3tzFromProvider(new DataViewFile(new DataView(data)));
  return archive.getFile(options.tz3?.path ?? '');
}
