/**
 * Compress file to gzip file
 *
 * @param pathFile - the path to the file
 * @return the path to the gzip file
 */
export function compressFile(pathFile: string): Promise<string>;

/**
 * Compress files from map into slpk file
 *
 * @param fileMap - map with file paths (key: output path, value: input path)
 * @param outputFile - output slpk file
 * @param level - compression level
 */
export function compressFiles(fileMap: object, outputFile: string, level: number): void;
