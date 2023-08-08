import {IFileSystem} from '@loaders.gl/loader-utils';

/**
 * Long-term, this is intended to be a thin portability layer across cloud bucket storage systems
 * e.g. gcloud storage and s3...
 * Also an intention is to integrate seamlessly with loaders.gl if/where this makese sense,
 * (e.g. uploadFile on streams/async iterators...)
 */
export default class GStorageFileSystem implements IFileSystem {
  /**
   * @param options
   */
  constructor(options?: object);

  // implments IFileSystem
  fetch(filename: string, options?: object): Promise<Response>;
  readdir(path?: string): Promise<string[]>;
  stat(path: string, options?: object): Promise<{size: number}>;
  unlink(path: string): Promise<void>;

  // implements ICloudStorage
  writeFile(path: string, data: string | ArrayBuffer, options?: {resumable?: boolean});
  makePublic(path: string, public?: boolean): Promise<void>;
  getSignedUrl(path: string, action: string, contentType?): Promise<string>;
}
