import {LoaderObject} from '@loaders.gl/loader-utils';

type FileType = string | File | Blob | Response;

/**
 * Parses `data` using a specified loader
 * @param data
 * @param loaders
 * @param options
 * @param context
 */
export function loadInBatches(
  url: FileType,
  loaders: LoaderObject | LoaderObject[],
  options?: object,
  context?: object
): Promise<AsyncIterable<any>>;

export function loadInBatches(
  files: FileType[] | FileList,
  loaders: LoaderObject | LoaderObject[],
  options?: object,
  context?: object
): Promise<AsyncIterable<any>>[];
