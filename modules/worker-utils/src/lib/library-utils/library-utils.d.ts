/**
 * Dynamically loads a library ("module")
 *
 * - wasm library: Array buffer is returned
 * - js library: Parse JS is returned
 *
 * Method depends on environment
 * - browser - script element is created and installed on document
 * - worker - eval is called on global context
 * - node - file is required
 *
 * @param libraryUrl
 * @param moduleName
 * @param options
 */
export function loadLibrary(
  libraryUrl: string,
  moduleName?: string,
  options?: object
): Promise<any>;
export function getLibraryUrl(library, moduleName?: string, options?): string;
