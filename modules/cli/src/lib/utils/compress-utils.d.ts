/**
 * Compress file to gzip file
 *
 * @param pathFile - the path to the file
 * @return the path to the gzip file
 */
export function compressFileWithGzip(pathFile: string): Promise<string>;

/**
 * Compress files from map into slpk file
 *
 * @param fileMap - map with file paths (key: output path, value: input path)
 * @param outputFile - output slpk file
 * @param level - compression level
 */
export function compressFilesWithZip(
  fileMap: object,
  outputFile: string,
  level: number
): Promise<void>;

/**
 * Compress files using external tool 'zip'
 *
 * @param inputFolder - folder to archive
 * @param outputFile - output slpk file
 * @param level - compression level
 */
export function compressWithChildProcess(
  inputFolder: string,
  outputFile: string,
  level: number
): Promise<void>;
