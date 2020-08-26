/**
 * Write a file with data and name fileName to path
 *
 * @param path
 * @param data
 * @param slpk
 * @param fileName
 */
export function writeFile(path: string, data: string|Uint8Array|ArrayBuffer, slpk?:boolean, fileName?:string);

/**
 * Remove dir with path
 *
 * @param path
 */
export function removeDir(path: string): Promise<void>;

/**
 * Remove file with path
 *
 * @param path
 */
export function removeFile(path: string): Promise<void>;
