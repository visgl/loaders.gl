import {SHXOutput} from './parse-shx';
import {SHPHeader} from './parse-shp-header';

interface ShapefileOutput {
  encoding: string;
  prj: string;
  shx: SHXOutput;
  header: SHPHeader;
  data: object[];
}

export function parseShapefileInBatches(
  asyncIterator: AsyncIterator<ArrayBuffer> | Iterator<ArrayBuffer>,
  options: object,
  context
): AsyncIterator<ShapefileOutput>;

export function parseShapefile(
  arrayBuffer: ArrayBuffer,
  options: object,
  context
): Promise<ShapefileOutput>;

export function loadShapefileSidecarFiles(
  options: object,
  context
): {
  shx: SHXOutput;
  cpg: string;
  prj: string;
};

/**
 * Replace the extension at the end of a path.
 *
 * Matches the case of new extension with the case of the original file extension,
 * to increase the chance of finding files without firing off a request storm looking for various case combinations
 *
 * NOTE: Extensions can be both lower and uppercase
 * per spec, extensions should be lower case, but that doesn't mean they always are. See:
 * calvinmetcalf/shapefile-js#64, mapserver/mapserver#4712
 * https://trac.osgeo.org/mapserver/ticket/166
 */
export function replaceExtension(url: string, newExtension: string): string;
