/**
 * Write a file with data and name fileName to path
 *
 * @param path - output path
 * @param data - file content
 * @param fileName - name of output file (default: index.json)
 */
export function writeFile(path: string, data: string | Uint8Array | ArrayBuffer, fileName?: string);

/**
 * Write a file with data and name fileName to path - specific one for further packaging into slpk
 *
 * @param path - output path
 * @param data - file content
 * @param fileName - name of output file (default: index.json)
 * @param compress - if need to compress file with gzip (default: true)
 */
export function writeFileForSlpk(
  path: string,
  data: string | Uint8Array | ArrayBuffer,
  fileName?: string,
  compress?: boolean
);

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

/**
 * Generates absolute file path
 * @param filePath 
 */
export function getAbsoluteFilePath(filePath: string): string;
